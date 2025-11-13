"use client"

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface SofaStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
  index: number
  subtitle?: string
}

export function SofaStatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'green', 
  index,
  subtitle 
}: SofaStatCardProps) {
  const colorClasses = {
    green: 'from-sofa-green to-emerald-500',
    blue: 'from-sofa-blue to-blue-500',
    orange: 'from-sofa-orange to-orange-500',
    red: 'from-sofa-red to-red-500',
    purple: 'from-purple-500 to-purple-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="sofa-stat-card group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <div className="sofa-stat-number group-hover:scale-110 transition-transform">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-sofa-text-muted mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="sofa-stat-label">
        {title}
      </div>
    </motion.div>
  )
}