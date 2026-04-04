'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { useStoreContact } from '@/hooks/store/useStoreContact'
import { useNavigationCategories } from '@/hooks/store/useStoreNavigation'

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.35 2.83a2 2 0 0 1-.57 1.73L7.1 10.1a16 16 0 0 0 6.8 6.8l1.82-1.79a2 2 0 0 1 1.73-.57l2.83.35A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 5h16v14H4z" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ContactItem = {
  icon: ReactNode
  key: string
  value: string
}

export function StoreFooter() {
  const navigationCategoriesQuery = useNavigationCategories()
  const navigationCategories = navigationCategoriesQuery.data?.docs ?? []
  const storeContactQuery = useStoreContact()
  const storeContact = storeContactQuery.data
  const address = storeContact?.address?.trim() ?? ''
  const phone = storeContact?.phone?.trim() ?? ''
  const email = storeContact?.email?.trim() ?? ''
  const hasAnyContactInfo = Boolean(address || phone || email)
  const contactItems: ContactItem[] = []

  if (hasAnyContactInfo) {
    if (address) {
      contactItems.push({
        icon: <MapPinIcon />,
        key: 'address',
        value: address,
      })
    }

    if (phone) {
      contactItems.push({
        icon: <PhoneIcon />,
        key: 'phone',
        value: phone,
      })
    }

    if (email) {
      contactItems.push({
        icon: <MailIcon />,
        key: 'email',
        value: email,
      })
    }
  } else {
    contactItems.push(
      {
        icon: <MapPinIcon />,
        key: 'address',
        value: 'Calle Principal 123, Provincia, Argentina',
      },
      {
        icon: <PhoneIcon />,
        key: 'phone',
        value: '+54 (011) 4567-8910',
      },
      {
        icon: <MailIcon />,
        key: 'email',
        value: 'hola@caranchopesca.com.ar',
      },
    )
  }

  return (
    <footer className="mt-16 bg-brand-panel text-white">
      <div className="container-shell py-12">
        <div
          className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${
            navigationCategories.length ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          }`}
        >
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image
                alt="Carancho Pesca Deportiva"
                className="h-8 w-8 rounded-full object-cover"
                height={32}
                src="/images/brand/carancho-logo.jpg"
                width={32}
              />
              <span className="text-lg font-extrabold">CARANCHO PESCA</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">
              Pasión por la pesca deportiva y dedicación a tu hogar. Ofrecemos los mejores productos con atención personalizada.
            </p>
          </div>

          {navigationCategories.length ? (
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Categorías</h4>
              <ul className="space-y-2 text-sm opacity-70">
                {navigationCategories.map((category) => (
                  <li key={category.id}>
                    <Link className="transition-opacity hover:opacity-100" href={`/productos?categoria=${category.slug}`}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Ayuda</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a className="hover:opacity-100" href="#">Seguimiento de Pedido</a></li>
              <li><a className="hover:opacity-100" href="#">Política de Devolución</a></li>
              <li><a className="hover:opacity-100" href="#">Envíos y Entregas</a></li>
              <li><a className="hover:opacity-100" href="#">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          <div id="contacto">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-3 text-sm opacity-70">
              {contactItems.map((item) => (
                <li className="flex items-start gap-2" key={item.key}>
                  {item.icon}
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-6 text-xs opacity-50 sm:flex-row">
          <p>© 2025 Carancho Pesca Deportiva. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#">Términos y Condiciones</a>
            <a href="#">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
