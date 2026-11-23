// What the tablet needs on its home page
export default defineEventHandler(async (event) => {
  const { device } = await requireKiosk(event)
  const notice = currentNotice()
  const settings = getSettings()
  return {
    deviceName: device.name,
    theme: KIOSK_THEME_SELECTABLE ? settings.kioskTheme : 'light',
    mascot: settings.kioskMascot,
    notice: notice ? { id: notice.id, bodyMd: notice.bodyMd } : null,
    events: eventsToday()
  }
})
