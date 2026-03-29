import path from 'node:path'

import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

const imagePath = path.resolve(process.cwd(), 'public/images/heroes/carancho-home-hero.png')

export async function seedCatalog() {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'products',
    where: {
      slug: {
        equals: 'combo-cana-reel-marine-sports',
      },
    },
  })

  await payload.delete({
    collection: 'categories',
    where: {
      slug: {
        equals: 'canas-y-reels',
      },
    },
  })

  await payload.delete({
    collection: 'media',
    where: {
      alt: {
        equals: 'Producto demo Carancho',
      },
    },
  })

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: 'Producto demo Carancho',
    },
    filePath: imagePath,
  })

  const category = await payload.create({
    collection: 'categories',
    data: {
      description: 'Categoria principal para el catalogo de prueba.',
      featured: true,
      heroImage: media.id,
      name: 'Canas y Reels',
      slug: 'canas-y-reels',
    },
    draft: false,
  })

  await payload.create({
    collection: 'products',
    data: {
      badges: ['nuevo', 'destacado'],
      category: category.id,
      description: 'Producto semilla para validar storefront y dashboard.',
      featuredImage: media.id,
      features: [{ label: 'Blank reforzado' }, { label: 'Mango EVA' }],
      gallery: [media.id],
      isFeatured: true,
      name: 'Combo Cana + Reel Marine Sports',
      price: 45900,
      shortDescription: 'Ideal para pesca variada de rio.',
      slug: 'combo-cana-reel-marine-sports',
      specifications: [
        { label: 'Largo', value: '2.10 metros' },
        { label: 'Accion', value: 'Rapida' },
      ],
      status: 'published',
      stock: 8,
    },
    draft: false,
  })
}
