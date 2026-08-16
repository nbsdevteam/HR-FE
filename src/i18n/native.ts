import i18n, { normalizeLanguage } from "./index";
import { translateArabicSource } from "./legacy";

function localizeMessage(message: string): string {
  return translateArabicSource(
    message,
    normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
  );
}

export function localizedAlert(message: string): void {
  window.alert(localizeMessage(message));
}

export function localizedConfirm(message: string): boolean {
  return window.confirm(localizeMessage(message));
}

export function localizedPrompt(
  message: string,
  defaultValue?: string,
): string | null {
  return window.prompt(localizeMessage(message), defaultValue);
}
