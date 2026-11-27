// The privacy notice of a new installation, published by the application so
// that the tablet works at once: the admins replace it with a new version
export const DEFAULT_NOTICE_MD = `Gentile visitatore/fornitore,

*Nethesis Srl Unipersonale*, rappresentata dal Presidente del CdA pro tempore, quale titolare del trattamento dei dati personali, le comunica che i dati raccolti verranno utilizzati al solo fine di monitorare gli accessi all'edificio da parte di visitatori e fornitori esterni. Tale trattamento viene effettuato in funzione della sicurezza dei dipendenti, collaboratori, fornitori, visitatori e per la protezione del patrimonio informativo. In ogni momento lei avrà la possibilità di accedere ai dati per chiederne modifica, cancellazione e per esercitare i diritti di cui agli artt. 15 e ss. GDPR. Se lo ritiene, potrà poi presentare reclamo all'autorità giudiziaria e/o al Garante della Privacy. Il mancato conferimento dei dati non consentirà l'accesso all'edificio.

I dati di contatto e le modalità per l'esercizio dei suoi diritti sono disponibili nella sezione Privacy https://www.nethesis.it/privacy-policy/
`

// Publishes the default notice when no version exists yet, as on the first
// start. Never again afterwards: versions are never deleted
export function publishDefaultNotice() {
  const db = useDb()
  if (db.select({ id: schema.noticeVersion.id }).from(schema.noticeVersion).limit(1).get()) {
    return
  }
  const version = db
    .insert(schema.noticeVersion)
    .values({ bodyMd: DEFAULT_NOTICE_MD, publishedBy: 'system' })
    .returning()
    .get()
  logAudit(null, { action: 'notice.publish', details: { noticeVersionId: version.id } })
}
