export default defineEventHandler(async () => (await db.sessions.all()).sort((a, b) => b.start - a.start))
