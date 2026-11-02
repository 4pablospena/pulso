export default defineEventHandler((event) => daySummary(getRouterParam(event, 'date')!))
