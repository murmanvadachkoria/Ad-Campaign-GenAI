import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache translations to avoid redundant API calls within a session
const translationCache = new Map();

export const SUPPORTED_LOCALES = {
  'en': { label: 'English', nativeName: 'English' },
  'es': { label: 'Spanish', nativeName: 'Español' },
  'fr': { label: 'French', nativeName: 'Français' },
  'de': { label: 'German', nativeName: 'Deutsch' },
  'ja': { label: 'Japanese', nativeName: '日本語' },
  'pt': { label: 'Portuguese', nativeName: 'Português' },
  'zh': { label: 'Chinese (Simplified)', nativeName: '中文' },
  'ar': { label: 'Arabic', nativeName: 'العربية' },
};

/**
 * Translate a campaign message to the target locale.
 * Returns English unchanged. Uses GPT for other locales.
 */
export async function translateMessage(message, locale) {
  if (!locale || locale === 'en') return message;

  const cacheKey = `${locale}::${message}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const localeInfo = SUPPORTED_LOCALES[locale];
  if (!localeInfo) {
    console.warn(`⚠️  Unknown locale "${locale}", falling back to English`);
    return message;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional marketing copywriter. Translate the given advertising message to ${localeInfo.label} (${localeInfo.nativeName}). Preserve the tone, energy, and punch of the original. Return ONLY the translated text — no explanations, no quotes.`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0.4,
    });

    const translated = response.choices[0].message.content.trim();
    translationCache.set(cacheKey, translated);
    console.log(`  🌐 Translated [${locale}]: "${translated}"`);
    return translated;
  } catch (err) {
    console.error(`  ⚠️  Translation failed for locale ${locale}:`, err.message);
    return message; // graceful fallback to English
  }
}
