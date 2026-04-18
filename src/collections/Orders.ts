import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { syncOrderStockAfterChange, validateOrderStockBeforeChange } from '@/hooks/orderStockHooks'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['id', 'customerName', 'status', 'total', 'createdAt'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  hooks: {
    afterChange: [syncOrderStockAfterChange],
    beforeChange: [validateOrderStockBeforeChange],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Pending Payment',
          value: 'pending_payment',
        },
        {
          label: 'Pending WhatsApp',
          value: 'pending_whatsapp',
        },
        {
          label: 'Confirmed',
          value: 'confirmed',
        },
        {
          label: 'Fulfillment Blocked',
          value: 'fulfillment_blocked',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
      ],
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'ARS',
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
    },
    {
      name: 'customerEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'customerPhone',
      type: 'text',
      required: true,
    },
    {
      name: 'deliveryCity',
      type: 'text',
      required: true,
    },
    {
      name: 'deliveryAddress',
      type: 'textarea',
      required: true,
    },
    {
      name: 'deliveryNotes',
      type: 'textarea',
    },
    {
      name: 'confirmationToken',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'stockApplied',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        disabled: true,
        position: 'sidebar',
      },
    },
    {
      name: 'paymentProvider',
      type: 'select',
      options: [
        {
          label: 'Mercado Pago',
          value: 'mercadopago',
        },
        {
          label: 'WhatsApp',
          value: 'whatsapp',
        },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
        {
          label: 'Charged Back',
          value: 'charged_back',
        },
      ],
    },
    {
      name: 'externalReference',
      type: 'text',
    },
    {
      name: 'providerPreferenceId',
      type: 'text',
    },
    {
      name: 'providerPaymentId',
      type: 'text',
    },
    {
      name: 'providerRawStatus',
      type: 'text',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'productName',
          type: 'text',
          required: true,
        },
        {
          name: 'productSlug',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'lineTotal',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
  ],
  timestamps: true,
}
