import { usePreferredLanguages } from '@vueuse/core'
import { createI18n } from 'vue-i18n'
import en from '../../i18n/en.json'
import it from '../../i18n/it.json'

// The interface follows the language of the browser, or the one chosen with
// the selector of development. English is the source language of the texts
// and the fallback for missing keys
export default defineNuxtPlugin((nuxtApp) => {
  const languages = usePreferredLanguages()
  const i18n = createI18n({
    legacy: false,
    locale: pickLocale(languages.value).locale,
    fallbackLocale: 'en',
    messages: { en, it }
  })
  watchEffect(() => {
    const picked = pickLocale(languages.value)
    const locale = localeOverride.value ?? picked.locale
    i18n.global.locale.value = locale
    // The regional format of the browser, when its language is the same
    intlLocale.value = locale === picked.locale ? picked.tag : locale
  })
  nuxtApp.vueApp.use(i18n)
})
