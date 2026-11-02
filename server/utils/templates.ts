import type { PlannerEntry } from '#shared/core/planner'

export interface WeekTemplate {
  id: string
  name: string
  createdAt: number
  /** De lunes (0) a domingo (6). */
  days: PlannerEntry[]
}

export const weekTemplates = {
  all: () => db.kv.read<WeekTemplate[]>('week-templates', []),
  save: (list: WeekTemplate[]) => db.kv.write('week-templates', list),
}
