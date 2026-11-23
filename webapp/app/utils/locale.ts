import { shallowRef } from 'vue'

export const LOCALES = ['it', 'en'] as const
export type Locale = (typeof LOCALES)[number]

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
