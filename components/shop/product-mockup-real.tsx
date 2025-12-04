'use client'

import { ProductType } from '@/lib/types/shop'
import Image from 'next/image'

interface ProductMockupRealProps {
  productType: ProductType
  teamName: string
  teamLogo?: string
  customization?: {
    name?: string
    number?: number
  }
  size?: string
}

export default function ProductMockupReal({
  productType,
  teamName,
  teamLogo,
  customization,
  size = 'M'
}: ProductMockupRealProps) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
      {/* Background mockup */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Black shirt silhouette */}
        <div className={`relative ${
          productType === 'jersey' ? 'w-48 h-56' :
          productType === 'tshirt' ? 'w-44 h-52' :
          'w-52 h-60'
        } bg-black rounded-lg shadow-2xl flex flex-col items-center justify-center`}>
          
          {/* Jersey specific */}
          {productType === 'jersey' && (
            <>
              {/* V-neck collar */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-gray-900 clip-v-neck border-2 border-yellow-500"></div>
              
              {/* Sleeves with gold trim */}
              <div className="absolute top-4 -left-6 w-12 h-16 bg-gray-900 rounded-l-lg border-2 border-yellow-500"></div>
              <div className="absolute top-4 -right-6 w-12 h-16 bg-gray-900 rounded-r-lg border-2 border-yellow-500"></div>
              
              {/* ComeBac logo top left */}
              <div className="absolute top-8 left-4 text-yellow-500 font-bold text-xs">CB</div>
              
              {/* Team logo circle top right */}
              <div className="absolute top-8 right-4 w-6 h-6 rounded-full border-2 border-yellow-500"></div>
              
              {/* Team name center */}
              <div className="text-yellow-500 font-bold text-sm mb-2 text-center px-2">
                {teamName.substring(0, 12)}
              </div>
              
              {/* Player name */}
              {customization?.name && (
                <div className="text-yellow-500 font-bold text-lg mb-1">
                  {customization.name.toUpperCase()}
                </div>
              )}
              
              {/* Player number */}
              {customization?.number !== undefined && (
                <div className="text-yellow-500 font-black text-6xl" style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                }}>
                  {customization.number}
                </div>
              )}
            </>
          )}

          {/* T-Shirt specific */}
          {productType === 'tshirt' && (
            <>
              {/* Round neck */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-gray-900 rounded-t-full"></div>
              
              {/* Short sleeves */}
              <div className="absolute top-4 -left-4 w-8 h-12 bg-gray-900 rounded-l-lg"></div>
              <div className="absolute top-4 -right-4 w-8 h-12 bg-gray-900 rounded-r-lg"></div>
              
              {/* Shield logo top */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-10 border-2 border-yellow-500 rounded-b-lg flex items-center justify-center">
                <span className="text-yellow-500 text-xl">♔</span>
              </div>
              
              {/* ICONS text */}
              <div className="text-yellow-500 font-black text-2xl mt-16">
                ICONS
              </div>
              
              {/* Team logo circle right */}
              <div className="absolute top-12 right-4 w-6 h-6 rounded-full border-2 border-yellow-500"></div>
              
              {/* Shield logo bottom */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-8 h-10 border-2 border-yellow-500 rounded-b-lg flex items-center justify-center">
                <span className="text-yellow-500 text-xl">♔</span>
              </div>
            </>
          )}

          {/* Sweatshirt specific */}
          {productType === 'sweatshirt' && (
            <>
              {/* Hood */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-gray-900 rounded-t-full border-2 border-gray-800"></div>
              
              {/* Drawstrings */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <div className="w-1 h-8 bg-yellow-500 rounded-full"></div>
                <div className="w-1 h-8 bg-yellow-500 rounded-full"></div>
              </div>
              
              {/* Long sleeves */}
              <div className="absolute top-8 -left-6 w-12 h-32 bg-gray-900 rounded-l-lg"></div>
              <div className="absolute top-8 -right-6 w-12 h-32 bg-gray-900 rounded-r-lg"></div>
              
              {/* ComeBac text */}
              <div className="text-yellow-500 font-black text-2xl mb-2 mt-8">
                COMEBAC
              </div>
              
              {/* Team name */}
              <div className="text-yellow-500 font-bold text-sm mb-4">
                {teamName.substring(0, 15)}
              </div>
              
              {/* Kangaroo pocket */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-yellow-500 rounded-lg"></div>
            </>
          )}
        </div>
      </div>

      {/* Size badge */}
      {size && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-bold border border-yellow-500">
          Taille: {size}
        </div>
      )}
    </div>
  )
}
