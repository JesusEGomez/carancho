import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/productos',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import { PriceRangeFilter } from '@/components/store/PriceRangeFilter'

function getSlider() {
  return screen.getByRole('slider', { name: /precio máximo/i }) as HTMLInputElement
}

describe('PriceRangeFilter', () => {
  afterEach(() => {
    cleanup()
  })

  it('resets the draft value when the value prop changes', () => {
    const { rerender } = render(<PriceRangeFilter maxValue={100000} value={100000} />)

    fireEvent.change(getSlider(), { target: { value: '40000' } })
    expect(getSlider().value).toBe('40000')

    rerender(<PriceRangeFilter maxValue={100000} value={25000} />)
    expect(getSlider().value).toBe('25000')
  })

  it('keeps the user draft while the value prop stays the same', () => {
    const { rerender } = render(<PriceRangeFilter maxValue={100000} value={100000} />)

    fireEvent.change(getSlider(), { target: { value: '60000' } })
    rerender(<PriceRangeFilter maxValue={100000} value={100000} />)

    expect(getSlider().value).toBe('60000')
  })
})
