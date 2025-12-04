'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import { ShopProduct, CartItem, ShopSettings } from '@/lib/types/shop'
import { formatEGP, validateCustomization } from '@/lib/shop-utils'
import ProductMockupReal from '@/components/shop/product-mockup-real'

export default function TeamShopPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const [team, setTeam] = useState<any>(null)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [customName, setCustomName] = useState('')
  const [customNumber, setCustomNumber] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    loadCart()
  }, [teamId])

  const fetchData = async () => {
    try {
      const [teamRes, productsRes, settingsRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch('/api/shop/products'),
        fetch('/api/shop/settings')
      ])

      const teamData = await teamRes.json()
      const productsData = await productsRes.json()
      const settingsData = await settingsRes.json()

      setTeam(teamData)
      setProducts(productsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) {
      alert('Veuillez sélectionner une taille')
      return
    }

    const customization = selectedProduct.customizable
      ? { name: customName, number: parseInt(customNumber) }
      : undefined

    if (selectedProduct.customizable) {
      const validation = validateCustomization(selectedProduct.type, customization)
      if (!validation.valid) {
        alert(validation.error)
        return
      }
    }

    const newItem: CartItem = {
      productId: selectedProduct.id,
      productType: selectedProduct.type,
      productName: selectedProduct.name,
      size: selectedSize,
      customization,
      price: selectedProduct.price,
      quantity: 1,
      teamId,
      teamName: team.name,
      teamLogo: team.logo
    }

    const newCart = [...cart, newItem]
    saveCart(newCart)

    // Reset
    setSelectedProduct(null)
    setSelectedSize('')
    setCustomName('')
    setCustomNumber('')

    alert('Produit ajouté au panier !')
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!settings?.currentPeriod?.isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Boutique fermée</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Les pré-commandes ne sont pas ouvertes actuellement
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header avec équipe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            {team.logo && (
              <div className="w-16 h-16 relative">
                <Image src={team.logo} alt={team.name} fill className="object-contain" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">Boutique officielle</p>
            </div>
            <button
              onClick={() => router.push('/public/shop/cart')}
              className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Produits */}
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              {/* Mockup Real */}
              <div className="w-full h-64 mb-4">
                <ProductMockupReal
                  productType={product.type}
                  teamName={team.name}
                  teamLogo={team.logo}
                />
              </div>

              <h3 className="text-xl font-bold mb-2">{product.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {product.description}
              </p>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                {formatEGP(product.price)}
              </p>

              <button
                onClick={() => setSelectedProduct(product)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Personnaliser et commander
              </button>
            </motion.div>
          ))}
        </div>

        {/* Modal de personnalisation */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">{selectedProduct.name}</h2>

              {/* Preview */}
              <div className="w-full h-64 mb-6">
                <ProductMockupReal
                  productType={selectedProduct.type}
                  teamName={team.name}
                  teamLogo={team.logo}
                  customization={
                    selectedProduct.customizable
                      ? { name: customName, number: parseInt(customNumber) || 0 }
                      : undefined
                  }
                  size={selectedSize}
                />
              </div>

              {/* Taille */}
              <div className="mb-6">
                <label className="block font-bold mb-2">Taille *</label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                        selectedSize === size
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personnalisation pour maillots */}
              {selectedProduct.customizable && (
                <>
                  <div className="mb-4">
                    <label className="block font-bold mb-2">Nom *</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                      maxLength={15}
                      placeholder="DUPONT"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 15 caractères</p>
                  </div>

                  <div className="mb-6">
                    <label className="block font-bold mb-2">Numéro *</label>
                    <input
                      type="number"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      min="0"
                      max="99"
                      placeholder="10"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Entre 0 et 99</p>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={addToCart}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Ajouter au panier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
