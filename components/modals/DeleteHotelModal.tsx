import React, { useState, useEffect } from 'react';
import { AlertTriangle, Building2, Bed, Calendar, X } from 'lucide-react';
import { Button } from '../ui/button';
import { establishmentsApi } from '@/lib/api/establishments';
import type { Establishment } from '@/lib/api/establishments';

interface DeleteHotelModalProps {
  hotel: Establishment;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hotelId: number) => void;
  isDeleting?: boolean;
}

export default function DeleteHotelModal({
  hotel,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}: DeleteHotelModalProps) {
  const [deletionPreview, setDeletionPreview] = useState<{
    hotel_name: string;
    rooms_count: number;
    active_reservations_count: number;
    can_delete: boolean;
    deletion_preview: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load deletion preview when modal opens
  useEffect(() => {
    if (isOpen && hotel) {
      loadDeletionPreview();
    }
  }, [isOpen, hotel]);

  const loadDeletionPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await establishmentsApi.previewHotelDeletion(hotel.id);

      if (response.success && response.data) {
        setDeletionPreview(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement de l\'aperçu');
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement');
      console.error('Error loading deletion preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (deletionPreview?.can_delete) {
      onConfirm(hotel.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Supprimer l'établissement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Analyse des dépendances...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Erreur</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {deletionPreview && (
            <div className="space-y-6">
              {/* Hotel info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{deletionPreview.hotel_name}</h3>
                  <p className="text-gray-600">{hotel.adresse}, {hotel.ville}</p>
                </div>
              </div>

              {/* Impact preview */}
              <div className={`p-4 rounded-lg border-2 ${
                deletionPreview.can_delete 
                  ? 'bg-yellow-50 border-yellow-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <p className={`font-medium ${
                  deletionPreview.can_delete ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {deletionPreview.deletion_preview}
                </p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Bed className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Chambres</p>
                    <p className="font-semibold text-blue-800">
                      {deletionPreview.rooms_count}
                      {deletionPreview.rooms_count > 0 && deletionPreview.can_delete && (
                        <span className="text-sm font-normal text-gray-600 ml-1">
                          (seront supprimées)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Réservations actives</p>
                    <p className={`font-semibold ${
                      deletionPreview.active_reservations_count > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {deletionPreview.active_reservations_count}
                      {deletionPreview.active_reservations_count > 0 && (
                        <span className="text-sm font-normal text-red-500 ml-1">
                          (bloquent la suppression)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {!deletionPreview.can_delete && deletionPreview.active_reservations_count > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">
                    💡 Pour pouvoir supprimer cet établissement :
                  </h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Annulez ou terminez les réservations actives</li>
                    <li>• Ou utilisez la désactivation temporaire de l'établissement</li>
                  </ul>
                </div>
              )}

              {deletionPreview.can_delete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">
                    ⚠️ Cette action est irréversible
                  </h4>
                  <p className="text-red-700 text-sm">
                    L'établissement et toutes ses chambres seront définitivement supprimés de la base de données.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          
          {deletionPreview?.can_delete ? (
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting || !deletionPreview?.can_delete}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Suppression...
                </div>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              className="opacity-50"
            >
              Suppression impossible
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}