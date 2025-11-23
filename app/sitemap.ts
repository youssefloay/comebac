import { MetadataRoute } from 'next'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comebac.com'
  
  // Pages statiques principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/public`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/public/teams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/public/matches`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/public/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/public/players`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/public/statistics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Pages dynamiques - Équipes
  let teamPages: MetadataRoute.Sitemap = []
  try {
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    teamPages = teamsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        url: `${baseUrl}/public/team/${doc.id}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }
    })
  } catch (error) {
    console.error('Error fetching teams for sitemap:', error)
  }

  return [...staticPages, ...teamPages]
}

