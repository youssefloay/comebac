'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, MapPin, Package } from 'lucide-react'
import { CartItem, DeliveryMethod, ShippingAddress } from '@/lib/types/shop'
import { formatEGP, calculateOrderTotal } from '@/lib/shop-utils'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [shippingCost, setShippingCost] = useState(100)
  const [loading, setLoading] = useState(false)

  // Informations client
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Adresse de livraison
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [governorate, setGovernorate] = useState('')

  useEffect(() => {
    loadCart()
    fetchSettings()
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('shopCart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      if (parsedCart.length === 0) {
        router.push('/public/shop')
      }
      setCart(parsedCart)
    } else {
      router.push('/public/shop')
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/shop/settings')
      const data = await res.json()
      setShippingCost(data.deliveryOptions.shippingCost)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !fullName || !phone) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (deliveryMethod === 'shipping' && (!address || !city || !governorate)) {
      alert('Veuillez remplir l\'adresse de livraison')
      return
    }

    setLoading(true)

    try {
      // Grouper les items par équipe
      const teamId = cart[0].teamId
      const teamName = cart[0].teamName

      const { subtotal, shippingCost: shipping, total } = calculateOrderTotal(
        cart,
        deliveryMethod,
        shippingCost
      )

      const orderData = {
        userEmail: email,
        userName: fullName,
        userPhone: phone,
        teamId,
        teamName,
        items: cart,
        subtotal,
        shippingCost: shipping,
        total,
        deliveryMethod,
        shippingAddress: deliveryMethod === 'shipping' ? {
          fullName,
          phone,
          address,
          city,
          governorate
        } : undefined,
        paymentMethod: 'stripe'
      }

      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (res.ok) {
        // TODO: Intégrer Stripe pour le paiement
        // Pour l'instant, on simule un paiement réussi
        alert('Commande créée ! Redirection vers le paiement...')
        localStorage.removeItem('shopCart')
        router.push(`/public/shop/order/${data.orderId}`)
      } else {
        alert(data.error || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Erreur lors de la création de la commande')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, shippingCost: shipping, total } = calculateOrderTotal(
    cart,
    deliveryMethod,
    shippingCost
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au panier
          </button>

          <h1 className="text-3xl font-bold mb-8">Finaliser la commande</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations client */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Vos informations
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Mode de livraison */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Mode de livraison
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-bold">Retrait sur place</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gratuit - Lors des matchs ou à l'école
                    </p>
                  </div>
                  <span className="font-bold text-green-600">Gratuit</span>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={() => setDeliveryMethod('shipping')}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-bold">Livraison à domicile</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Livraison sous 7-14 jours
                    </p>
                  </div>
                  <span className="font-bold">{formatEGP(shippingCost)}</span>
                </label>
              </div>
            </div>

            {/* Adresse de livraison */}
            {deliveryMethod === 'shipping' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold mb-2">Adresse *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required={deliveryMethod === 'shipping'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-2">Ville *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required={deliveryMethod === 'shipping'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-2">Gouvernorat *</label>
                      <input
                        type="text"
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        required={deliveryMethod === 'shipping'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Récapitulatif */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatEGP(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>{shipping === 0 ? 'Gratuit' : formatEGP(shipping)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{formatEGP(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Traitement...' : 'Procéder au paiement'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
