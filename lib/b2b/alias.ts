import type { SenderRole } from './types'

const HEBREW_ORDINALS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳']

export function sellerAlias(index: number): string {
  if (index < HEBREW_ORDINALS.length) return `ספק ${HEBREW_ORDINALS[index]}`
  return `ספק ${index + 1}`
}

export function aliasFor(role: SenderRole, sellerIndex: number): string {
  if (role === 'buyer') return 'קונה'
  if (role === 'admin') return 'מתאם'
  return sellerAlias(sellerIndex)
}
