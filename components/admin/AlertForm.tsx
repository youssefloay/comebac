'use client'

import { useState } from 'react'
import { AlertCircle, Calendar, Users, MessageSquare } from 'lucide-react'

interface AlertFormProps {
  onSubmit?: (data: AlertFormData) => void
  initialData?: Partial<AlertFormData>
  onRegisterClick?: () => void
}

export interface AlertFormData {
  alert: string
  why: string
  remainingPlaces: number
  deadline: string
}

export function AlertForm({ onSubmit, initialData, onRegisterClick }: AlertFormProps) {
  const [formData, setFormData] = useState<AlertFormData>({
    alert: initialData?.alert || '',
    why: initialData?.why || '',
    remainingPlaces: initialData?.remainingPlaces || 0,
    deadline: initialData?.deadline || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRegisterClick?.()
    onSubmit?.(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Field 1: Alert */}
      <div>
        <label htmlFor="alert" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Alert
          </div>
        </label>
        <input
          type="text"
          id="alert"
          value={formData.alert}
          onChange={(e) => setFormData({ ...formData, alert: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Field 2: Why? */}
      <div>
        <label htmlFor="why" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Why?
          </div>
        </label>
        <textarea
          id="why"
          value={formData.why}
          onChange={(e) => setFormData({ ...formData, why: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Field 3: Remaining Places */}
      <div>
        <label htmlFor="remainingPlaces" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Remaining Places
          </div>
        </label>
        <input
          type="number"
          id="remainingPlaces"
          value={formData.remainingPlaces}
          onChange={(e) => setFormData({ ...formData, remainingPlaces: parseInt(e.target.value) || 0 })}
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Field 4: Deadline */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Deadline
          </div>
        </label>
        <input
          type="text"
          id="deadline"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Button REGISTRE NOW */}
      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
      >
        REGISTRE NOW
      </button>
    </form>
  )
}

