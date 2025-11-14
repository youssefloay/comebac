"use client"

import { useState } from 'react'
import { BudgetTracker } from './budget-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Example usage of the BudgetTracker component
 * 
 * This demonstrates different states:
 * - Normal budget usage
 * - Near budget limit (warning)
 * - Over budget (error)
 */
export function BudgetTrackerExample() {
  const [budgetSpent, setBudgetSpent] = useState(45.5)
  const budget = 100

  const addPlayer = (price: number) => {
    setBudgetSpent(prev => prev + price)
  }

  const removePlayer = (price: number) => {
    setBudgetSpent(prev => Math.max(0, prev - price))
  }

  const reset = () => {
    setBudgetSpent(0)
  }

  const budgetRemaining = budget - budgetSpent

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>BudgetTracker Component Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Example 1: With Card wrapper (default) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Example 1: Default (with Card)</h3>
            <BudgetTracker
              budget={budget}
              budgetSpent={budgetSpent}
              budgetRemaining={budgetRemaining}
            />
          </div>

          {/* Example 2: Without Card wrapper */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Example 2: Without Card wrapper</h3>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <BudgetTracker
                budget={budget}
                budgetSpent={budgetSpent}
                budgetRemaining={budgetRemaining}
                showCard={false}
              />
            </div>
          </div>

          {/* Controls */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Test Controls</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => addPlayer(5.0)} variant="outline">
                Add 5.0M€ Player
              </Button>
              <Button onClick={() => addPlayer(10.0)} variant="outline">
                Add 10.0M€ Player
              </Button>
              <Button onClick={() => addPlayer(15.0)} variant="outline">
                Add 15.0M€ Player
              </Button>
              <Button onClick={() => removePlayer(5.0)} variant="outline">
                Remove 5.0M€ Player
              </Button>
              <Button onClick={reset} variant="outline">
                Reset Budget
              </Button>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm">
                <strong>Current State:</strong>
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>Budget: {budget.toFixed(1)}M€</li>
                <li>Spent: {budgetSpent.toFixed(1)}M€</li>
                <li>Remaining: {budgetRemaining.toFixed(1)}M€</li>
                <li>Percentage: {((budgetSpent / budget) * 100).toFixed(1)}%</li>
                <li>Status: {
                  budgetRemaining < 0 ? '❌ Over Budget' :
                  (budgetSpent / budget) > 0.9 ? '⚠️ Near Limit' :
                  '✅ Normal'
                }</li>
              </ul>
            </div>
          </div>

          {/* Different scenarios */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Example Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Normal usage */}
              <div>
                <p className="text-sm font-medium mb-2">Normal Usage (50%)</p>
                <BudgetTracker
                  budget={100}
                  budgetSpent={50}
                  budgetRemaining={50}
                  showCard={false}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>

              {/* Near limit */}
              <div>
                <p className="text-sm font-medium mb-2">Near Limit (95%)</p>
                <BudgetTracker
                  budget={100}
                  budgetSpent={95}
                  budgetRemaining={5}
                  showCard={false}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>

              {/* Over budget */}
              <div>
                <p className="text-sm font-medium mb-2">Over Budget (105%)</p>
                <BudgetTracker
                  budget={100}
                  budgetSpent={105}
                  budgetRemaining={-5}
                  showCard={false}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
