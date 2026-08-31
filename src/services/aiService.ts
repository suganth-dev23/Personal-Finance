import { AISettings, AIProvider } from '../types/finance';
import { formatINR } from '../utils/currency';

export const DEFAULT_AI_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-3.7-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
};

export function resolveAIModel(provider: AIProvider, model?: string): string {
  const candidate = model?.trim();
  if (candidate) return candidate;
  return DEFAULT_AI_MODELS[provider];
}

export interface FinancialAggregates {
  currentMonthName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number;
  categorySpending: { category: string; spent: number; budget?: number; percentUsed?: number }[];
  emergencyFund: {
    target: number;
    saved: number;
    monthsCovered: number;
    targetMonths: number;
  };
  investments: {
    totalInvested: number;
    currentValue: number;
    totalGainLoss: number;
    gainLossPercent: number;
    breakdown: { type: string; value: number }[];
  };
  goals: {
    name: string;
    target: number;
    saved: number;
    targetDate?: string;
    percentComplete: number;
  }[];
}

export function buildAIPrompt(data: FinancialAggregates): string {
  const categoriesText = data.categorySpending
    .map(c => `- ${c.category}: ${formatINR(c.spent)} (Budget: ${c.budget ? formatINR(c.budget) : 'None'}${c.percentUsed ? `, ${c.percentUsed.toFixed(0)}% used` : ''})`)
    .join('\n');

  const goalsText = data.goals.length > 0
    ? data.goals.map(g => `- ${g.name}: ${formatINR(g.saved)} / ${formatINR(g.target)} (${g.percentComplete.toFixed(0)}% done, target: ${g.targetDate || 'Flexible'})`).join('\n')
    : 'No active goals set yet.';

  const investmentText = data.investments.breakdown.length > 0
    ? data.investments.breakdown.map(i => `- ${i.type}: ${formatINR(i.value)}`).join('\n')
    : 'No investments logged yet.';

  return `You are a certified, friendly personal finance advisor specializing in Indian personal finance (INR ₹, Indian tax-saving instruments like PPF/NPS/ELSS, emergency funds, SIPs, and cost of living in India).

Analyze the following user's aggregated financial health data for the month of ${data.currentMonthName}:

### FINANCIAL SNAPSHOT (all figures in INR ₹):
- **Monthly Income**: ${formatINR(data.monthlyIncome)}
- **Monthly Expenses**: ${formatINR(data.monthlyExpenses)}
- **Net Monthly Savings**: ${formatINR(data.netSavings)} (${data.savingsRate.toFixed(1)}% savings rate)

### EXPENSES BY CATEGORY & BUDGETS:
${categoriesText}

### EMERGENCY FUND:
- Saved: ${formatINR(data.emergencyFund.saved)} / Target: ${formatINR(data.emergencyFund.target)} (${data.emergencyFund.monthsCovered.toFixed(1)} months of expenses covered, target is ${data.emergencyFund.targetMonths} months)

### INVESTMENTS PORTFOLIO:
- Total Invested: ${formatINR(data.investments.totalInvested)}
- Current Valuation: ${formatINR(data.investments.currentValue)} (Gain/Loss: ${data.investments.totalGainLoss >= 0 ? '+' : ''}${formatINR(data.investments.totalGainLoss)} / ${data.investments.gainLossPercent.toFixed(1)}%)
- Asset Breakdown:
${investmentText}

### DREAMS & FINANCIAL GOALS:
${goalsText}

---

### INSTRUCTIONS:
Please provide a clear, concise, well-structured financial health summary formatted in clean GitHub-style Markdown:

1. **Overall Health & Trend** (Rate health score out of 100 with a quick 2-3 sentence overview on cash flow, savings rate, and financial runway).
2. **Key Strengths** (2 bullet points on what the user is doing well).
3. **2-3 Actionable Insights & Tweaks** (Specific, practical recommendations tailored to the Indian context, e.g. reducing overspent categories, optimizing SIPs, or expediting the emergency fund).
4. **Encouraging Note** (A short motivating sign-off).

Keep the tone encouraging, objective, and easy to skim. Use the ₹ symbol with Indian number formatting.`;
}

export async function generateFinancialSummary(
  settings: AISettings,
  data: FinancialAggregates
): Promise<string> {
  const { provider, apiKey, model } = settings;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`API key for ${provider.toUpperCase()} is missing. Please set your key in Settings or the AI tab.`);
  }

  const prompt = buildAIPrompt(data);

  try {
    if (provider === 'gemini') {
      const selectedModel = resolveAIModel(provider, model);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status} - ${response.statusText}`;
        throw new Error(`Google Gemini Error: ${errMsg}`);
      }

      const json = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned an empty response. Please verify your prompt or API quota.');
      }
      return text;
    }

    if (provider === 'openai') {
      const selectedModel = resolveAIModel(provider, model);
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert Indian personal finance advisor and certified wealth planner.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status} - ${response.statusText}`;
        throw new Error(`OpenAI Error: ${errMsg}`);
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('OpenAI returned an empty response.');
      }
      return text;
    }

    if (provider === 'anthropic') {
      const selectedModel = resolveAIModel(provider, model);
      const endpoint = 'https://api.anthropic.com/v1/messages';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status} - ${response.statusText}`;
        throw new Error(`Anthropic Error: ${errMsg}`);
      }

      const json = await response.json();
      const text = json?.content?.[0]?.text;
      if (!text) {
        throw new Error('Anthropic Claude returned an empty response.');
      }
      return text;
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Network/CORS error connecting to ${provider.toUpperCase()}. Check your internet connection or verify provider browser access.`);
    }
    throw err;
  }
}
