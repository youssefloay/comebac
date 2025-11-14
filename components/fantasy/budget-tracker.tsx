"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, DollarSign } from 'lucide-react'

interface BudgetTrackerProps {
  budget: number
  budgetSpent: number
  budgetRemaining: number
  showCard?: boolean
  className?: string
}

/**
 * BudgetTracker Component
 * 
 * Displays the Fantasy team budget with:
 * - Total budget and remaining amount
 * - Visual progress bar
 * - Alerts when budget is exceeded
 * 
 * @param budget - Total budget available (default 100M€)
 * @param budgetSpent - Amount already spent on players
 * @param budgetRemaining - Remaining budget (budget - budgetSpent)
 * @param showCard - Whether to wrap in a Card component (default true)
 * @param className - Additional CSS classes
 */
export function BudgetTracker({ 
  budget, 
  budgetSpent, 
  budgetRemaining,
  showCard = true,
  className = ''
}: BudgetTrackerProps) {
  const percentage = (budgetSpent / budget) * 100
  const isOverBudget = budgetRemaining < 0

  const content = (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-sofa-green" />
          <h3 className="font-semibold text-sofa-text-primary">Budget</h3>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-sofa-text-primary'}`}>
            {budgetRemaining.toFixed(1)}M€
          </p>
          <p className="text-sm text-sofa-text-muted">restant</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${
            isOverBudget
              ? 'bg-red-500'
              : percentage > 90
              ? 'bg-yellow-500'
              : 'bg-sofa-green'
          }`}
        />
      </div>

      <div className="flex justify-between mt-2 text-sm text-sofa-text-muted">
        <span>Dépensé: {budgetSpent.toFixed(1)}M€</span>
        <span>Budget: {budget.toFixed(1)}M€</span>
      </div>

      {/* Over budget alert */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700"
        >
          <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Budget dépassé de {Math.abs(budgetRemaining).toFixed(1)}M€
          </p>
        </motion.div>
      )}

      {/* Warning when close to budget limit */}
      {!isOverBudget && percentage > 90 && percentage <= 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Attention: il ne vous reste que {budgetRemaining.toFixed(1)}M€
          </p>
        </motion.div>
      )}
    </div>
  )

  if (showCard) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}
