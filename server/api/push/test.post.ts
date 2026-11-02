export default defineEventHandler(async (event) => {
  const sent = await pushTo(currentUser(event)?.id ?? null, 'test', {
    title: 'Pulso', body: 'Las notificaciones funcionan en este dispositivo.', tag: 'test',
  })
  return { sent }
})
