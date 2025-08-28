import { supabase } from '../supabase';
import type { ConventionTarifaire } from '../supabase';

export interface ConventionPriceData {
  client_id: number;
  category_id: number;
  hotel_id?: number;
  date_debut: string;
  date_fin?: string;
  prix_defaut: number;
  prix_mensuel?: {
    janvier?: number;
    fevrier?: number;
    mars?: number;
    avril?: number;
    mai?: number;
    juin?: number;
    juillet?: number;
    aout?: number;
    septembre?: number;
    octobre?: number;
    novembre?: number;
    decembre?: number;
  };
  reduction_pourcentage?: number;
  forfait_mensuel?: number;
  conditions?: string;
  active?: boolean;
}

export interface ConventionDetailView {
  id: number;
  client_id: number;
  client_nom: string;
  category_id: number;
  category_nom: string;
  category_capacite: number;
  hotel_id?: number;
  hotel_nom?: string;
  date_debut: string;
  date_fin?: string;
  prix_defaut: number;
  prix_janvier?: number;
  prix_fevrier?: number;
  prix_mars?: number;
  prix_avril?: number;
  prix_mai?: number;
  prix_juin?: number;
  prix_juillet?: number;
  prix_aout?: number;
  prix_septembre?: number;
  prix_octobre?: number;
  prix_novembre?: number;
  prix_decembre?: number;
  reduction_pourcentage?: number;
  forfait_mensuel?: number;
  conditions?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to clean monthly prices data
const cleanMonthlyPrices = (monthlyPrices: Record<string, number> | undefined): Record<string, number> | null => {
  if (!monthlyPrices) return null;
  
  const cleaned: Record<string, number> = {};
  Object.entries(monthlyPrices).forEach(([month, price]) => {
    if (price !== undefined && price !== null && price > 0) {
      cleaned[month] = price;
    }
  });
  
  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

export const conventionsApi = {
  // Créer ou mettre à jour une convention
  async upsertConvention(data: ConventionPriceData & { id?: number }) {
    try {
      // Clean and validate monthly prices
      const cleanedMonthlyPrices = cleanMonthlyPrices(data.prix_mensuel);
      
      // Validate required fields
      if (!data.prix_defaut || data.prix_defaut <= 0) {
        throw new Error('Le prix par défaut est requis et doit être supérieur à zéro');
      }
      
      const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
        p_client_id: data.client_id,
        p_category_id: data.category_id,
        p_hotel_id: data.hotel_id || null,
        p_date_debut: data.date_debut,
        p_date_fin: data.date_fin || null,
        p_prix_defaut: data.prix_defaut,
        p_prix_mensuel: cleanedMonthlyPrices ? JSON.stringify(cleanedMonthlyPrices) : null,
        p_reduction_pourcentage: data.reduction_pourcentage || null,
        p_forfait_mensuel: data.forfait_mensuel || null,
        p_conditions: data.conditions || null,
        p_active: data.active !== false,
        p_id: data.id || null
      });

      if (error) throw error;

      if (!result || result.length === 0) {
        throw new Error('Erreur lors de l\'enregistrement de la convention');
      }

      const response = result[0];
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'enregistrement');
      }

