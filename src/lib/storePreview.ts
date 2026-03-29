import type { Category, Media, Product } from '@/payload-types'

type PreviewCategory = Category & {
  heroImage: Media | null
}

export type PreviewProduct = Product & {
  category: Category
  featuredImage: Media
  gallery?: Media[] | null
}

const media = (id: number, alt: string, url?: string | null) =>
  ({
    id,
    alt,
    url: url ?? null,
  }) as Media

const category = (
  id: number,
  name: string,
  slug: string,
  description: string,
  accent: string,
) =>
  ({
    id,
    name,
    slug,
    description,
    featured: true,
    order: id,
    updatedAt: '2026-03-24T00:00:00.000Z',
    createdAt: '2026-03-24T00:00:00.000Z',
    heroImage: media(1000 + id, `${name} preview`, accent),
  }) as PreviewCategory

const product = (input: {
  id: number
  name: string
  slug: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number
  stock: number
  category: PreviewCategory
  badge?: 'nuevo' | 'oferta' | 'destacado'
  isFeatured?: boolean
  image?: string
  features: string[]
  specifications: Array<[string, string]>
}) =>
  ({
    id: input.id,
    name: input.name,
    slug: input.slug,
    shortDescription: input.shortDescription,
    description: input.description,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    stock: input.stock,
    status: 'published',
    badges: input.badge ? [input.badge] : [],
    isFeatured: input.isFeatured ?? true,
    category: input.category,
    featuredImage: media(input.id + 2000, input.name, input.image),
    gallery: [media(input.id + 3000, `${input.name} gallery`, input.image)],
    features: input.features.map((label, index) => ({ id: String(input.id * 10 + index), label })),
    showFeatures: input.features.length > 0,
    showSpecifications: input.specifications.length > 0,
    specifications: input.specifications.map(([label, value], index) => ({
      id: String(input.id * 10 + index),
      label,
      value,
    })),
    updatedAt: '2026-03-24T00:00:00.000Z',
    createdAt: '2026-03-24T00:00:00.000Z',
  }) as PreviewProduct

const categories = [
  category(1, 'Canas y reels', 'canas-y-reels', 'Equipos para jornadas largas y pesca deportiva precisa.', 'linear-gradient(135deg,#3f2a18_0%,#8e6434_48%,#131313_100%)'),
  category(2, 'Senuelos', 'senuelos', 'Artificiales, kits y accesorios seleccionados para agua dulce y salada.', 'linear-gradient(135deg,#50754a_0%,#94b17d_50%,#dad8cf_100%)'),
  category(3, 'Hogar', 'hogar', 'Linea utilitaria y accesorios para cocina, campamento y vida outdoor.', 'linear-gradient(135deg,#d7d2cb_0%,#f5f2ec_55%,#9aa2ac_100%)'),
] satisfies PreviewCategory[]

const [rodsCategory, luresCategory, homeCategory] = categories

