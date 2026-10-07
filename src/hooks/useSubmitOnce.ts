import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook to guard against double or duplicate form submissions across modals.
 * Provides a synchronous in-flight ref guard and a reactive submitting state.
 */
export function useSubmitOnce() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const reset = useCallback(() => {
    submittingRef.current = false;
    setIsSubmitting(false);
  }, []);

  const startSubmit = useCallback((): boolean => {
    if (submittingRef.current) {
      return false;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    return true;
  }, []);

  useEffect(() => {
    return () => {
      submittingRef.current = false;
    };
  }, []);

  return {
    isSubmitting,
    submittingRef,
    startSubmit,
    reset,
  };
}
