// Types pour la boutique de merch

export type ProductType = 'jersey' | 'tshirt' | 'sweatshirt'

export type OrderStatus = 'pending' | 'paid' | 'production' | 'ready' | 'delivered' | 'cancelled'

export type PeriodStatus = 'upcoming' | 'open' | 'closed' | 'production' | 'ready' | 'completed'

export type DeliveryMethod = 'pickup' | 'shipping'

export interface ShopProduct {
  id: string
  type: ProductType
  name: string
  nameAr?: string
  description: string
  descriptionAr?: string
  price: number // en EGP
  customizable: boolean // nom/numéro pour maillots
  sizes: string[]
  images: string[]
  active: boolean
  mockupTemplate?: string // pour le mockup 3D
}

export interface ProductCustomization {
  name?: string
  number?: number
}

export interface OrderItem {
  productId: string
  productType: ProductType
  productName: string
  size: string
  customization?: ProductCustomization
  price: number
  quantity: number
}

export interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  city: string
  governorate: string
  postalCode?: string
}

export interface ShopOrder {
  id: string
  periodId: string
  userId?: string // optionnel si achat sans compte
  userEmail: string
  userName: string
  userPhone: string
  teamId: string
  teamName: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  deliveryMethod: DeliveryMethod
  shippingAddress?: ShippingAddress
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'stripe'
  stripePaymentId?: string
  orderStatus: OrderStatus
  createdAt: any // Firestore Timestamp
  updatedAt: any
  deliveredAt?: any
  notes?: string // notes admin
}

export interface ShopPeriod {
  id: string
  name: string
  startDate: any // Firestore Timestamp
  endDate: any
  status: PeriodStatus
  totalOrders: number
  totalRevenue: number
  summary: {
    jerseys: number
    tshirts: number
    sweatshirts: number
  }
  createdAt: any
}

export interface ShopSettings {
  currentPeriod: {
    id: string | null
    isOpen: boolean
    startDate: any | null
    endDate: any | null
    status: PeriodStatus
  }
  deliveryOptions: {
    pickup: boolean
    shipping: boolean
    shippingCost: number // en EGP
  }
  products: {
    jersey: {
      price: number
      active: boolean
    }
    tshirt: {
      price: number
      active: boolean
    }
    sweatshirt: {
      price: number
      active: boolean
    }
  }
  notificationEmails: string[] // emails à notifier pour nouvelles commandes
}

export interface CartItem extends OrderItem {
  teamId: string
  teamName: string
  teamLogo?: string
}
