export const SUBJECTS = ['girl', 'man'] as const
export type Subject = (typeof SUBJECTS)[number]

export const COLORS = [
  { name: '$', label: 'Red', value: '#e91516' },
  { name: 'WMIA', label: 'Cyan', value: '#08eaeb' },
] as const
export type CardColor = (typeof COLORS)[number]['value']
