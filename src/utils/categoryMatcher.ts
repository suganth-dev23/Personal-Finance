/**
 * Smart Indian merchant & keyword classifier for auto-categorization
 */

export interface KeywordRule {
  keywords: string[];
  category: string;
  suggestedType?: 'credit' | 'debit';
  paymentMethod?: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Bank Transfer' | 'Cash';
}

export const DEFAULT_CATEGORY_RULES: KeywordRule[] = [
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy', 'zomato', 'mcdonald', 'domino', 'kfc', 'starbucks', 'chai point', 'chaayos',
      'burger king', 'subway', 'haldiram', 'barbeque nation', 'eatfit', 'pizzahut', 'cafe',
      'restaurant', 'dhaba', 'bakery', 'baker', 'sweet', 'sweets', 'biryani', 'tea', 'coffee'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Groceries',
    keywords: [
      'blinkit', 'zepto', 'instamart', 'bigbasket', 'bb daily', 'dmart', 'nature basket',
      'spencer', 'more retail', 'reliance fresh', 'smart bazaar', 'kirana', 'supermarket',
      'milk', 'country delight', 'vegetable', 'fruits', 'dairy'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Transport & Fuel',
    keywords: [
      'uber', 'ola', 'rapido', 'namma metro', 'delhi metro', 'dmrc', 'bmrc', 'irctc',
      'indian railway', 'petrol', 'diesel', 'fuel', 'hpcl', 'bpcl', 'ioc', 'indian oil',
      'shell', 'fastag', 'toll', 'parking', 'redbus', 'abhibus', 'auto'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'tata cliq', 'zudio',
      'westside', 'decathlon', 'h&m', 'zara', 'max fashion', 'pantaloons', 'lifestyle',
      'shoppers stop', 'croma', 'reliance digital', 'vijay sales', 'ikea', 'urban ladder'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Bills & Utilities',
    keywords: [
      'bescom', 'tata power', 'adani electricity', 'cesc', 'bses', 'mahadiscom',
      'airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'act fibernet', 'hathway', 'tata play',
      'dishtv', 'electricity', 'water board', 'gas', 'indane', 'hp gas', 'bharat gas',
      'piped gas', 'recharge', 'broadband', 'wifi', 'utility', 'maintenance'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Entertainment & OTT',
    keywords: [
      'netflix', 'hotstar', 'disney', 'prime video', 'spotify', 'youtube premium',
      'apple music', 'bookmyshow', 'pvr', 'inox', 'cinepolis', 'gaming', 'steam',
      'playstation', 'sony liv', 'zee5', 'audible'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Health & Medical',
    keywords: [
      'apollo', '1mg', 'pharmeasy', 'netmeds', 'medplus', 'practo', 'cult.fit', 'gym',
      'hospital', 'clinic', 'dentist', 'pharmacy', 'diagnostic', 'dr lal path', 'pathology',
      'consultation', 'medicine', 'opticals', 'lenskart'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Rent & Housing',
    keywords: [
      'rent', 'house rent', 'landlord', 'society maintenance', 'mygate', 'nobroker',
      'nestaway', 'flat maintenance', 'deposit'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Investments',
    keywords: [
      'zerodha', 'groww', 'indmoney', 'kuvera', 'upstox', 'angel one', 'et money',
      'sip', 'mutual fund', 'mf', 'ppf', 'nps', 'epfo', 'coin', 'smallcase', 'wint wealth',
      'fixed deposit', 'fd', 'rd', 'gold', 'sgb', 'binance', 'wazirx', 'coinswitch'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Travel & Vacation',
    keywords: [
      'makemytrip', 'mmt', 'goibibo', 'cleartrip', 'ixigo', 'indigo', 'air india',
      'spicejet', 'akasa', 'vistara', 'hotel', 'resort', 'airbnb', 'booking.com',
      'agoda', 'flight', 'trip'
    ],
    suggestedType: 'debit',
  },
  {
    category: 'Salary & Income',
    keywords: [
      'salary', 'sal', 'payroll', 'wages', 'stipend', 'bonus', 'direct dep', 'ach cr',
      'neft cr', 'rtgs cr', 'dividend', 'interest cr', 'freelance', 'client payment',
      'consulting fee', 'payout'
    ],
    suggestedType: 'credit',
  },
  {
    category: 'Cashback & Refunds',
    keywords: [
      'cashback', 'reward', 'refund', 'reversal', 'cred cash', 'google pay reward',
      'phonepe cashback', 'scratch card', 'settlement'
    ],
    suggestedType: 'credit',
  },
  {
    category: 'Credit Card Bill & Debt',
    keywords: [
      'cred', 'credit card payment', 'cc payment', 'hdfc card', 'icici card',
      'sbi card', 'axis bank cc', 'onecard', 'amex'
    ],
    suggestedType: 'debit',
  },
];

/**
 * Categorize a transaction based on description or narration
 */
export function suggestCategory(description: string, defaultFallback = 'Others'): {
  category: string;
  suggestedType?: 'credit' | 'debit';
  confidence: 'high' | 'medium' | 'low';
} {
  if (!description) {
    return { category: defaultFallback, confidence: 'low' };
  }

  const cleanText = description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  for (const rule of DEFAULT_CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      // Check whole word or substring
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(cleanText) || cleanText.includes(kw)) {
        return {
          category: rule.category,
          suggestedType: rule.suggestedType,
          confidence: 'high',
        };
      }
    }
  }

  // Check generic income terms
  if (/credit|cr\b|deposit|interest|dividend|received/i.test(cleanText)) {
    return {
      category: 'Others',
      suggestedType: 'credit',
      confidence: 'medium',
    };
  }

  return {
    category: defaultFallback,
    confidence: 'low',
  };
}

/**
 * Detect Payment Method from Indian statement narration
 */
export function detectPaymentMethod(narration: string): 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Bank Transfer' | 'Cash' | 'Cheque' | 'Other' {
  if (!narration) return 'UPI';
  const text = narration.toLowerCase();

  if (text.includes('upi') || text.includes('vpa') || text.includes('@ok') || text.includes('@okhdfc') || text.includes('@paytm') || text.includes('@ibl') || text.includes('@ybl') || text.includes('@axl')) {
    return 'UPI';
  }
  if (text.includes('pos ') || text.includes('e-com') || text.includes('card') || text.includes('visa') || text.includes('mastercard') || text.includes('rupay')) {
    return 'Debit Card';
  }
  if (text.includes('neft') || text.includes('rtgs') || text.includes('imps') || text.includes('transfer') || text.includes('trf')) {
    return 'Bank Transfer';
  }
  if (text.includes('netbanking') || text.includes('inb') || text.includes('billdesk')) {
    return 'Net Banking';
  }
  if (text.includes('atm') || text.includes('cash wdl') || text.includes('cash')) {
    return 'Cash';
  }
  if (text.includes('chq') || text.includes('cheque') || text.includes('clearing')) {
    return 'Cheque';
  }

  return 'UPI';
}
