import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { normalizeLanguage, type AppLanguage } from "./index";
import { containsCataloguedArabicSource, translateArabicSource } from "./legacy";

const originalText = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const localizableAttributes = ["placeholder", "title", "aria-label", "alt"];
const ignoredSelector = "script, style, [data-i18n-ignore]";
const arabicPattern = /\p{Script=Arabic}/u;

function shouldIgnore(node: Node): boolean {
  const element = node.nodeType === Node.ELEMENT_NODE
    ? (node as Element)
    : node.parentElement;
  return Boolean(element?.closest(ignoredSelector));
}

function localizeTextNode(node: Text, language: AppLanguage): void {
  if (shouldIgnore(node)) return;
  const current = node.nodeValue ?? "";
  const remembered = originalText.get(node);

  if (arabicPattern.test(current) && containsCataloguedArabicSource(current)) {
    originalText.set(node, current);
  } else if (!remembered) {
    return;
  }

  const source = originalText.get(node) ?? current;
  const next = language === "ar" ? source : translateArabicSource(source, language);
  if (current !== next) node.nodeValue = next;
}

function localizeElement(element: Element, language: AppLanguage): void {
  if (element.matches(ignoredSelector) || element.closest("[data-i18n-ignore]")) return;
  let stored = originalAttributes.get(element);
  if (!stored) {
    stored = new Map();
    originalAttributes.set(element, stored);
  }

  for (const attribute of localizableAttributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    if (arabicPattern.test(current) && containsCataloguedArabicSource(current)) {
      stored.set(attribute, current);
    }
    const source = stored.get(attribute);
    if (!source) continue;
    const next = language === "ar" ? source : translateArabicSource(source, language);
    if (current !== next) element.setAttribute(attribute, next);
  }
}

function localizeTree(root: Node, language: AppLanguage): void {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root as Text, language);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const element = root as Element;
  localizeElement(element, language);
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) localizeTextNode(current as Text, language);
    else localizeElement(current as Element, language);
    current = walker.nextNode();
  }
}

const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<AppLanguage>(
    normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
  );

  useEffect(() => {
    const handleLanguage = (nextLanguage: string) => {
      setLanguage(normalizeLanguage(nextLanguage));
    };
    i18n.on("languageChanged", handleLanguage);
    return () => {
      i18n.off("languageChanged", handleLanguage);
    };
  }, []);

  useEffect(() => {
    const root = document.body;
    localizeTree(root, language);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          localizeTextNode(mutation.target as Text, language);
        } else if (mutation.type === "attributes") {
          localizeElement(mutation.target as Element, language);
        } else {
          mutation.addedNodes.forEach((node) => localizeTree(node, language));
        }
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: localizableAttributes,
    });
    return () => observer.disconnect();
  }, [language]);

  const localizedChildren = Children.map(children, (child) =>
    isValidElement(child) ? cloneElement(child) : child,
  );

  return (
    <I18nextProvider i18n={i18n}>
      {localizedChildren}
    </I18nextProvider>
  );
};

export default LocalizationProvider;
