import { Transaction, StagedTransaction } from '../types/finance';

/**
 * Calculates simple similarity between two strings (0 to 1)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Word token overlap
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  return (2 * intersection) / (words1.size + words2.size);
}

/**
 * Checks staged transactions against existing transactions and flags duplicates
 */
export function flagDuplicates(
  stagedList: Omit<StagedTransaction, 'isDuplicate' | 'duplicateReason'>[],
  existingList: Transaction[]
): StagedTransaction[] {
  return stagedList.map(staged => {
    // 1. Check referenceId exact match
    if (staged.referenceId) {
      const refMatch = existingList.find(
        e => e.referenceId && e.referenceId.toLowerCase() === staged.referenceId?.toLowerCase()
      );
      if (refMatch) {
        return {
          ...staged,
          isDuplicate: true,
          duplicateReason: `Exact reference ID match (#${staged.referenceId})`,
          selected: false,
        };
      }
    }

    // 2. Check Date + Amount + Type exact match
    const exactMatch = existingList.find(e => {
      const dateMatch = e.date === staged.date;
      const amountMatch = Math.abs(e.amount - staged.amount) < 0.01;
      const typeMatch = e.type === staged.type;
      return dateMatch && amountMatch && typeMatch;
    });

    if (exactMatch) {
      const similarity = stringSimilarity(exactMatch.description, staged.description);
      if (similarity > 0.4 || exactMatch.category === staged.category) {
        return {
          ...staged,
          isDuplicate: true,
          duplicateReason: `Matches existing ₹${staged.amount} on ${staged.date} ("${exactMatch.description.slice(0, 25)}...")`,
          selected: false,
        };
      }
    }

    // Also check intra-batch duplicates (same file containing duplicates)
    return {
      ...staged,
      isDuplicate: false,
      selected: true,
    };
  });
}
