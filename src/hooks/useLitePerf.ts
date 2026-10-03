import { useState, useEffect } from 'react';

export function getIsLitePerf(): boolean {
  if (typeof window === 'undefined') return false;
  const attr = document.documentElement.getAttribute('data-perf');
  if (attr === 'lite') return true;
  if (attr === 'full') return false;
  try {
    const perf = localStorage.getItem('dhanveda_perf');
    if (perf === 'lite') return true;
    if (perf === 'full') return false;
  } catch {}
  const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                   ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4);
  return Boolean(isLowEnd);
}

export function useLitePerf(): boolean {
  const [isLite, setIsLite] = useState(getIsLitePerf);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsLite(getIsLitePerf());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-perf'],
    });
    return () => observer.disconnect();
  }, []);

  return isLite;
}
