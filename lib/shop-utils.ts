// Utilitaires pour la boutique

import { ShopProduct, ProductType } from './types/shop'

export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const DEFAULT_PRODUCTS: Omit<ShopProduct, 'id'>[] = [
  {
    type: 'jersey',
    name: 'Maillot Officiel',
    nameAr: 'قميص رسمي',
    description: 'Maillot officiel de votre équipe avec personnalisation nom et numéro',
    descriptionAr: 'قميص رسمي لفريقك مع التخصيص الاسم والرقم',
    price: 950,
    customizable: true,
    sizes: PRODUCT_SIZES,
    images: ['/shop/jersey-mockup.png'],
    active: true,
    mockupTemplate: 'jersey'
  },
  {
    type: 'tshirt',
    name: 'T-Shirt ComeBac',
    nameAr: 'تي شيرت كومباك',
    description: 'T-shirt avec logo ComeBac et logo de votre équipe',
    descriptionAr: 'تي شيرت مع شعار كومباك وشعار فريقك',
    price: 750,
    customizable: false,
    sizes: PRODUCT_SIZES,
    images: ['/shop/tshirt-mockup.png'],
    active: true,
    mockupTemplate: 'tshirt'
  },
  {
    type: 'sweatshirt',
    name: 'Sweatshirt ComeBac',
    nameAr: 'سويت شيرت كومباك',
    description: 'Sweatshirt avec logo ComeBac et logo de votre équipe',
    descriptionAr: 'سويت شيرت مع شعار كومباك وشعار فريقك',
    price: 1100,
    customizable: false,
    sizes: PRODUCT_SIZES,
    images: ['/shop/sweatshirt-mockup.png'],
    active: true,
    mockupTemplate: 'sweatshirt'
  }
]

export function formatEGP(amount: number): string {
  return `${amount.toLocaleString('en-US')} EGP`
}

export function validateCustomization(
  productType: ProductType,
  customization?: { name?: string; number?: number }
): { valid: boolean; error?: string } {
  if (productType !== 'jersey') {
    return { valid: true }
  }

  if (!customization?.name || !customization?.number) {
    return { valid: false, error: 'Le nom et le numéro sont requis pour les maillots' }
  }

  if (customization.name.length > 15) {
    return { valid: false, error: 'Le nom ne peut pas dépasser 15 caractères' }
  }

  if (customization.number < 0 || customization.number > 99) {
    return { valid: false, error: 'Le numéro doit être entre 0 et 99' }
  }

  return { valid: true }
}

export function calculateOrderTotal(
  items: Array<{ price: number; quantity: number }>,
  deliveryMethod: 'pickup' | 'shipping',
  shippingCost: number
): { subtotal: number; shippingCost: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = deliveryMethod === 'shipping' ? shippingCost : 0
  const total = subtotal + shipping

  return { subtotal, shippingCost: shipping, total }
}
