'use client'

import { useState } from 'react'

import { CategoryForm } from '@/components/admin/CategoryForm'
import { SubcategoryForm } from '@/components/admin/SubcategoryForm'

export default function NewCategoryPage() {
  const [mode, setMode] = useState<'category' | 'subcategory'>('category')

  return (
    <div className="grid gap-6">
      <section className="surface-card max-w-4xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Alta de categorías</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className={`rounded-full px-5 py-3 text-sm font-black uppercase tracking-wide ${
              mode === 'category'
                ? 'bg-brand-orange text-white'
                : 'border border-slate-200 bg-white text-brand-ink'
            }`}
            onClick={() => setMode('category')}
            type="button"
          >
            Crear categoría
          </button>
          <button
            className={`rounded-full px-5 py-3 text-sm font-black uppercase tracking-wide ${
              mode === 'subcategory'
                ? 'bg-brand-orange text-white'
                : 'border border-slate-200 bg-white text-brand-ink'
            }`}
            onClick={() => setMode('subcategory')}
            type="button"
          >
            Crear subcategoría
          </button>
        </div>
      </section>

      {mode === 'category' ? <CategoryForm /> : <SubcategoryForm />}
    </div>
  )
}
