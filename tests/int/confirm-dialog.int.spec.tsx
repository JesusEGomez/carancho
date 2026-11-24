import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()

  render(
    <ConfirmDialog
      cancelLabel="Volver"
      confirmLabel="Sí, cancelar orden"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open
      title="¿Cancelar la orden?"
      {...props}
    >
      <p>Detalle</p>
    </ConfirmDialog>,
  )

  return { onCancel, onConfirm }
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  it('renders an accessible alert dialog and focuses the safe action', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: '¿Cancelar la orden?' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Volver' }))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('calls the confirm and cancel callbacks', () => {
    const { onCancel, onConfirm } = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar orden' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const { onCancel } = renderDialog()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cannot be dismissed or confirmed again while confirming', () => {
    const { onCancel, onConfirm } = renderDialog({ isConfirming: true })

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('alertdialog').parentElement!)
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar orden' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))

    expect(onCancel).not.toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('renders nothing and releases the scroll lock when closed', () => {
    const { rerender } = render(
      <ConfirmDialog cancelLabel="Volver" confirmLabel="Ok" onCancel={vi.fn()} onConfirm={vi.fn()} open title="Título">
        <p>Detalle</p>
      </ConfirmDialog>,
    )

    rerender(
      <ConfirmDialog cancelLabel="Volver" confirmLabel="Ok" onCancel={vi.fn()} onConfirm={vi.fn()} open={false} title="Título">
        <p>Detalle</p>
      </ConfirmDialog>,
    )

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('falls back to the page heading when the opener is gone', () => {
    const { rerender } = render(
      <div>
        <h1>Orden #12</h1>
        <ConfirmDialog cancelLabel="Volver" confirmLabel="Ok" onCancel={vi.fn()} onConfirm={vi.fn()} open={false} title="Título">
          <p>Detalle</p>
        </ConfirmDialog>
      </div>,
    )
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    rerender(
      <div>
        <h1>Orden #12</h1>
        <ConfirmDialog cancelLabel="Volver" confirmLabel="Ok" onCancel={vi.fn()} onConfirm={vi.fn()} open title="Título">
          <p>Detalle</p>
        </ConfirmDialog>
      </div>,
    )
    opener.remove()
    rerender(
      <div>
        <h1>Orden #12</h1>
        <ConfirmDialog cancelLabel="Volver" confirmLabel="Ok" onCancel={vi.fn()} onConfirm={vi.fn()} open={false} title="Título">
          <p>Detalle</p>
        </ConfirmDialog>
      </div>,
    )

    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Orden #12' }))
  })
})
