'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, Clock, Calendar, AlertCircle } from 'lucide-react'
import { ShopSettings } from '@/lib/types/shop'
import ProductMockupReal from '@/components/shop/product-mockup-real'

export default function ShopPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (settings?.currentPeriod?.isOpen && settings.currentPeriod.endDate) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        
        // Convertir endDate en timestamp
        let endTime: number
        const endDate = settings.currentPeriod.endDate
        
        if (endDate._seconds) {
          // Firestore Timestamp format
          endTime = endDate._seconds * 1000
        } else if (endDate.toDate) {
          // Firestore Timestamp avec méthode toDate
          endTime = endDate.toDate().getTime()
        } else if (typeof endDate === 'string') {
          // ISO string
          endTime = new Date(endDate).getTime()
        } else if (endDate instanceof Date) {
          // Date object
          endTime = endDate.getTime()
        } else {
          console.error('Format de date non reconnu:', endDate)
          setTimeRemaining('Erreur')
          return
        }

        const distance = endTime - now

        if (distance < 0) {
          setTimeRemaining('Terminé')
          clearInterval(interval)
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          setTimeRemaining(`${days}j ${hours}h ${minutes}m`)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [settings])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/shop/settings')
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isOpen = settings?.currentPeriod?.isOpen

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold mb-4">Boutique ComeBac</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Commandez le merch officiel de votre équipe
          </p>
        </motion.div>

        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
                  Pré-commandes ouvertes !
                </h2>
              </div>
              <p className="text-green-700 dark:text-green-300 mb-2">
                Temps restant : <span className="font-bold text-2xl">{timeRemaining}</span>
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Commandez maintenant avant la fermeture
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <ProductCard
                title="Maillot"
                type="jersey"
                price={settings?.products.jersey.price || 950}
                description="Personnalisable avec nom et numéro"
              />
              <ProductCard
                title="T-Shirt"
                type="tshirt"
                price={settings?.products.tshirt.price || 750}
                description="Logo ComeBac + logo équipe"
              />
              <ProductCard
                title="Sweatshirt"
                type="sweatshirt"
                price={settings?.products.sweatshirt.price || 1100}
                description="Logo ComeBac + logo équipe"
              />
            </div>

            <button
              onClick={() => router.push('/public/shop/teams')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              Choisir mon équipe et commander
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <h2 className="text-2xl font-bold mb-3 text-yellow-900 dark:text-yellow-100">
                Boutique fermée
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                Les pré-commandes ne sont pas ouvertes pour le moment.
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Revenez bientôt pour la prochaine période de commandes !
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ title, price, description, image, type }: any) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
      <div className="w-full h-40 rounded-lg mb-3 overflow-hidden">
        <ProductMockupReal
          productType={type}
          teamName="COMEBAC"
          customization={type === 'jersey' ? { name: 'LEAGUE', number: 23 } : undefined}
        />
      </div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-2xl font-bold text-blue-600 mb-2">{price} EGP</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}
