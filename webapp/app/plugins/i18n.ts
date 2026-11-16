import { createI18n } from 'vue-i18n'
import en from '../../i18n/en.json'
import it from '../../i18n/it.json'

// The interface is in Italian only; English is the source language of the
// texts and the fallback for missing keys
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    fallbackLocale: 'en',
    messages: { en, it }
  })
  nuxtApp.vueApp.use(i18n)
})
