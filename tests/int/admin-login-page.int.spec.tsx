import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ login: vi.fn() }),
}))

import AdminLoginPage from '@/app/(frontend)/(admin)/admin/login/page'

describe('AdminLoginPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the credential fields empty instead of pre-filled', () => {
    const { container } = render(<AdminLoginPage />)

    const email = container.querySelector<HTMLInputElement>('input[type="email"]')
    const password = container.querySelector<HTMLInputElement>('input[type="password"]')

    expect(email).not.toBeNull()
    expect(password).not.toBeNull()
    expect(email?.value).toBe('')
    expect(password?.value).toBe('')
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeTruthy()
  })
})
