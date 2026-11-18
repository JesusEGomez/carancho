import { describe, expect, it } from 'vitest'

import type { Access, FieldAccess, PayloadRequest } from 'payload'

import { isAdminOrSelf } from '@/access/isAdminOrSelf'
import { Users } from '@/collections/Users'

type TestUser = { id: number; role: 'admin' | 'customer' }

const admin: TestUser = { id: 1, role: 'admin' }
const customer: TestUser = { id: 2, role: 'customer' }

function buildReq(user: TestUser | null): PayloadRequest {
  return { user } as unknown as PayloadRequest
}

function runAccess(access: Access | undefined, user: TestUser | null, id?: number) {
  if (!access) {
    throw new Error('Expected access function to be defined')
  }

  return access({ id, req: buildReq(user) })
}

function getRoleFieldAccess() {
  const roleField = Users.fields.find((field) => 'name' in field && field.name === 'role')

  if (!roleField || !('access' in roleField) || !roleField.access) {
    throw new Error('Expected role field to define access')
  }

  return roleField.access as { create?: FieldAccess; update?: FieldAccess }
}

function runFieldAccess(access: FieldAccess | undefined, user: TestUser | null) {
  if (!access) {
    throw new Error('Expected field access function to be defined')
  }

  return access({ req: buildReq(user) } as Parameters<FieldAccess>[0])
}

describe('Users collection access', () => {
  it('scopes reads to self for customers and allows admins to read all', () => {
    expect(runAccess(Users.access?.read, admin)).toBe(true)
    expect(runAccess(Users.access?.read, customer)).toEqual({ id: { equals: customer.id } })
    expect(runAccess(Users.access?.read, null)).toBe(false)
  })

  it('limits customer updates to their own document', () => {
    expect(runAccess(Users.access?.update, admin, customer.id)).toBe(true)
    expect(runAccess(Users.access?.update, customer, customer.id)).toEqual({
      id: { equals: customer.id },
    })
    // Updating another user resolves to a self-only constraint that cannot match admin.id.
    expect(runAccess(Users.access?.update, customer, admin.id)).toEqual({
      id: { equals: customer.id },
    })
    expect(runAccess(Users.access?.update, null, customer.id)).toBe(false)
  })

  it('restricts create to admins since there is no public signup', () => {
    expect(runAccess(Users.access?.create, admin)).toBe(true)
    expect(runAccess(Users.access?.create, customer)).toBe(false)
    expect(runAccess(Users.access?.create, null)).toBe(false)
  })

  it('restricts delete to admins', () => {
    expect(runAccess(Users.access?.delete, admin, customer.id)).toBe(true)
    expect(runAccess(Users.access?.delete, customer, customer.id)).toBe(false)
    expect(runAccess(Users.access?.delete, null, customer.id)).toBe(false)
  })

  it('keeps customers out of the Payload admin panel', () => {
    const adminAccess = Users.access?.admin

    if (!adminAccess) {
      throw new Error('Expected admin panel access to be defined')
    }

    expect(adminAccess({ req: buildReq(admin) })).toBe(true)
    expect(adminAccess({ req: buildReq(customer) })).toBe(false)
    expect(adminAccess({ req: buildReq(null) })).toBe(false)
  })
})

describe('Users role field access', () => {
  it('only lets admins set the role on create', () => {
    const { create } = getRoleFieldAccess()

    expect(runFieldAccess(create, admin)).toBe(true)
    expect(runFieldAccess(create, customer)).toBe(false)
    expect(runFieldAccess(create, null)).toBe(false)
  })

  it('only lets admins change the role on update', () => {
    const { update } = getRoleFieldAccess()

    expect(runFieldAccess(update, admin)).toBe(true)
    expect(runFieldAccess(update, customer)).toBe(false)
    expect(runFieldAccess(update, null)).toBe(false)
  })
})

describe('isAdminOrSelf', () => {
  it('denies unauthenticated requests', () => {
    expect(runAccess(isAdminOrSelf, null)).toBe(false)
  })
})

describe('Users first-user promotion hook', () => {
  const [promoteFirstUser] = Users.hooks?.beforeChange ?? []

  const runHook = (operation: 'create' | 'update', totalDocs: number) =>
    promoteFirstUser({
      data: { name: 'Owner', role: 'customer' },
      operation,
      req: { payload: { count: async () => ({ totalDocs }) } } as unknown as PayloadRequest,
    } as unknown as Parameters<NonNullable<typeof promoteFirstUser>>[0])

  it('promotes the first user to admin', async () => {
    await expect(runHook('create', 0)).resolves.toMatchObject({ role: 'admin' })
  })

  it('keeps the default role once users exist', async () => {
    await expect(runHook('create', 1)).resolves.toMatchObject({ role: 'customer' })
  })

  it('never changes roles on update', async () => {
    await expect(runHook('update', 0)).resolves.toMatchObject({ role: 'customer' })
  })
})
