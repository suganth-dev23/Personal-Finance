import * as pdfjsLib from 'pdfjs-dist';
import { StagedTransaction, TransactionType, PaymentMethod } from '../types/finance';
import { suggestCategory, detectPaymentMethod } from '../utils/categoryMatcher';
import { parseINR } from '../utils/currency';
import { normalizeDate } from '../utils/csvParser';

// Set worker source using Vite URL import
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  // worker option fallback
}

export interface WorkerPDFMessage {
  arrayBuffer: ArrayBuffer;
}

export type WorkerPDFResponse =
  | {
      type: 'progress';
      page: number;
      totalPages: number;
    }
  | {
      type: 'success';
      transactions: StagedTransaction[];
      totalPages: number;
      extractedLinesCount: number;
      errors: string[];
      rawExtractedText?: string;
    }
  | {
      type: 'error';
      error: string;
    };

/**
 * Extracts transactions from reconstructed tabular text lines of a PDF bank statement
 */
export function extractTransactionsFromPDFLines(lines: string[]): StagedTransaction[] {
  const dateRegex = /(\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{1,2}[-\s.][A-Za-z]{3,9}[-\s.]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b)/;
  const amountRegex = /(?:^|[\s\t])(?:\(?₹?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})|\d+(?:\.\d{1,2}))\)?(?:\s*(?:CR|DR|Cr|Dr))?)(?:[\s\t]|$)/g;

  const transactions: StagedTransaction[] = [];
  let rowIndex = 0;

  lines.forEach((line) => {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) return;

    const rawDate = dateMatch[0];
    const lineWithoutDate = line.replace(rawDate, ' ');

    // Extract amounts from line
    const matches: { rawMatch: string; numStr: string; value: number; isCr: boolean; isDr: boolean }[] = [];
    let match: RegExpExecArray | null;

    amountRegex.lastIndex = 0;
    while ((match = amountRegex.exec(lineWithoutDate)) !== null) {
      if (match[1]) {
        const numStr = match[1];
        const val = parseINR(numStr);
        if (val > 0) {
          matches.push({
            rawMatch: match[0].trim(),
            numStr,
            value: val,
            isCr: /\b(cr|credit)\b/i.test(match[0]),
            isDr: /\b(dr|debit)\b/i.test(match[0]),
          });
        }
      }
    }

    if (matches.length === 0) return;

    let type: TransactionType = 'debit';
    const isCr = /\b(CR|Credit|Deposit|Salary|Refund|Cashback|Direct Dep|ACH CR|NEFT CR|RTGS CR|UPI CR|Interest|Dividend|Received from)\b/i.test(line);
    const isDr = /\b(DR|Debit|Withdrawal|Wdl|Paid to|POS|Purchase)\b/i.test(line);

    if (matches[0].isCr || (isCr && !isDr)) {
      type = 'credit';
    } else if (matches[0].isDr || isDr) {
      type = 'debit';
    }

    const primaryAmount = matches[0];
    const amount = primaryAmount.value;

    let descCandidate = line
      .replace(rawDate, '')
      .replace(primaryAmount.rawMatch, '')
      .replace(/BALANCE|OPENING|CLOSING|TOTAL/gi, '');

    // Remove closing balance if present
    if (matches.length > 1) {
      descCandidate = descCandidate.replace(matches[matches.length - 1].rawMatch, '');
    }

    descCandidate = descCandidate
      .replace(/\b(CR|DR|Cr|Dr)\b/g, '')
      .replace(/[\s\t]+/g, ' ')
      .trim();

    if (!descCandidate || descCandidate.length < 2) {
      descCandidate = 'Bank Transaction';
    }

    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate || normalizedDate === 'NaN-NaN-NaN') return;

    const categoryMatch = suggestCategory(descCandidate);
    const paymentMethod: PaymentMethod = detectPaymentMethod(descCandidate);

    rowIndex++;
    transactions.push({
      tempId: `staged-pdf-${Date.now()}-${rowIndex}`,
      date: normalizedDate,
      amount: Number(amount.toFixed(2)),
      type: (categoryMatch.suggestedType === 'credit' && !isDr) ? 'credit' : type,
      category: categoryMatch.category,
      paymentMethod,
      description: descCandidate,
      source: 'imported',
      selected: true,
      originalRawRow: line,
    });
  });

  return transactions;
}

self.onmessage = async (e: MessageEvent<WorkerPDFMessage>) => {
  const { arrayBuffer } = e.data;
  const errors: string[] = [];

  if (!arrayBuffer) {
    self.postMessage({ type: 'error', error: 'No ArrayBuffer received in PDF worker.' } as WorkerPDFResponse);
    return;
  }

  try {
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
    }).promise;

    const lines: string[] = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Emit progress
      self.postMessage({
        type: 'progress',
        page: pageNum,
        totalPages,
      } as WorkerPDFResponse);

      // Group text items by vertical position (Y coordinate with 4px tolerance)
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

      // Sort lines top to bottom (descending Y)
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

    self.postMessage({
      type: 'success',
      transactions,
      totalPages,
      extractedLinesCount: lines.length,
      errors,
      rawExtractedText: lines.slice(0, 100).join('\n'),
    } as WorkerPDFResponse);
  } catch (err: any) {
    self.postMessage({
      type: 'error',
      error: err?.message || 'Failed to parse PDF document.',
    } as WorkerPDFResponse);
  }
};
