/**
 * Hook pour gérer les individus liés à un usager
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { IndividuRow, IndividuInsert, IndividuUpdate } from '@/lib/supabase';

interface UseIndividusResult {
  individus: IndividuRow[];
  loading: boolean;
  error: string | null;
  fetchIndividus: () => Promise<void>;
  createIndividu: (data: IndividuInsert) => Promise<{ success: boolean; error?: string }>;
  updateIndividu: (id: number, data: IndividuUpdate) => Promise<{ success: boolean; error?: string }>;
  deleteIndividu: (id: number) => Promise<{ success: boolean; error?: string }>;
  setChefFamille: (id: number) => Promise<{ success: boolean; error?: string }>;
  createIndividusBatch: (data: IndividuInsert[]) => Promise<{ success: boolean; error?: string }>;
}

export function useIndividus(usagerId?: number): UseIndividusResult {
  const [individus, setIndividus] = useState<IndividuRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les individus
  const fetchIndividus = useCallback(async () => {
    if (!usagerId) {
      setIndividus([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('individus')
        .select('*')
        .eq('usager_id', usagerId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setIndividus(data || []);
    } catch (err) {
      console.error('Error fetching individus:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [usagerId]);

  // Charger au montage et quand usagerId change
  useEffect(() => {
    fetchIndividus();
  }, [fetchIndividus]);

  // Créer un individu
  const createIndividu = async (data: IndividuInsert) => {
    try {
      const { error: insertError } = await supabase
        .from('individus')
        .insert(data);

      if (insertError) throw insertError;
      
      await fetchIndividus();
      return { success: true };
    } catch (err) {
      console.error('Error creating individu:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création' 
      };
    }
  };

  // Créer plusieurs individus en batch
  const createIndividusBatch = async (data: IndividuInsert[]) => {
    try {
      const { error: insertError } = await supabase
        .from('individus')
        .insert(data);

      if (insertError) throw insertError;
      
      await fetchIndividus();
      return { success: true };
    } catch (err) {
      console.error('Error creating individus batch:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création en batch' 
      };
    }
  };

  // Mettre à jour un individu
  const updateIndividu = async (id: number, data: IndividuUpdate) => {
    try {
      const { error: updateError } = await supabase
        .from('individus')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      
      await fetchIndividus();
      return { success: true };
    } catch (err) {
      console.error('Error updating individu:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' 
      };
    }
  };

  // Supprimer un individu
  const deleteIndividu = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('individus')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchIndividus();
      return { success: true };
    } catch (err) {
      console.error('Error deleting individu:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression' 
      };
    }
  };

  // Définir un individu comme chef de famille
  const setChefFamille = async (id: number) => {
    if (!usagerId) {
      return { success: false, error: 'Usager ID manquant' };
    }

    try {
      // D'abord, retirer le statut chef de famille de tous les autres
      const { error: resetError } = await supabase
        .from('individus')
        .update({ is_chef_famille: false })
        .eq('usager_id', usagerId);

      if (resetError) throw resetError;

      // Ensuite, définir le nouveau chef de famille
      const { error: updateError } = await supabase
        .from('individus')
        .update({ is_chef_famille: true })
        .eq('id', id);

      if (updateError) throw updateError;
      
      await fetchIndividus();
      return { success: true };
    } catch (err) {
      console.error('Error setting chef de famille:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de la définition du chef de famille' 
      };
    }
  };

  return {
    individus,
    loading,
    error,
    fetchIndividus,
    createIndividu,
    updateIndividu,
    deleteIndividu,
    setChefFamille,
    createIndividusBatch
  };
}