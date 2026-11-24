export const SUBJECTS = ['girl', 'man'] as const
export type Subject = (typeof SUBJECTS)[number]

export const COLORS = [
  { name: '$', value: '#e91516' },
  { name: 'WMIA', value: '#08eaeb' },
] as const
export type CardColor = (typeof COLORS)[number]['value']
