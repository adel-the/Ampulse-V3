import { supabase } from '../lib/supabase';
import { 
  generateHotels, 
  generateOperateursSociaux, 
  generateUsers, 
  generateReservations 
} from './dataGenerators';

export interface MigrationResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

export class SupabaseMigrationService {
  // Migrer les hôtels
  static async migrateHotels(): Promise<MigrationResult> {
    try {
      const hotels = generateHotels();
      
      const { data, error } = await supabase
        .from('hotels')
        .insert(hotels)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `${data?.length || 0} hôtels migrés avec succès`,
        count: data?.length || 0
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erreur lors de la migration des hôtels',
        error: err.message
      };
    }
  }

  // Migrer les opérateurs sociaux
  static async migrateOperateurs(): Promise<MigrationResult> {
    try {
      const operateurs = generateOperateursSociaux();
      
      const { data, error } = await supabase
        .from('operateurs_sociaux')
        .insert(operateurs)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `${data?.length || 0} opérateurs sociaux migrés avec succès`,
        count: data?.length || 0
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erreur lors de la migration des opérateurs sociaux',
        error: err.message
      };
    }
  }

  // Migrer les clients
  static async migrateClients(): Promise<MigrationResult> {
    try {
      const hotels = generateHotels();
      const clients = generateUsers(hotels);
      
      const { data, error } = await supabase
        .from('clients')
        .insert(clients)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `${data?.length || 0} clients migrés avec succès`,
        count: data?.length || 0
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erreur lors de la migration des clients',
        error: err.message
      };
    }
  }



  // Migrer les réservations
  static async migrateReservations(): Promise<MigrationResult> {
    try {
      // Récupérer les données nécessaires
      const { data: hotels, error: hotelsError } = await supabase
        .from('hotels')
        .select('id');

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, hotel_id');

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id');

      const { data: operateurs, error: operateursError } = await supabase
        .from('operateurs_sociaux')
        .select('id');

      if (hotelsError || roomsError || clientsError || operateursError) {
        throw new Error('Erreur lors de la récupération des données de référence');
      }

      if (!hotels || hotels.length === 0) {
        return {
          success: false,
          message: 'Aucun hôtel trouvé. Migrez d\'abord les hôtels.',
          error: 'Hôtels manquants'
        };
      }

      if (!rooms || rooms.length === 0) {
        return {
          success: false,
          message: 'Aucune chambre trouvée. Migrez d\'abord les chambres.',
          error: 'Chambres manquantes'
        };
      }

      const reservations = generateReservations();
      
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservations)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `${data?.length || 0} réservations migrées avec succès`,
        count: data?.length || 0
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erreur lors de la migration des réservations',
        error: err.message
      };
    }
  }

  // Migration complète
  static async migrateAll(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    // Migration dans l'ordre des dépendances
    results.push(await this.migrateHotels());
    results.push(await this.migrateOperateurs());
    results.push(await this.migrateClients());
    results.push(await this.migrateReservations());

    return results;
  }

  // Vérifier l'état de la migration
  static async checkMigrationStatus(): Promise<{
    hotels: number;
    operateurs: number;
    clients: number;
    chambres: number;
    reservations: number;
  }> {
    const { count: hotels } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });

    const { count: operateurs } = await supabase
      .from('operateurs_sociaux')
      .select('*', { count: 'exact', head: true });

    const { count: clients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const { count: chambres } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });

    const { count: reservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });

    return {
      hotels: hotels || 0,
      operateurs: operateurs || 0,
      clients: clients || 0,
      chambres: chambres || 0,
      reservations: reservations || 0
    };
  }

  // Nettoyer toutes les données
  static async clearAllData(): Promise<MigrationResult> {
    try {
      // Supprimer dans l'ordre inverse des dépendances
      await supabase.from('reservations').delete().neq('id', 0);
      await supabase.from('rooms').delete().neq('id', 0);
      await supabase.from('clients').delete().neq('id', 0);
      await supabase.from('operateurs_sociaux').delete().neq('id', 0);
      await supabase.from('hotels').delete().neq('id', 0);

      return {
        success: true,
        message: 'Toutes les données ont été supprimées'
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erreur lors de la suppression des données',
        error: err.message
      };
    }
  }
} 