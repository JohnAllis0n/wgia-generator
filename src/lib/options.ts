export const SUBJECTS = ['girl', 'man'] as const
export type Subject = (typeof SUBJECTS)[number]

export const COLORS = [
  { name: 'Red', value: '#e91516' },
  { name: 'Cyan', value: '#08eaeb' },
] as const
export type CardColor = (typeof COLORS)[number]['value']
