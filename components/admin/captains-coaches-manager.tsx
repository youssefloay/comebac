"use client"

import { useState, useEffect } from 'react'
import { Loader, Users, Phone, Mail, Download, MessageCircle, CheckCircle2, X } from 'lucide-react'
import { downloadContactsAsVCard, shareContactsViaMail } from '@/lib/utils/vcard'
import { openWhatsAppWithContacts } from '@/lib/utils/whatsapp'

export interface CaptainCoachData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'captain' | 'coach'
  teamId: string
  teamName: string
}

export default function CaptainsCoachesManager() {
  const [loading, setLoading] = useState(true)
  const [captains, setCaptains] = useState<CaptainCoachData[]>([])
  const [coaches, setCoaches] = useState<CaptainCoachData[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'captain' | 'coach'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/captains-coaches')
      if (response.ok) {
        const data = await response.json()
        setCaptains(data.captains || [])
        setCoaches(data.coaches || [])
      } else {
        console.error('Failed to load data')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const allContacts = [...captains, ...coaches]

  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = 
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm))

    const matchesRole = filterRole === 'all' || contact.role === filterRole

    return matchesSearch && matchesRole
  })

  const toggleContact = (id: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedContacts(newSelected)
  }

  const toggleAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
    }
  }

  const getSelectedContacts = (): CaptainCoachData[] => {
    return filteredContacts.filter(c => selectedContacts.has(c.id))
  }

  const handleDownloadContacts = () => {
    const selected = getSelectedContacts()
    if (selected.length === 0) {
      alert('Veuillez sélectionner au moins un contact.')
      return
    }
    downloadContactsAsVCard(selected, 'comebac-contacts.vcf')
  }

  const handleShareViaMail = () => {
    const selected = getSelectedContacts()
    if (selected.length === 0) {
      alert('Veuillez sélectionner au moins un contact.')
      return
    }
    shareContactsViaMail(selected)
  }

  const handleOpenWhatsApp = () => {
    const selected = getSelectedContacts()
    if (selected.length === 0) {
      alert('Veuillez sélectionner au moins un contact.')
      return
    }
    
    const withPhone = selected.filter(c => c.phone)
    if (withPhone.length === 0) {
      alert('Aucun des contacts sélectionnés n\'a de numéro de téléphone.')
      return
    }
    
    openWhatsAppWithContacts(withPhone)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-gray-600" />
        <span className="ml-2 text-gray-600">Chargement des données...</span>
      </div>
    )
  }

  const stats = {
    total: allContacts.length,
    captains: captains.length,
    coaches: coaches.length,
    withPhone: allContacts.filter(c => c.phone).length,
    selected: selectedContacts.size
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Gestion des Capitaines et Coachs
        </h3>
        <p className="text-gray-600 text-sm">
          Gérez les contacts des capitaines et coachs, ajoutez-les à WhatsApp et sauvegardez-les sur votre iPhone.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-700">Total</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-900">{stats.captains}</div>
          <div className="text-sm text-green-700">Capitaines</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-900">{stats.coaches}</div>
          <div className="text-sm text-purple-700">Coachs</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-900">{stats.withPhone}</div>
          <div className="text-sm text-orange-700">Avec téléphone</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par nom, email, équipe, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'all' | 'captain' | 'coach')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="captain">Capitaines</option>
            <option value="coach">Coachs</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      {stats.selected > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-blue-900">
              {stats.selected} contact(s) sélectionné(s)
            </div>
            <button
              onClick={() => setSelectedContacts(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Tout désélectionner
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadContacts}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger contacts (.vcf)</span>
            </button>
            <button
              onClick={handleShareViaMail}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Partager par email</span>
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ouvrir WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipe
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucun contact trouvé
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`hover:bg-gray-50 ${
                      selectedContacts.has(contact.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contact.role === 'captain'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {contact.role === 'captain' ? 'Capitaine' : 'Coach'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.teamName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {contact.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non renseigné</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Sélectionnez les contacts que vous souhaitez ajouter</li>
          <li>
            <strong>Télécharger contacts (.vcf):</strong> Télécharge un fichier .vcf que vous pouvez ouvrir sur iPhone pour importer les contacts
          </li>
          <li>
            <strong>Partager par email:</strong> Télécharge le fichier .vcf et vous pouvez vous l'envoyer par email pour l'ouvrir sur iPhone
          </li>
          <li>
            <strong>Ouvrir WhatsApp:</strong> Ouvre WhatsApp avec les contacts sélectionnés (nécessite un numéro de téléphone)
          </li>
        </ul>
      </div>
    </div>
  )
}

