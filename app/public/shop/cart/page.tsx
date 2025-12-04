'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react'
import { CartItem } from '@/lib/types/shop'
import { formatEGP } from '@/lib/shop-utils'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('shopCart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('shopCart', JSON.stringify(newCart))
  }

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    saveCart(newCart)
  }

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta)
    saveCart(newCart)
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
          <button
            onClick={() => router.push('/public/shop')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    )
  }

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
            Retour
          </button>

          <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            {cart.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div className="flex-1">
                  <h3 className="font-bold">{item.productName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.teamName} • Taille: {item.size}
                  </p>
                  {item.customization && (
                    <p className="text-sm text-blue-600">
                      {item.customization.name} #{item.customization.number}
                    </p>
                  )}
                  <p className="font-bold text-lg mt-1">{formatEGP(item.price)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Sous-total</span>
              <span>{formatEGP(getSubtotal())}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Les frais de livraison seront calculés à l'étape suivante
            </p>
          </div>

          <button
            onClick={() => router.push('/public/shop/checkout')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            Passer la commande
          </button>
        </motion.div>
      </div>
    </div>
  )
}
