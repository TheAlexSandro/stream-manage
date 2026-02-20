import en_message from "../Locales/English/message";
import en_button from "../Locales/English/button";

const messages = {
  en: { ...en_message, ...en_button },
};

type Lang = keyof typeof messages;
type MessageKey = keyof typeof messages.en;

export const t = (
  lang: Lang,
  key: MessageKey,
  vars: Record<string, string> = {},
): string => {
  let text = messages[lang]?.[key] || messages.en[key] || String(key);

  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${k.toUpperCase()}\\}`, "g"), v);
  }

  return text;
};
