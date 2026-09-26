/**
 * Safe clipboard copy with fallback for insecure HTTP contexts (e.g. mobile over LAN IP).
 * In insecure contexts (non-localhost HTTP), navigator.clipboard is undefined.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
  }

  // Fallback for non-secure HTTP contexts (e.g. LAN IP on mobile)
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.error('All clipboard operations failed:', err);
  }

  return false;
}