      return {
        success: true,
        data: { id: response.convention_id },
        message: response.message
      };
    } catch (error) {
      console.error('Error in upsertConvention:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  },

  // Récupérer les conventions d'un client
  async getClientConventions(clientId: number, activeOnly = false) {
    try {
      let query = supabase
        .from('v_conventions_tarifaires_detail')
        .select('*')
        .eq('client_id', clientId)
        .order('date_debut', { ascending: false });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data as ConventionDetailView[]
      };
    } catch (error) {
      console.error('Error in getClientConventions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des conventions'
      };
    }
  },

  // Récupérer le prix applicable pour une date et catégorie
  async getApplicablePrice(
    clientId: number,
    categoryId: number,
    date: string,
    month?: number
  ) {
    try {
      const { data, error } = await supabase.rpc('get_convention_price', {
        p_client_id: clientId,
        p_category_id: categoryId,
        p_date: date,
        p_month: month || null
      });

      if (error) throw error;

      return {
        success: true,
        price: data as number | null
      };
    } catch (error) {
      console.error('Error in getApplicablePrice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération du prix'
      };
    }
  },

  // Vérifier les chevauchements
  async checkOverlap(
    clientId: number,
    categoryId: number,
    dateDebut: string,
    dateFin?: string,
    excludeId?: number
  ) {
    try {
      const { data, error } = await supabase.rpc('check_convention_overlap', {
        p_client_id: clientId,
        p_category_id: categoryId,
        p_date_debut: dateDebut,
        p_date_fin: dateFin || null,
        p_exclude_id: excludeId || null
      });

      if (error) throw error;

      return {
        success: true,
        hasOverlap: data as boolean
      };
    } catch (error) {
      console.error('Error in checkOverlap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la vérification'
      };
    }
  },

  // Supprimer une convention
  async deleteConvention(id: number) {
    try {
      const { error } = await supabase
        .from('conventions_tarifaires')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Convention supprimée avec succès'
      };
    } catch (error) {
      console.error('Error in deleteConvention:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      };
    }
  },

  // Activer/Désactiver une convention
  async toggleConventionStatus(id: number, active: boolean) {
    try {
      const { error } = await supabase
        .from('conventions_tarifaires')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: `Convention ${active ? 'activée' : 'désactivée'} avec succès`
      };
    } catch (error) {
      console.error('Error in toggleConventionStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la modification du statut'
      };
    }
  },

  // Récupérer toutes les conventions pour une période
  async getConventionsByPeriod(
    dateDebut: string,
    dateFin: string,
    hotelId?: number,
    categoryId?: number
  ) {
    try {
      let query = supabase
        .from('v_conventions_tarifaires_detail')
        .select('*')
        .eq('active', true)
        .or(`date_debut.lte.${dateFin},date_fin.gte.${dateDebut},date_fin.is.null`);

      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data as ConventionDetailView[]
      };
    } catch (error) {
      console.error('Error in getConventionsByPeriod:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des conventions'
      };
    }
  },

  // Générer des données de test
  async generateTestData() {
    try {
      const testData: ConventionPriceData[] = [
        {
          client_id: 1,
          category_id: 1,
          hotel_id: 1,
          date_debut: '2024-01-01',
          date_fin: '2024-12-31',
          prix_defaut: 80,
          prix_mensuel: {
            janvier: 75,
            fevrier: 75,
            mars: 80,
            avril: 85,
            mai: 90,
            juin: 100,
            juillet: 120,
            aout: 120,
            septembre: 90,
            octobre: 85,
            novembre: 80,
            decembre: 85
          },
          reduction_pourcentage: 10,
          conditions: 'Tarif préférentiel entreprise - Chambre simple',
          active: true
        },
        {
          client_id: 1,
          category_id: 2,
          hotel_id: 1,
          date_debut: '2024-01-01',
          date_fin: '2024-12-31',
          prix_defaut: 120,
          prix_mensuel: {
            janvier: 110,
            fevrier: 110,
            juin: 140,
            juillet: 160,
            aout: 160,
            septembre: 130
          },
          reduction_pourcentage: 15,
          conditions: 'Tarif préférentiel entreprise - Chambre double',
          active: true
        },
        {
          client_id: 2,
          category_id: 1,
          hotel_id: 2,
          date_debut: '2024-03-01',
          date_fin: '2024-08-31',
          prix_defaut: 70,
          forfait_mensuel: 1800,
          conditions: 'Forfait mensuel association - 30 nuits garanties',
          active: true
        },
        {
          client_id: 3,
          category_id: 3,
          hotel_id: 1,
          date_debut: '2024-06-01',
          date_fin: '2024-09-30',
          prix_defaut: 150,
          prix_mensuel: {
            juin: 180,
            juillet: 200,
            aout: 200,
            septembre: 170
          },
          reduction_pourcentage: 20,
          conditions: 'Tarif été - Suite familiale',
          active: true
        }
      ];

      const results = [];
      for (const data of testData) {
        const result = await this.upsertConvention(data);
        results.push(result);
      }

      return {
        success: true,
        message: `${results.filter(r => r.success).length} conventions de test créées`,
        data: results
      };
    } catch (error) {
      console.error('Error in generateTestData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la génération des données de test'
      };
    }
  },

  // Calculer le prix avec réductions
  calculateFinalPrice(
    basePrice: number,
    reductionPercentage?: number,
    forfaitMensuel?: number
  ): number {
    if (forfaitMensuel) {
      return forfaitMensuel;
    }
    
    if (reductionPercentage) {
      return basePrice * (1 - reductionPercentage / 100);
    }
    
    return basePrice;
  }
};