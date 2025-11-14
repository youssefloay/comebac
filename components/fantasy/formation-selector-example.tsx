"use client"

import { useState } from 'react'
import { FormationSelector } from './formation-selector'
import type { Formation } from '@/lib/types/fantasy'

/**
 * Example usage of the FormationSelector component
 * 
 * This component demonstrates how to integrate the FormationSelector
 * into your Fantasy team creation or editing flow.
 */
export function FormationSelectorExample() {
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-0')

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation)
    console.log('Formation changed to:', formation)
    // Here you would typically update your team state
    // and validate that the current player selection matches the formation
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-4">
          Formation Selector Example
        </h2>
        
        <FormationSelector
          selectedFormation={selectedFormation}
          onFormationChange={handleFormationChange}
          disabled={false}
        />

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-sofa-text-primary mb-2">
            Selected Formation:
          </h3>
          <p className="text-lg font-bold text-sofa-green">
            {selectedFormation}
          </p>
          <p className="text-sm text-sofa-text-muted mt-2">
            This formation requires:
          </p>
          <ul className="text-sm text-sofa-text-muted mt-1 space-y-1">
            <li>• 1 Gardien (always required)</li>
            <li>• {selectedFormation.split('-')[0]} Défenseurs</li>
            <li>• {selectedFormation.split('-')[1]} Milieux</li>
            <li>• {selectedFormation.split('-')[2]} Attaquants</li>
          </ul>
        </div>
      </div>

      {/* Example with disabled state */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-4">
          Disabled State Example
        </h2>
        <p className="text-sm text-sofa-text-muted mb-4">
          When disabled, users cannot change the formation (e.g., during an active gameweek)
        </p>
        
        <FormationSelector
          selectedFormation="3-3-1"
          onFormationChange={() => {}}
          disabled={true}
        />
      </div>
    </div>
  )
}
