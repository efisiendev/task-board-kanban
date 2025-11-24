import { describe, it, expect } from 'vitest'

describe('Task utilities', () => {
  it('calculates order_index between two numbers', () => {
    const between = (a: number, b: number) => (a + b) / 2
    expect(between(1, 2)).toBe(1.5)
  })

  it('handles decimal precision', () => {
    const between = (a: number, b: number) => (a + b) / 2
    expect(between(1.0, 1.001)).toBeCloseTo(1.0005)
  })
})
