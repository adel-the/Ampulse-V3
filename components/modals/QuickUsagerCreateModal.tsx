'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Users, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usagersApi } from '@/lib/api/usagers';
import { createUsagerWithIndividuals } from '@/lib/usagerIndividualsTransaction';
import IndividualsSection from '@/components/features/IndividualsSection';
import type { Individual } from '@/types/individuals';
import type { Client } from '@/lib/supabase';

interface QuickUsagerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescripteur: Client;
  onUsagerCreated: (usagerId: number) => void;
}

interface UsagerFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  telephone: string;
  email: string;
  autonomie_level: 'Autonome' | 'Semi-autonome' | 'Non-autonome';
  statut: 'actif' | 'inactif' | 'archive';
  prescripteur_id: number;
}

const AUTONOMIE_LEVELS = [
  { value: 'Autonome', label: 'Autonome', color: 'bg-green-100 text-green-800' },
  { value: 'Semi-autonome', label: 'Semi-autonome', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Non-autonome', label: 'Non-autonome', color: 'bg-red-100 text-red-800' }
];

export default function QuickUsagerCreateModal({
  isOpen,
  onClose,
  prescripteur,
  onUsagerCreated
}: QuickUsagerCreateModalProps) {
  const [formData, setFormData] = useState<UsagerFormData>({
    nom: '',
    prenom: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Française',
    telephone: '',
    email: '',
    autonomie_level: 'Autonome',
    statut: 'actif',
    prescripteur_id: prescripteur.id
  });

  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'individus'>('info');

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        prescripteur_id: prescripteur.id
      }));
      setActiveTab('info');
      setError(null);
    }
  }, [isOpen, prescripteur.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation des champs obligatoires
      if (!formData.nom.trim() || !formData.prenom.trim()) {
        setError('Le nom et le prénom sont obligatoires');
        setLoading(false);
        return;
      }

      // Transformer le nom en majuscules
      const usagerData = {
        ...formData,
        nom: formData.nom.toUpperCase()
      };

      // Créer l'usager avec ses individus rattachés
      const result = await createUsagerWithIndividuals(usagerData, individuals);

      if (result.success && result.usagerId) {
        // Notifier le composant parent
        onUsagerCreated(result.usagerId);
        
        // Réinitialiser le formulaire
        setFormData({
          nom: '',
          prenom: '',
          date_naissance: '',
          lieu_naissance: '',
          nationalite: 'Française',
          telephone: '',
          email: '',
          autonomie_level: 'Autonome',
          statut: 'actif',
          prescripteur_id: prescripteur.id
        });
        setIndividuals([]);
        
        // Fermer le modal
        onClose();
      } else {
        setError(result.error || 'Erreur lors de la création de l\'usager');
      }
    } catch (err) {
      console.error('Erreur création usager:', err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setFormData({
        nom: '',
        prenom: '',
        date_naissance: '',
        lieu_naissance: '',
        nationalite: 'Française',
        telephone: '',
        email: '',
        autonomie_level: 'Autonome',
        statut: 'actif',
        prescripteur_id: prescripteur.id
      });
      setIndividuals([]);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const prescripteurDisplayName = prescripteur.client_type === 'Particulier'
    ? `${prescripteur.nom} ${prescripteur.prenom || ''}`
    : prescripteur.raison_sociale || prescripteur.nom;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Créer un nouvel usager</h2>
              <p className="text-sm text-gray-600 mt-1">
                Prescripteur : <span className="font-medium">{prescripteurDisplayName}</span>
                {prescripteur.client_type && (
                  <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {prescripteur.client_type}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Informations principales
            </button>
            <button
              onClick={() => setActiveTab('individus')}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'individus'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Individus rattachés
              {individuals.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {individuals.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {activeTab === 'info' ? (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                {/* Lieu de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    value={formData.lieu_naissance}
                    onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                {/* Nationalité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationalité
                  </label>
                  <input
                    type="text"
                    value={formData.nationalite}
                    onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                {/* Niveau d'autonomie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'autonomie
                  </label>
                  <select
                    value={formData.autonomie_level}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      autonomie_level: e.target.value as 'Autonome' | 'Semi-autonome' | 'Non-autonome'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {AUTONOMIE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indicateur de niveau d'autonomie */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Niveau d'autonomie sélectionné :</p>
                <div className="flex items-center gap-2">
                  {AUTONOMIE_LEVELS.map(level => (
                    <span
                      key={level.value}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.autonomie_level === level.value
                          ? level.color
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {level.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <IndividualsSection
                individuals={individuals}
                onIndividualsChange={setIndividuals}
                maxIndividuals={10}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {individuals.length > 0 && (
                <span>{individuals.length} individu(s) rattaché(s)</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.nom.trim() || !formData.prenom.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Création...' : 'Créer l\'usager'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}