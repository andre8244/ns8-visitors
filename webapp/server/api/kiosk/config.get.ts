// What the tablet needs on its home page
export default defineEventHandler(async (event) => {
  const { device } = await requireKiosk(event)
  const notice = currentNotice()
  return {
    deviceName: device.name,
    theme: KIOSK_THEME_SELECTABLE ? getSettings().kioskTheme : 'light',
    notice: notice ? { id: notice.id, bodyMd: notice.bodyMd } : null,
    events: eventsToday()
  }
})
