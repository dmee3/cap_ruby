import { PillTone } from '../react/components/Pill'

/**
 * Payment-type presentation, shared by the payments list and Member 360 so a
 * Cash row looks the same wherever it appears.
 */
const TONE: Record<string, PillTone> = {
  Cash: 'success',
  Stripe: 'neutral',
}

export const typeTone = (name: string): PillTone => TONE[name] ?? 'neutral'

/**
 * Stripe and Square rows are created by a checkout flow, not by hand — they
 * have no manual edit or delete path.
 */
export const isMachineRecorded = (name: string): boolean =>
  name === 'Stripe' || name.startsWith('Square')
