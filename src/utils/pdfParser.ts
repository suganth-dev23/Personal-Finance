import * as pdfjsLib from 'pdfjs-dist';
import { StagedTransaction } from '../types/finance';
import type { WorkerPDFResponse } from '../workers/pdfParser.worker';
import { extractTransactionsFromPDFLines } from '../workers/pdfParser.worker';

// Configure pdfjs worker in main thread as well for seamless fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  // worker option fallback
}

export interface PDFParseProgress {
  page: number;
  totalPages: number;
}

export interface PDFParseResult {
  transactions: StagedTransaction[];
  totalPages: number;
  extractedLinesCount: number;
  errors: string[];
  rawExtractedText?: string;
  isPasswordProtected?: boolean;
}

/**
 * Direct in-thread PDF statement parser (used as robust fallback)
 */
export async function parsePDFInThread(
  arrayBuffer: ArrayBuffer,
  onProgress?: (progress: PDFParseProgress) => void,
  password?: string
): Promise<PDFParseResult> {
  const errors: string[] = [];

  try {
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password,
      useWorkerFetch: false,
    }).promise;

    const lines: string[] = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      if (onProgress) {
        onProgress({ page: pageNum, totalPages });
      }

      const lineMap: Map<number, { x: number; text: string }[]> = new Map();

      textContent.items.forEach((item: any) => {
        if (!item.str || item.str.trim() === '') return;
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];

        let foundKey: number | null = null;
        for (const k of lineMap.keys()) {
          if (Math.abs(k - y) <= 4) {
            foundKey = k;
            break;
          }
        }

        if (foundKey !== null) {
          lineMap.get(foundKey)!.push({ x, text: item.str });
        } else {
          lineMap.set(y, [{ x, text: item.str }]);
        }
      });

      const sortedYKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);

      sortedYKeys.forEach((y) => {
        const rowItems = lineMap.get(y)!;
        rowItems.sort((a, b) => a.x - b.x);
        const lineStr = rowItems.map(i => i.text.trim()).join('   ').trim();
        if (lineStr.length > 0) {
          lines.push(lineStr);
        }
      });
    }

    const transactions = extractTransactionsFromPDFLines(lines);

    return {
      transactions,
      totalPages,
      extractedLinesCount: lines.length,
      errors,
      rawExtractedText: lines.slice(0, 100).join('\n'),
    };
  } catch (err: any) {
    const isPassword =
      err?.name === 'PasswordException' ||
      err?.code === 1 ||
      /password/i.test(err?.message || '');

    let errorMsg: string;
    if (isPassword) {
      errorMsg = password
        ? 'Incorrect password for this protected PDF statement. Please verify and try again.'
        : 'This PDF statement is password-protected. Please enter the password to open and extract transactions.';
    } else {
      errorMsg = err?.message || 'Failed to parse PDF document.';
    }

    return {
      transactions: [],
      totalPages: 0,
      extractedLinesCount: 0,
      errors: [errorMsg],
      isPasswordProtected: isPassword,
    };
  }
}

/**
 * Parses Bank statement PDF with Web Worker and automatic main-thread fallback
 */
export async function parsePDFStatement(
  file: File,
  onProgress?: (progress: PDFParseProgress) => void,
  password?: string
): Promise<PDFParseResult> {
  // File size guard: 20MB limit
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      transactions: [],
      totalPages: 0,
      extractedLinesCount: 0,
      errors: ['File size exceeds the 20MB limit. Please upload a smaller statement PDF.'],
    };
  }

  // Empty file guard
  if (file.size === 0) {
    return {
      transactions: [],
      totalPages: 0,
      extractedLinesCount: 0,
      errors: ['The selected PDF file is empty (0 bytes).'],
    };
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (readErr: any) {
    return {
      transactions: [],
      totalPages: 0,
      extractedLinesCount: 0,
      errors: [`Failed to read PDF file: ${readErr?.message || 'I/O Error'}`],
    };
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let hasResolved = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (worker) {
        try {
          worker.terminate();
        } catch {
          // Ignore termination errors
        }
        worker = null;
      }
    };

    const runFallback = async () => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();

      try {
        const result = await parsePDFInThread(arrayBuffer.slice(0), onProgress, password);
        resolve(result);
      } catch (err: any) {
        const isPassword =
          err?.name === 'PasswordException' ||
          err?.code === 1 ||
          /password/i.test(err?.message || '');

        resolve({
          transactions: [],
          totalPages: 0,
          extractedLinesCount: 0,
          errors: [err?.message || 'Failed to parse PDF document.'],
          isPasswordProtected: isPassword,
        });
      }
    };

    try {
      worker = new Worker(
        new URL('../workers/pdfParser.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e: MessageEvent<WorkerPDFResponse>) => {
        const data = e.data;

        if (data.type === 'progress') {
          if (onProgress) {
            onProgress({ page: data.page, totalPages: data.totalPages });
          }
        } else if (data.type === 'success') {
          hasResolved = true;
          cleanup();
          resolve({
            transactions: data.transactions,
            totalPages: data.totalPages,
            extractedLinesCount: data.extractedLinesCount,
            errors: data.errors,
            rawExtractedText: data.rawExtractedText,
          });
        } else if (data.type === 'error') {
          if (data.isPasswordProtected) {
            hasResolved = true;
            cleanup();
            resolve({
              transactions: [],
              totalPages: 0,
              extractedLinesCount: 0,
              errors: [data.error],
              isPasswordProtected: true,
            });
            return;
          }
          // Attempt main thread fallback if worker errored
          console.warn('PDF Worker failed, falling back to in-thread parsing:', data.error);
          runFallback();
        }
      };

      worker.onerror = (err) => {
        console.warn('PDF Worker onerror triggered, falling back to in-thread parsing:', err);
        runFallback();
      };

      // Clone buffer before posting in case fallback is needed
      const bufferForWorker = arrayBuffer.slice(0);
      worker.postMessage({ arrayBuffer: bufferForWorker, password }, [bufferForWorker]);

      // Safety timeout for worker (15 seconds)
      timeoutId = setTimeout(() => {
        if (!hasResolved) {
          console.warn('PDF Worker timed out after 15 seconds, triggering in-thread fallback.');
          runFallback();
        }
      }, 15000);
    } catch (workerInitErr) {
      console.warn('Could not instantiate PDF Web Worker, running in-thread:', workerInitErr);
      runFallback();
    }
  });
}
