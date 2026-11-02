export default defineEventHandler(async () => ({
  configured: pushConfigured(),
  scheduling: schedulingConfigured(),
  devices: (await pushSubs.get()).length,
}))
