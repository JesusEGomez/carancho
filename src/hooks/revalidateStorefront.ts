import { revalidatePath } from 'next/cache'

export function revalidateCategoryRoutes() {
  try {
    revalidatePath('/')
    revalidatePath('/productos')
  } catch (error) {
    console.error('Failed to revalidate category storefront routes.', error)
  }
}

export function revalidateProductRoutes(slugs: Array<string | null | undefined> = []) {
  try {
    revalidatePath('/')
    revalidatePath('/productos')

    for (const slug of slugs) {
      if (!slug) {
        continue
      }

      revalidatePath(`/productos/${slug}`)
    }
  } catch (error) {
    console.error('Failed to revalidate product storefront routes.', error)
  }
}
