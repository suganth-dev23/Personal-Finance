import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  RefreshCw,
  FileCheck,
  SlidersHorizontal,
  MessageSquare,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
import { StagedTransaction } from '../../types/finance';
import { parseCSVStatement } from '../../utils/csvParser';
import { parsePDFStatement } from '../../utils/pdfParser';
import { parseSMSBatch } from '../../services/smsParser';
import { flagDuplicates } from '../../utils/deduplicator';
import { sanitizeDateString, getTodayString } from '../../utils/date';
import { roundCurrency } from '../../utils/currency';
import { ReviewStagingTable } from './ReviewStagingTable';
import { AutoRuleManagerModal } from './AutoRuleManagerModal';
import { Modal } from '../common/Modal';

export const StatementImportView: React.FC = () => {
  const {
    transactions,
    categories,
    addMultipleTransactions,
    setCurrentView,
  } = useFinance();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ page: number; totalPages: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [stagedList, setStagedList] = useState<StagedTransaction[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAutoRuleModalOpen, setIsAutoRuleModalOpen] = useState<boolean>(false);

  // Password-protected PDF support
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // SMS Text Import support
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsInputText, setSmsInputText] = useState('');
  const [smsParseError, setSmsParseError] = useState<string | null>(null);

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    // File size guard: 20MB
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const err = 'File size exceeds the 20MB limit. Please upload a smaller statement file.';
      setParseError(err);
      showToast('danger', 'File Too Large', err);
      return;
    }

    // Empty file guard
    if (file.size === 0) {
      const err = 'The selected statement file is empty (0 bytes). Please upload a valid bank statement.';
      setParseError(err);
      showToast('danger', 'Empty File', err);
      return;
    }

    const isCsv = file.name.endsWith('.csv') || file.type.includes('csv');
    const isPdf = file.name.endsWith('.pdf') || file.type.includes('pdf');

    if (!isCsv && !isPdf) {
      const err = 'Please upload a valid .CSV or .PDF statement file.';
      setParseError(err);
      showToast('danger', 'Unsupported File', err);
      return;
    }

    setParsing(true);
    setPdfProgress(null);
    setParseError(null);
    setFileName(file.name);

    try {
      let rawParsed: StagedTransaction[] = [];

      if (isCsv) {
        const result = await parseCSVStatement(file);
        if (result.errors.length > 0 && result.transactions.length === 0) {
          throw new Error(result.errors.join(', '));
        }
        rawParsed = result.transactions;
      } else {
        const result = await parsePDFStatement(file, progress => {
          setPdfProgress(progress);
        });

        // Handle password protected PDF gracefully
        if (result.isPasswordProtected) {
          setPendingPdfFile(file);
          setIsPasswordModalOpen(true);
          setPasswordError(result.errors[0] || 'This statement is password protected.');
          showToast('warning', 'Password Protected', 'Please enter your statement password to unlock.', 4000);
          return;
        }

        if (result.errors.length > 0 && result.transactions.length === 0) {
          throw new Error(result.errors.join(', '));
        }
        rawParsed = result.transactions;
      }

      if (rawParsed.length === 0) {
        throw new Error('No transaction rows could be extracted from this document. Please check the file format or try a CSV statement.');
      }

      // Check duplicates against existing state
      const flagged = flagDuplicates(rawParsed, transactions);
      setStagedList(flagged);
      showToast('success', 'Statement Parsed', `${flagged.length} transactions ready for review`, 3000);
    } catch (err: any) {
      const msg = err?.message || 'Failed to parse file.';
      setParseError(msg);
      showToast('danger', 'Import Failed', msg, 6000);
    } finally {
      setParsing(false);
      setPdfProgress(null);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPdfFile || !pdfPassword.trim()) {
      setPasswordError('Please enter a password.');
      return;
    }

    setParsing(true);
    setPasswordError(null);

    try {
      const result = await parsePDFStatement(
        pendingPdfFile,
        progress => setPdfProgress(progress),
        pdfPassword.trim()
      );

      if (result.isPasswordProtected) {
        setPasswordError(result.errors[0] || 'Incorrect password for this PDF statement.');
        return;
      }

      if (result.errors.length > 0 && result.transactions.length === 0) {
        throw new Error(result.errors.join(', '));
      }

      if (result.transactions.length === 0) {
        throw new Error('No transaction rows could be extracted from this document.');
      }

      const flagged = flagDuplicates(result.transactions, transactions);
      setStagedList(flagged);
      setIsPasswordModalOpen(false);
      setPendingPdfFile(null);
      setPdfPassword('');
      showToast('success', 'Statement Decrypted & Parsed', `${flagged.length} transactions ready for review`, 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to decrypt PDF with the provided password.');
    } finally {
      setParsing(false);
      setPdfProgress(null);
    }
  };

  const handleParseSms = () => {
    if (!smsInputText.trim()) {
      setSmsParseError('Please paste at least one bank transaction SMS message.');
      return;
    }

    setSmsParseError(null);
    const result = parseSMSBatch(smsInputText);

    if (result.transactions.length === 0) {
      const err = result.errors.length > 0
        ? result.errors.join(', ')
        : 'Could not detect any valid bank transaction SMS messages in the pasted text.';
      setSmsParseError(err);
      return;
    }

    const flagged = flagDuplicates(result.transactions, transactions);
    setStagedList(flagged);
    setFileName('Pasted Bank SMS Messages');
    setIsSmsModalOpen(false);
    setSmsInputText('');
    showToast('success', 'SMS Messages Parsed', `${flagged.length} transactions ready for review`, 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleToggleSelect = (tempId: string) => {
    setStagedList(prev =>
      prev ? prev.map(t => (t.tempId === tempId ? { ...t, selected: !t.selected } : t)) : null
    );
  };

  const handleToggleSelectAll = () => {
    setStagedList(prev => {
      if (!prev) return null;
      const allSelected = prev.every(t => t.selected);
      return prev.map(t => ({ ...t, selected: !allSelected }));
    });
  };

  const handleSelectAllAcrossPages = (select: boolean) => {
    setStagedList(prev =>
      prev ? prev.map(t => ({ ...t, selected: select })) : null
    );
  };

  const handleUpdateRow = (tempId: string, updated: Partial<StagedTransaction>) => {
    setStagedList(prev =>
      prev ? prev.map(t => (t.tempId === tempId ? { ...t, ...updated } : t)) : null
    );
  };

  const handleRemoveRow = (tempId: string) => {
    setStagedList(prev => (prev ? prev.filter(t => t.tempId !== tempId) : null));
  };

  const handleExcludeDuplicates = () => {
    setStagedList(prev =>
      prev ? prev.map(t => (t.isDuplicate ? { ...t, selected: false } : t)) : null
    );
  };

  const handleInvertAllTypes = () => {
    setStagedList(prev =>
      prev
        ? prev.map(t => ({
            ...t,
            type: t.type === 'credit' ? 'debit' : 'credit',
          }))
        : null
    );
    showToast('info', 'Flipped Transaction Types', 'Inverted inflow (credit) and outflow (debit) across all staged rows', 3000);
  };

  const handleRemoveSelected = () => {
    setStagedList(prev => (prev ? prev.filter(t => !t.selected) : null));
    showToast('info', 'Rows Excluded', 'Excluded selected rows from staging', 3000);
  };

  const handleBulkSetCategory = (catName: string) => {
    setStagedList(prev =>
      prev ? prev.map(t => (t.selected ? { ...t, category: catName } : t)) : null
    );
    showToast('success', 'Categories Updated', `Updated category to "${catName}" for selected transactions`, 3000);
  };

  const handleFinalImport = () => {
    if (!stagedList) return;
    const selected = stagedList.filter(t => t.selected);

    if (selected.length === 0) {
      alert('Please select at least one transaction row to import.');
      return;
    }

    const invalidRow = selected.find(s => isNaN(s.amount) || s.amount <= 0);
    if (invalidRow) {
      alert('All transactions to import must have an amount greater than ₹0.');
      return;
    }

    const payload = selected.map(s => ({
      date: sanitizeDateString(s.date) || getTodayString(),
      amount: roundCurrency(s.amount),
      type: s.type,
      category: s.category,
      paymentMethod: s.paymentMethod,
      description: s.description.trim() || 'Imported Transaction',
      source: 'imported' as const,
      referenceId: s.referenceId,
    }));

    addMultipleTransactions(payload);
    showToast('success', 'Import Successful', `Imported ${selected.length} transactions into your ledger`, 4000);
    setSuccessMessage(`Successfully imported ${selected.length} transactions!`);
    setStagedList(null);
    setTimeout(() => {
      setCurrentView('transactions');
    }, 1500);
  };

  const handleDownloadSampleCSV = () => {
    const sampleCsv = `Date,Narration,Chq/Ref Number,Withdrawal Amt,Deposit Amt,Balance
2026-08-28,UPI-SWIGGY-19283 Bangalore,UPI-89218273,480.00,,45200.00
2026-08-27,ZEPTO INSTANT GROCERIES,UPI-98218281,640.00,,45680.00
2026-08-26,HDFC SALARY TECH CORP,ACH-098219,,145000.00,46320.00
2026-08-25,ZERODHA BROKING SIP,ACH-981291,15000.00,,191320.00
2026-08-24,HP PETROL PUMP WHITEFIELD,POS-882199,2400.00,,206320.00
2026-08-23,AMAZON PAY INDIA E-COM,ECOM-44812,3850.00,,208720.00
2026-08-22,CRED CARD REWARD CASHBACK,CRED-99812,,1250.00,212570.00
2026-08-20,NETFLIX INDIA STREAMING,ECOM-0012,649.00,,211320.00`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_indian_bank_statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-surface text-ink-1 p-6 sm:p-8 border border-line shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <UploadCloud className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                STATEMENT IMPORT ENGINE
              </span>
            </div>
            <p className="text-xs text-ink-3 mb-1">
              Bank, UPI &amp; SMS Statement Parser
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-ink-1">
                Statement Center
              </h2>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                zero server upload
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-3">
              Private client-side statement extraction for HDFC, SBI, ICICI, Axis, Kotak, GPay, PhonePe &amp; Paytm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSmsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sunken hover:bg-line text-ink-2 border border-line text-xs sm:text-sm font-bold transition-colors min-h-[44px] cursor-pointer"
              title="Paste raw bank alert SMS texts to parse transactions"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Paste Bank SMS</span>
            </button>
            <button
              onClick={() => setIsAutoRuleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sunken hover:bg-line text-ink-2 border border-line text-xs sm:text-sm font-bold transition-colors min-h-[44px] cursor-pointer"
              title="Manage keyword and regex auto-categorization rules"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Auto-Rules</span>
            </button>
            <button
              onClick={handleDownloadSampleCSV}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sunken hover:bg-line text-ink-2 border border-line text-xs sm:text-sm font-bold transition-colors min-h-[44px] cursor-pointer"
              title="Download a test CSV statement to verify parsing"
            >
              <Download className="w-4 h-4 text-reward" />
              <span>Sample CSV</span>
            </button>
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-line">
          <div className="rounded-2xl bg-sunken p-3.5 border border-line/60">
            <span className="text-xs text-ink-3">Formats Supported</span>
            <p className="text-lg font-bold font-numeric text-ink-1 mt-0.5">CSV, PDF &amp; SMS</p>
          </div>
          <div className="rounded-2xl bg-sunken p-3.5 border border-line/60">
            <span className="text-xs text-ink-3">Privacy Architecture</span>
            <p className="text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">100% Client-Side</p>
          </div>
          <div className="rounded-2xl bg-sunken p-3.5 border border-line/60">
            <span className="text-xs text-ink-3">Parser Pipeline</span>
            <p className="text-lg font-bold font-numeric text-teal-600 dark:text-teal-400 mt-0.5">Web Worker</p>
          </div>
          <div className="rounded-2xl bg-sunken p-3.5 border border-line/60">
            <span className="text-xs text-ink-3">Duplicate Check</span>
            <p className="text-lg font-bold font-numeric text-ink-1 mt-0.5">Active Hash</p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink-1 tracking-tight">
            Upload Bank Statement
          </h3>
          <p className="text-xs text-ink-3">
            Drag &amp; drop your statement document or click to browse (Max 20MB)
          </p>
        </div>
        <span className="text-xs font-semibold text-ink-3">
          CSV / PDF / SMS supported
        </span>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-positive-tint border border-positive/30 rounded-2xl flex items-center gap-3 text-sm text-positive font-bold">
          <CheckCircle2 className="w-5 h-5 text-positive" />
          <span>{successMessage} Redirecting to transaction history...</span>
        </div>
      )}

      {/* Parse Error Alert */}
      {parseError && (
        <div className="p-4 bg-negative-tint border border-negative/30 rounded-2xl flex items-start gap-3 text-xs text-negative font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-negative" />
          <div>
            <span className="font-bold">Parsing Error: </span>
            {parseError}
          </div>
        </div>
      )}

      {/* Drop Zone Area */}
      {!stagedList && (
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-colors duration-200 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 scale-[1.01]'
              : 'border-line bg-surface hover:border-emerald-500 shadow-xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .pdf, text/csv, application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110">
            {parsing ? (
              <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          <h3 className="mt-4 text-base sm:text-lg font-bold text-ink-1">
            {parsing
              ? pdfProgress
                ? `Extracting Page ${pdfProgress.page} of ${pdfProgress.totalPages}...`
                : 'Parsing statement off main thread...'
              : 'Click to Upload or Drag & Drop Statement'}
          </h3>

          {pdfProgress && (
            <div className="max-w-xs mx-auto mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-ink-3 font-semibold font-numeric">
                <span>Progress</span>
                <span>{Math.round((pdfProgress.page / pdfProgress.totalPages) * 100)}%</span>
              </div>
              <div
                className="w-full bg-sunken h-2 rounded-full overflow-hidden p-0.5"
                role="progressbar"
                aria-valuenow={Math.round((pdfProgress.page / pdfProgress.totalPages) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="PDF statement parsing progress"
              >
                <div
                  className="bg-emerald-500 h-full rounded-full transition-[width] duration-200"
                  style={{ width: `${(pdfProgress.page / pdfProgress.totalPages) * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-ink-3 max-w-md mx-auto">
            Supports HDFC, ICICI, SBI, Axis, Kotak, GPay, PhonePe, Paytm, and standard Indian bank export formats (.CSV / .PDF up to 20MB)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sunken text-ink-2 border border-line">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV Statements</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sunken text-ink-2 border border-line">
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>PDF Statements (Web Worker)</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sunken text-ink-2 border border-line">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>SMS Alert Texts</span>
            </span>
          </div>
        </div>
      )}

      {/* Review & Fix Staging Screen */}
      {stagedList && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-ink-1">
                  Review &amp; Fix Transactions: <span className="text-emerald-600 dark:text-emerald-400">{fileName}</span>
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  Verify dates, categories, and amounts before finalizing import
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStagedList(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-2 hover:bg-sunken transition-colors cursor-pointer"
              >
                Cancel / Upload Another
              </button>

              <button
                type="button"
                onClick={handleFinalImport}
                className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:opacity-95 text-on-primary shadow-xs text-xs sm:text-sm font-extrabold transition-colors active:scale-95 cursor-pointer"
              >
                <span>Commit &amp; Import Selected</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <ReviewStagingTable
            stagedList={stagedList}
            categories={categories}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onSelectAllAcrossPages={handleSelectAllAcrossPages}
            onUpdateRow={handleUpdateRow}
            onRemoveRow={handleRemoveRow}
            onExcludeDuplicates={handleExcludeDuplicates}
            onInvertAllTypes={handleInvertAllTypes}
            onRemoveSelected={handleRemoveSelected}
            onBulkSetCategory={handleBulkSetCategory}
          />
        </div>
      )}

      {/* Auto Rule Manager Modal */}
      <AutoRuleManagerModal
        isOpen={isAutoRuleModalOpen}
        onClose={() => setIsAutoRuleModalOpen(false)}
        categories={categories}
      />

      {/* Password Prompt Modal for Encrypted PDFs */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingPdfFile(null);
          setPdfPassword('');
          setPasswordError(null);
        }}
        title="Protected Statement"
        subtitle="This PDF bank statement is encrypted with a password"
        maxWidth="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="p-3.5 bg-sunken rounded-xl border border-line flex items-center gap-3 text-xs text-ink-2">
            <Lock className="w-5 h-5 text-reward shrink-0" />
            <div>
              <p className="font-bold text-ink-1">Password Required</p>
              <p className="text-xs text-ink-3">
                Indian bank PDFs commonly use your PAN number (uppercase), Date of Birth (DDMMYYYY), or first 4 letters of your name + birth year.
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 bg-negative-tint border border-negative/30 rounded-xl text-xs text-negative font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink-1">
              Statement Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPasswordText ? 'text' : 'password'}
                value={pdfPassword}
                onChange={e => setPdfPassword(e.target.value)}
                placeholder="Enter statement password..."
                autoFocus
                className="w-full pl-9 pr-10 py-2.5 bg-sunken border border-line rounded-xl text-xs sm:text-sm text-ink-1 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPasswordText(prev => !prev)}
                aria-label={showPasswordText ? 'Hide password' : 'Show password'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-1"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPendingPdfFile(null);
                setPdfPassword('');
                setPasswordError(null);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-ink-2 hover:bg-sunken transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsing || !pdfPassword.trim()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-primary hover:opacity-95 text-on-primary font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {parsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decrypting...</span>
                </>
              ) : (
                <span>Unlock &amp; Parse</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* SMS Statement Import Modal */}
      <Modal
        isOpen={isSmsModalOpen}
        onClose={() => {
          setIsSmsModalOpen(false);
          setSmsParseError(null);
        }}
        title="Import Bank SMS Alerts"
        subtitle="Paste transaction alert messages from your SMS inbox"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-3">
            Paste one or more bank transaction SMS messages (HDFC, SBI, ICICI, Axis, Kotak, UPI, etc.). Separate multiple messages with blank lines.
          </p>

          {smsParseError && (
            <div className="p-3 bg-negative-tint border border-negative/30 rounded-xl text-xs text-negative font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{smsParseError}</span>
            </div>
          )}

          <textarea
            rows={8}
            value={smsInputText}
            onChange={e => setSmsInputText(e.target.value)}
            placeholder="e.g.&#10;HDFC Bank: Rs 450.00 debited from A/c XX1234 to SWIGGY on 28-AUG-26. UPI Ref 89218273&#10;&#10;SBI: A/c 5678 credited by INR 15,000.00 on 25-AUG-26 by ZERODHA. Ref 981291"
            className="w-full p-3 bg-sunken border border-line rounded-xl text-xs font-mono text-ink-1 placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-ink-3">
              100% private &amp; parsed entirely in your browser
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSmsModalOpen(false);
                  setSmsParseError(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-ink-2 hover:bg-sunken transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseSms}
                disabled={!smsInputText.trim()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-primary hover:opacity-95 text-on-primary font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                Parse SMS Transactions
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
