import { Translate } from "@google-cloud/translate/build/src/v2/index.js";

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

export async function translateText(
  text: string,
  targetLanguage: "en" | "am" | "om"
): Promise<string> {
  if (!text) return "";

  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

export async function translateObject(
  obj: Record<string, any>,
  targetLanguage: "en" | "am" | "om",
  fieldsToTranslate: string[]
): Promise<Record<string, any>> {
  const translated = { ...obj };

  for (const field of fieldsToTranslate) {
    if (obj[field]) {
      translated[field] = await translateText(obj[field], targetLanguage);
    }
  }

  return translated;
}
