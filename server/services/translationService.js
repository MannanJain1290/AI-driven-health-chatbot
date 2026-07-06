import { franc } from 'franc';

// Language code mapping (franc uses ISO 639-3, we need ISO 639-1 for Google Translate)
const LANG_MAP = {
  hin: 'hi', spa: 'es', fra: 'fr', deu: 'de', ara: 'ar',
  zho: 'zh', jpn: 'ja', por: 'pt', rus: 'ru', ben: 'bn',
  tam: 'ta', tel: 'te', kor: 'ko', ita: 'it', nld: 'nl',
  tur: 'tr', pol: 'pl', tha: 'th', vie: 'vi', ukr: 'uk',
  swe: 'sv', ron: 'ro', hun: 'hu', ces: 'cs', ell: 'el',
  heb: 'he', ind: 'id', msa: 'ms', fil: 'tl', urd: 'ur',
  mar: 'mr', guj: 'gu', kan: 'kn', mal: 'ml', pan: 'pa',
  eng: 'en', und: 'en',
};

/**
 * Detect the language of the input text.
 * Returns ISO 639-1 language code.
 */
export function detectLanguage(text) {
  if (!text || text.trim().length < 10) return 'en';
  try {
    const detected = franc(text, { minLength: 3 });
    return LANG_MAP[detected] || 'en';
  } catch {
    return 'en';
  }
}

/**
 * Translate text to English using Google Translate (free API).
 * Uses a dynamic import since the package is ESM-only.
 */
export async function translateToEnglish(text, sourceLang) {
  if (sourceLang === 'en') return text;
  try {
    const { default: translate } = await import('@vitalets/google-translate-api');
    const result = await translate(text, { from: sourceLang, to: 'en' });
    return result.text;
  } catch (error) {
    console.error('Translation to English failed:', error.message);
    return text; // Fallback: return original text
  }
}

/**
 * Translate text from English to the target language.
 */
export async function translateFromEnglish(text, targetLang) {
  if (targetLang === 'en') return text;
  try {
    const { default: translate } = await import('@vitalets/google-translate-api');
    const result = await translate(text, { from: 'en', to: targetLang });
    return result.text;
  } catch (error) {
    console.error('Translation from English failed:', error.message);
    return text; // Fallback: return original text
  }
}
