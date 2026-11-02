export default defineEventHandler(async () => {
  const { profile } = await db.settings.get()
  return (await recentActivities()).map((a) => toWorkout(a, profile.weightKg))
})
