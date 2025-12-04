// Script pour initialiser la boutique avec des données de test
// Exécuter avec: npx ts-node scripts/init-shop.ts

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

async function initShop() {
  console.log('🛍️ Initialisation de la boutique...')

  try {
    // 1. Créer les paramètres de la boutique
    console.log('📝 Création des paramètres...')
    await db.collection('shopSettings').doc('main').set({
      currentPeriod: {
        id: null,
        isOpen: false,
        startDate: null,
        endDate: null,
        status: 'upcoming'
      },
      deliveryOptions: {
        pickup: true,
        shipping: true,
        shippingCost: 100
      },
      products: {
        jersey: { price: 950, active: true },
        tshirt: { price: 750, active: true },
        sweatshirt: { price: 1100, active: true }
      },
      notificationEmails: []
    })
    console.log('✅ Paramètres créés')

    // 2. Créer les produits
    console.log('📝 Création des produits...')
    const products = [
      {
        type: 'jersey',
        name: 'Maillot Officiel',
        nameAr: 'قميص رسمي',
        description: 'Maillot officiel de votre équipe avec personnalisation nom et numéro',
        descriptionAr: 'قميص رسمي لفريقك مع التخصيص الاسم والرقم',
        price: 950,
        customizable: true,
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        images: [],
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
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        images: [],
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
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        images: [],
        active: true,
        mockupTemplate: 'sweatshirt'
      }
    ]

    for (const product of products) {
      const docRef = db.collection('shopProducts').doc()
      await docRef.set({ ...product, id: docRef.id })
    }
    console.log('✅ Produits créés')

    // 3. Créer une période de test
    console.log('📝 Création d\'une période de test...')
    const now = new Date()
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // +14 jours

    const periodRef = db.collection('shopPeriods').doc()
    await periodRef.set({
      id: periodRef.id,
      name: 'Janvier 2025 - Test',
      startDate: FieldValue.serverTimestamp(),
      endDate: endDate,
      status: 'open',
      totalOrders: 0,
      totalRevenue: 0,
      summary: {
        jerseys: 0,
        tshirts: 0,
        sweatshirts: 0
      },
      createdAt: FieldValue.serverTimestamp()
    })

    // Mettre à jour les settings avec cette période
    await db.collection('shopSettings').doc('main').update({
      'currentPeriod.id': periodRef.id,
      'currentPeriod.isOpen': true,
      'currentPeriod.status': 'open',
      'currentPeriod.startDate': FieldValue.serverTimestamp(),
      'currentPeriod.endDate': endDate
    })
    console.log('✅ Période de test créée et ouverte')

    console.log('\n🎉 Boutique initialisée avec succès !')
    console.log('\n📋 Résumé :')
    console.log('- Paramètres créés')
    console.log('- 3 produits créés (Maillot, T-Shirt, Sweatshirt)')
    console.log('- Période de test créée et ouverte (14 jours)')
    console.log('\n🚀 Vous pouvez maintenant tester la boutique sur /public/shop')

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  }
}

initShop()