export const previewProducts = [
  product({
    id: 11,
    name: 'Combo Caña + Reel Marine Sports',
    slug: 'combo-cana-reel-marine-sports',
    shortDescription: 'Ideal para pesca variada con excelente equilibrio y lance controlado.',
    description:
      'Combo armado para quienes necesitan una solucion inmediata, balanceada y lista para salir al agua con una estetica mas comercial.',
    price: 45900,
    stock: 12,
    category: rodsCategory,
    badge: 'nuevo',
    image: 'linear-gradient(135deg,#f5f5f5_0%,#d6dbe2_50%,#c3aa8e_100%)',
    features: ['Reel frontal incluido', 'Cana de accion media', 'Listo para salidas recreativas'],
    specifications: [
      ['Largo', '2.10 m'],
      ['Accion', 'Media'],
      ['Material', 'Fibra compuesta'],
      ['Peso', '430 g'],
    ],
  }),
  product({
    id: 12,
    name: 'Kit de Señuelos de Superficie',
    slug: 'kit-senuelos-superficie',
    shortDescription: 'Set de ataque rapido con acabados vivos para dorado y tararira.',
    description:
      'Un kit visualmente fuerte para exhibicion y venta rapida, pensado para rotacion alta en catalogo y home.',
    price: 12500,
    stock: 8,
    category: luresCategory,
    badge: 'oferta',
    image: 'linear-gradient(135deg,#1e293b_0%,#7f7f7f_45%,#f1d4a4_100%)',
    features: ['Acabados holograficos', 'Apto agua dulce', 'Tres acciones distintas'],
    specifications: [
      ['Cantidad', '6 piezas'],
      ['Uso', 'Superficie'],
      ['Anzuelos', 'Triple reforzado'],
      ['Estuche', 'Incluido'],
    ],
  }),
  product({
    id: 13,
    name: 'Set de Cuchillos Profesionales',
    slug: 'set-cuchillos-profesionales',
    shortDescription: 'Presentacion limpia para hogar y outdoor con mango ergonomico.',
    description:
      'Producto pensado para ampliar la categoria hogar sin perder la identidad visual de la tienda.',
    price: 28300,
    stock: 15,
    category: homeCategory,
    image: 'linear-gradient(135deg,#efede6_0%,#f8f6f1_50%,#c1b6ab_100%)',
    features: ['Acero inoxidable', 'Base de madera clara', 'Presentacion premium'],
    specifications: [
      ['Piezas', '5'],
      ['Material', 'Acero inoxidable'],
      ['Incluye', 'Soporte'],
      ['Garantia', '12 meses'],
    ],
  }),
  product({
    id: 14,
    name: 'Caja de Pesca Multi-compartimento',
    slug: 'caja-pesca-multi-compartimento',
    shortDescription: 'Organizacion rapida para señuelos, leaders y accesorios pequeños.',
    description:
      'Caja modular con lectura visual ordenada para mantener el estilo comercial del mockup y una ficha tecnica clara.',
    price: 18200,
    stock: 20,
    category: homeCategory,
    image: 'linear-gradient(135deg,#f0e6d8_0%,#d9c8b3_45%,#c7ab84_100%)',
    features: ['Compartimentos moviles', 'Cierre seguro', 'Material liviano'],
    specifications: [
      ['Ancho', '34 cm'],
      ['Alto', '12 cm'],
      ['Material', 'ABS'],
      ['Color', 'Arena'],
    ],
  }),
  product({
    id: 15,
    name: 'Caña Abu Garcia Vengeance',
    slug: 'cana-abu-garcia-vengeance',
    shortDescription: 'Ideal para pesca de costa con gran resistencia y sensibilidad.',
    description:
      'La serie Vengeance combina un look sobrio con una accion progresiva y un grip comodo para jornadas extensas.',
    price: 12500,
    stock: 6,
    category: rodsCategory,
    badge: 'nuevo',
    isFeatured: false,
    image: 'linear-gradient(135deg,#f6f2ea_0%,#e0d3c3_48%,#5b4b3d_100%)',
    features: ['Blank reforzado', 'Agarre antideslizante', 'Buen casting a media distancia'],
    specifications: [
      ['Largo', '2.40 m'],
      ['Tramos', '2'],
      ['Potencia', 'Medium'],
      ['Peso', '390 g'],
    ],
  }),
  product({
    id: 16,
    name: 'Shimano FX Telescópico 2.10m',
    slug: 'shimano-fx-telescopico-210',
    shortDescription: 'Portabilidad extrema para tus viajes de camping y pesca.',
    description:
      'Una caña de perfil comercial, facil de guardar y muy efectiva para armar la portada del catalogo.',
    price: 8900,
    stock: 9,
    category: rodsCategory,
    isFeatured: false,
    image: 'linear-gradient(135deg,#d1ecea_0%,#6cb5b2_45%,#193a43_100%)',
    features: ['Formato telescopico', 'Ideal para viajes', 'Buena reserva de potencia'],
    specifications: [
      ['Largo', '2.10 m'],
      ['Tramos', 'Telescopica'],
      ['Accion', 'Rapida'],
      ['Peso', '280 g'],
    ],
  }),
  product({
    id: 17,
    name: 'Marine Sports Evolution GT',
    slug: 'marine-sports-evolution-gt',
    shortDescription: 'Grafito de alta densidad para pescadores exigentes.',
    description:
      'Modelo visualmente limpio para la primera linea del listado, con narrativa tecnica simple y clara.',
    price: 15200,
    compareAtPrice: 18000,
    stock: 4,
    category: rodsCategory,
    badge: 'oferta',
    isFeatured: false,
    image: 'linear-gradient(135deg,#efe3c3_0%,#dbc690_45%,#8b7245_100%)',
    features: ['Construccion en grafito', 'Respuesta firme', 'Peso contenido'],
    specifications: [
      ['Largo', '2.70 m'],
      ['Accion', 'Media rapida'],
      ['Material', 'Grafito'],
      ['Peso', '320 g'],
    ],
  }),
  product({
    id: 18,
    name: 'Okuma Wave Power 2.70m',
    slug: 'okuma-wave-power-270',
    shortDescription: 'Estructura reforzada para lanzamientos de larga distancia.',
    description:
      'Pensada para el segundo bloque del catalogo con un tratamiento visual mas suave pero consistente con la marca.',
    price: 11300,
    stock: 11,
    category: rodsCategory,
    isFeatured: false,
    image: 'linear-gradient(135deg,#d4f0ef_0%,#9ed1c7_48%,#c79b58_100%)',
    features: ['Mayor palanca de lance', 'Buena reserva', 'Componentes resistentes'],
    specifications: [
      ['Largo', '2.70 m'],
      ['Tramos', '2'],
      ['Accion', 'Media'],
      ['Peso', '410 g'],
    ],
  }),
  product({
    id: 19,
    name: 'Combo Waterdog Expert',
    slug: 'combo-waterdog-expert',
    shortDescription: 'Combo listo para usar, incluye caña de 2 tramos y reel frontal.',
    description:
      'Alternativa completa para levantar conversion en campañas promocionales y mantener variedad en la grilla.',
    price: 22000,
    stock: 7,
    category: rodsCategory,
    isFeatured: false,
    image: 'linear-gradient(135deg,#f6efe4_0%,#a78247_45%,#1b1b1b_100%)',
    features: ['Equipo combinado', 'Facil de vender', 'Muy buen punto de entrada'],
    specifications: [
      ['Largo', '2.20 m'],
      ['Reel', 'Frontal'],
      ['Uso', 'Recreativo'],
      ['Accesorios', 'Incluidos'],
    ],
  }),
  product({
    id: 20,
    name: 'Spinit Rock 1.80m',
    slug: 'spinit-rock-180',
    shortDescription: 'Fibra de vidrio maciza, indestructible para pesca pesada.',
    description:
      'Modelo de ticket bajo para completar la grilla con una lectura muy clara de precio y accion.',
    price: 7450,
    stock: 18,
    category: rodsCategory,
    isFeatured: false,
    image: 'linear-gradient(135deg,#edf4f7_0%,#cbdbe4_45%,#bfc8cc_100%)',
    features: ['Fibra maciza', 'Muy resistente', 'Mantenimiento simple'],
    specifications: [
      ['Largo', '1.80 m'],
      ['Material', 'Fibra de vidrio'],
      ['Accion', 'Pesada'],
      ['Peso', '360 g'],
    ],
  }),
] satisfies PreviewProduct[]

export const previewCategories = categories
