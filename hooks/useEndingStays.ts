import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EndingStay {
  id: number;
  chambre_id: number;
  hotel_id: number;
  date_arrivee: string;
  date_depart: string;
  statut: string;
  prescripteur: string;
  prix: number;
  duree: number;
  notes: string | null;
  // Informations de la chambre
  chambre_numero: string;
  chambre_type: string;
  // Informations de l'hôtel
  hotel_nom: string;
  hotel_ville: string;
  // Informations de l'usager
  usager_nom: string;
  usager_prenom: string;
  usager_telephone: string;
  // Calcul de l'urgence
  jours_restants: number;
  est_termine: boolean;
}

export function useEndingStays() {
  const [endingStays, setEndingStays] = useState<EndingStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEndingStays();
  }, []);

  const fetchEndingStays = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Date d'aujourd'hui
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Données de démonstration
      const demoData: EndingStay[] = [
        {
          id: 1,
          chambre_id: 1,
          hotel_id: 1,
          date_arrivee: yesterday.toISOString().split('T')[0],
          date_depart: today.toISOString().split('T')[0],
          statut: 'CONFIRMEE',
          prescripteur: 'SIAO 75',
          prix: 80,
          duree: 1,
          notes: 'Séjour qui se termine aujourd\'hui - Contact urgent nécessaire',
          chambre_numero: '101',
          chambre_type: 'Simple',
          hotel_nom: 'Hôtel Central',
          hotel_ville: 'Paris',
          usager_nom: 'Dupont',
          usager_prenom: 'Marie',
          usager_telephone: '06 12 34 56 78',
          jours_restants: 0,
          est_termine: false
        },
        {
          id: 2,
          chambre_id: 2,
          hotel_id: 1,
          date_arrivee: yesterday.toISOString().split('T')[0],
          date_depart: yesterday.toISOString().split('T')[0],
          statut: 'CONFIRMEE',
          prescripteur: 'Emmaüs',
          prix: 120,
          duree: 1,
          notes: 'Séjour déjà terminé hier - Chambre à libérer',
          chambre_numero: '102',
          chambre_type: 'Double',
          hotel_nom: 'Hôtel Central',
          hotel_ville: 'Paris',
          usager_nom: 'Martin',
          usager_prenom: 'Pierre',
          usager_telephone: '06 98 76 54 32',
          jours_restants: -1,
          est_termine: true
        },
        {
          id: 3,
          chambre_id: 3,
          hotel_id: 2,
          date_arrivee: today.toISOString().split('T')[0],
          date_depart: tomorrow.toISOString().split('T')[0],
          statut: 'CONFIRMEE',
          prescripteur: 'Secours Catholique',
          prix: 95,
          duree: 1,
          notes: 'Séjour qui se termine demain - Préparer le départ',
          chambre_numero: '201',
          chambre_type: 'Simple',
          hotel_nom: 'Résidence du Port',
          hotel_ville: 'Marseille',
          usager_nom: 'Bernard',
          usager_prenom: 'Sophie',
          usager_telephone: '06 11 22 33 44',
          jours_restants: 1,
          est_termine: false
        },
        {
          id: 4,
          chambre_id: 4,
          hotel_id: 1,
          date_arrivee: yesterday.toISOString().split('T')[0],
          date_depart: yesterday.toISOString().split('T')[0],
          statut: 'CONFIRMEE',
          prescripteur: 'Croix-Rouge',
          prix: 150,
          duree: 2,
          notes: 'Séjour terminé - Nettoyage en cours',
          chambre_numero: '103',
          chambre_type: 'Suite',
          hotel_nom: 'Hôtel Central',
          hotel_ville: 'Paris',
          usager_nom: 'Leroy',
          usager_prenom: 'Jean',
          usager_telephone: '06 55 66 77 88',
          jours_restants: -1,
          est_termine: true
        }
      ];

      setEndingStays(demoData);
    } catch (err) {
      console.error('Erreur lors de la récupération des fins de séjour:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const refreshEndingStays = () => {
    fetchEndingStays();
  };

  return {
    endingStays,
    loading,
    error,
    refreshEndingStays
  };
}
