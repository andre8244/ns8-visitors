import { shallowRef } from 'vue'

export const LOCALES = ['it', 'en'] as const
export type Locale = (typeof LOCALES)[number]

// Each language in its own words: they are not translated
export const LOCALE_NAMES: Record<Locale, string> = { it: 'Italiano', en: 'English' }

// A language chosen on the page instead of the one of the browser: only in
// development, to try both languages without changing the browser
export const localeOverride = shallowRef<Locale | null>(null)

// The language tag of the browser that chose the language, such as "en-GB":
// dates and times follow its regional format
export const intlLocale = shallowRef<string>('en')

// The first language of the browser that the interface has, English when
// there is none
export function pickLocale(languages: readonly string[]): { locale: Locale; tag: string } {
  for (const tag of languages) {
    const locale = LOCALES.find((item) => item === tag.toLowerCase().split('-')[0])
    if (locale) return { locale, tag }
  }
  return { locale: 'en', tag: 'en' }
}
