import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { googleAuthService } from '../../services/googleAuth';
import { ExternalLink, Copy, Check, Cloud, Key, ShieldCheck } from 'lucide-react';

interface GoogleSyncSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientIdSaved?: () => void;
}

export const GoogleSyncSetupModal: React.FC<GoogleSyncSetupModalProps> = ({
  isOpen,
  onClose,
  onClientIdSaved,
}) => {
  const [clientIdInput, setClientIdInput] = useState<string>(googleAuthService.getClientId());
  const [copiedOrigin, setCopiedOrigin] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    googleAuthService.setCustomClientId(clientIdInput.trim());
    setSavedSuccess(true);
    if (onClientIdSaved) {
      onClientIdSaved();
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Drive Cloud Sync Setup" maxWidth="2xl">
      <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300">
        {/* Intro */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
          <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-emerald-900 dark:text-emerald-200">
              Private Peer-to-Cloud Sync (Zero External Servers)
            </p>
            <p className="text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
              DhanVeda syncs directly to a private hidden folder in your own Google Drive (<code className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded">appDataFolder</code>). It is completely invisible in normal Drive and cannot be accessed by third parties.
            </p>
          </div>
        </div>

        {/* 4 Steps */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            Quick 4-Step Setup in Google Cloud Console
          </h4>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-3 bg-slate-50 dark:bg-[#171E2A] rounded-xl border border-slate-200/80 dark:border-[#202836] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  1. Create a Google Cloud Project & Enable Drive API
                </span>
                <a
                  href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-[#F5B742] font-bold hover:underline"
                >
                  <span>Open Drive API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a project named <strong>DhanVeda</strong> and click <strong>Enable</strong> for the Google Drive API.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-50 dark:bg-[#171E2A] rounded-xl border border-slate-200/80 dark:border-[#202836] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  2. Configure OAuth Consent Screen
                </span>
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-[#F5B742] font-bold hover:underline"
                >
                  <span>Consent Screen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose <strong>External</strong> User Type. Add your app name, support email, and under <strong>Test Users</strong>, add your personal Gmail address.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-slate-50 dark:bg-[#171E2A] rounded-xl border border-slate-200/80 dark:border-[#202836] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  3. Create Web OAuth 2.0 Client ID
                </span>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-[#F5B742] font-bold hover:underline"
                >
                  <span>Credentials</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create Credentials &gt; OAuth client ID &gt; Application type: <strong>Web application</strong>. Under <strong>Authorized JavaScript origins</strong>, add:
              </p>
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-[#131822] rounded-lg border border-slate-200/80 dark:border-[#202836] font-mono text-xs">
                <span className="truncate">{currentOrigin}</span>
                <button
                  type="button"
                  onClick={handleCopyOrigin}
                  className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 rounded text-[11px] font-sans font-bold shrink-0 transition-colors border border-slate-200/60 dark:border-[#202836]"
                >
                  {copiedOrigin ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOrigin ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Paste Client ID */}
        <form onSubmit={handleSave} className="space-y-3 pt-1 border-t border-slate-200/80 dark:border-[#202836]">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            4. Paste Your Google OAuth Client ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={clientIdInput}
              onChange={e => setClientIdInput(e.target.value)}
              placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
              className="w-full py-2.5 px-3 pr-10 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>

          <p className="text-[11px] text-slate-400">
            Alternatively, you can place <code className="font-mono bg-slate-100 dark:bg-[#171E2A] border border-slate-200/60 dark:border-[#202836] px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID="..."</code> in your <code className="font-mono">.env.local</code> file.
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Free &amp; permanent for personal use</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!clientIdInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Client ID</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
