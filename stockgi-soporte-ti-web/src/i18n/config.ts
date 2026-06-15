export const defaultLocale = "es-CO" as const;
export const supportedLocales = [defaultLocale] as const;
export type Locale = (typeof supportedLocales)[number];

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}