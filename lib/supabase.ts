import { createClient } from '@supabase/supabase-js'

// Configuration Supabase Online - Production uniquement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for operations that need service role permissions (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// Types générés pour Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nom: string
          prenom: string
          telephone: string | null
          role: 'admin' | 'manager' | 'comptable' | 'receptionniste'
          hotel_id: number | null
          statut: 'actif' | 'inactif'
          date_creation: string
          derniere_connexion: string | null
          permissions: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nom: string
          prenom: string
          telephone?: string | null
          role: 'admin' | 'manager' | 'comptable' | 'receptionniste'
          hotel_id?: number | null
          statut?: 'actif' | 'inactif'
          date_creation?: string
          derniere_connexion?: string | null
          permissions?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nom?: string
          prenom?: string
          telephone?: string | null
          role?: 'admin' | 'manager' | 'comptable' | 'receptionniste'
          hotel_id?: number | null
          statut?: 'actif' | 'inactif'
          date_creation?: string
          derniere_connexion?: string | null
          permissions?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
      }
      hotels: {
        Row: {
          id: number
          nom: string
          adresse: string
          ville: string
          code_postal: string
          telephone: string | null
          email: string | null
          gestionnaire: string | null
          statut: 'ACTIF' | 'INACTIF'
          chambres_total: number
          chambres_occupees: number
          taux_occupation: number
          siret: string | null
          tva_intracommunautaire: string | null
          directeur: string | null
          telephone_directeur: string | null
          email_directeur: string | null
          capacite: number | null
          categories: string[] | null
          services: string[] | null
          horaires: Record<string, unknown> | null
          // Nouveaux champs d'adresse
          adresse_ligne_2: string | null
          region: string | null
          pays: string | null
          telephone_2: string | null
          fax: string | null
          site_web: string | null
          // Nouveaux champs de description et branding
          description: string | null
          logo_url: string | null
          images: Record<string, unknown>[] | null
          amenities: Record<string, unknown>[] | null
          // Nouveaux champs opérationnels
          check_in_time: string | null
          check_out_time: string | null
          policies: Record<string, unknown> | null
          contact_info: Record<string, unknown> | null
          // Champs manquants mais requis
          user_owner_id: string
          // Nouveaux champs de gestion avancée
          type_etablissement: 'hotel' | 'residence' | 'foyer' | 'chrs' | 'chr' | 'autre' | null
          license_number: string | null
          date_ouverture: string | null
          classement_etoiles: number | null
          surface_totale: number | null
          nombre_etages: number | null
          parking_places: number | null
          accessibilite: Record<string, unknown> | null
          certifications: string[] | null
          notes_internes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          adresse: string
          ville: string
          code_postal: string
          telephone?: string | null
          email?: string | null
          gestionnaire?: string | null
          statut?: 'ACTIF' | 'INACTIF'
          chambres_total?: number
          chambres_occupees?: number
          taux_occupation?: number
          siret?: string | null
          tva_intracommunautaire?: string | null
          directeur?: string | null
          telephone_directeur?: string | null
          email_directeur?: string | null
          capacite?: number | null
          categories?: string[] | null
          services?: string[] | null
          horaires?: Record<string, unknown> | null
          // Nouveaux champs d'adresse
          adresse_ligne_2?: string | null
          region?: string | null
          pays?: string | null
          telephone_2?: string | null
          fax?: string | null
          site_web?: string | null
          // Nouveaux champs de description et branding
          description?: string | null
          logo_url?: string | null
          images?: Record<string, unknown>[] | null
          amenities?: Record<string, unknown>[] | null
          // Nouveaux champs opérationnels
          check_in_time?: string | null
          check_out_time?: string | null
          policies?: Record<string, unknown> | null
          contact_info?: Record<string, unknown> | null
          // Champ requis pour l'authentification
          user_owner_id: string
          // Nouveaux champs de gestion avancée
          type_etablissement?: 'hotel' | 'residence' | 'foyer' | 'chrs' | 'chr' | 'autre' | null
          license_number?: string | null
          date_ouverture?: string | null
          classement_etoiles?: number | null
          surface_totale?: number | null
          nombre_etages?: number | null
          parking_places?: number | null
          accessibilite?: Record<string, unknown> | null
          certifications?: string[] | null
          notes_internes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          adresse?: string
          ville?: string
          code_postal?: string
          telephone?: string | null
          email?: string | null
          gestionnaire?: string | null
          statut?: 'ACTIF' | 'INACTIF'
          chambres_total?: number
          chambres_occupees?: number
          taux_occupation?: number
          siret?: string | null
          tva_intracommunautaire?: string | null
          directeur?: string | null
          telephone_directeur?: string | null
          email_directeur?: string | null
          capacite?: number | null
          categories?: string[] | null
          services?: string[] | null
          horaires?: Record<string, unknown> | null
          // Nouveaux champs d'adresse
          adresse_ligne_2?: string | null
          region?: string | null
          pays?: string | null
          telephone_2?: string | null
          fax?: string | null
          site_web?: string | null
          // Nouveaux champs de description et branding
          description?: string | null
          logo_url?: string | null
          images?: Record<string, unknown>[] | null
          amenities?: Record<string, unknown>[] | null
          // Nouveaux champs opérationnels
          check_in_time?: string | null
          check_out_time?: string | null
          policies?: Record<string, unknown> | null
          contact_info?: Record<string, unknown> | null
          // user_owner_id ne peut pas être modifié après création
          // Nouveaux champs de gestion avancée
          type_etablissement?: 'hotel' | 'residence' | 'foyer' | 'chrs' | 'chr' | 'autre' | null
          license_number?: string | null
          date_ouverture?: string | null
          classement_etoiles?: number | null
          surface_totale?: number | null
          nombre_etages?: number | null
          parking_places?: number | null
          accessibilite?: Record<string, unknown> | null
          certifications?: string[] | null
          notes_internes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: number
          hotel_id: number
          numero: string
          type: string
          prix: number
          statut: 'disponible' | 'occupee' | 'maintenance'
          description: string | null
          floor: number | null
          room_size: number | null
          bed_type: string | null
          view_type: string | null
          is_smoking: boolean | null
          images: Record<string, unknown>[] | null
          amenities: Record<string, unknown>[] | null
          equipment_ids: number[] | null
          last_cleaned: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          hotel_id: number
          numero: string
          type: string
          prix: number
          statut?: 'disponible' | 'occupee' | 'maintenance'
          description?: string | null
          floor?: number | null
          room_size?: number | null
          bed_type?: string | null
          view_type?: string | null
          is_smoking?: boolean | null
          images?: Record<string, unknown>[] | null
          amenities?: Record<string, unknown>[] | null
          equipment_ids?: number[] | null
          last_cleaned?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          hotel_id?: number
          numero?: string
          type?: string
          prix?: number
          statut?: 'disponible' | 'occupee' | 'maintenance'
          description?: string | null
          floor?: number | null
          room_size?: number | null
          bed_type?: string | null
          view_type?: string | null
          is_smoking?: boolean | null
          images?: Record<string, unknown>[] | null
          amenities?: Record<string, unknown>[] | null
          equipment_ids?: number[] | null
          last_cleaned?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usagers: {
        Row: {
          id: number
          nom: string
          prenom: string
          date_naissance: string | null
          adresse: string | null
          telephone: string | null
          email: string | null
          numero_secu: string | null
          situation_familiale: string | null
          nombre_enfants: number
          revenus: number | null
          prestations: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          prenom: string
          date_naissance?: string | null
          adresse?: string | null
          telephone?: string | null
          email?: string | null
          numero_secu?: string | null
          situation_familiale?: string | null
          nombre_enfants?: number
          revenus?: number | null
          prestations?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          prenom?: string
          date_naissance?: string | null
          adresse?: string | null
          telephone?: string | null
          email?: string | null
          numero_secu?: string | null
          situation_familiale?: string | null
          nombre_enfants?: number
          revenus?: number | null
          prestations?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      operateurs_sociaux: {
        Row: {
          id: number
          nom: string
          prenom: string
          organisation: string
          telephone: string | null
          email: string | null
          statut: 'actif' | 'inactif'
          specialite: string | null
          zone_intervention: string | null
          nombre_reservations: number
          date_creation: string
          notes: string | null
          siret: string | null
          adresse: string | null
          responsable: string | null
          telephone_responsable: string | null
          email_responsable: string | null
          agrement: string | null
          date_agrement: string | null
          zone_intervention_array: string[] | null
          specialites: string[] | null
          partenariats: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          prenom: string
          organisation: string
          telephone?: string | null
          email?: string | null
          statut?: 'actif' | 'inactif'
          specialite?: string | null
          zone_intervention?: string | null
          nombre_reservations?: number
          date_creation?: string
          notes?: string | null
          siret?: string | null
          adresse?: string | null
          responsable?: string | null
          telephone_responsable?: string | null
          email_responsable?: string | null
          agrement?: string | null
          date_agrement?: string | null
          zone_intervention_array?: string[] | null
          specialites?: string[] | null
          partenariats?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          prenom?: string
          organisation?: string
          telephone?: string | null
          email?: string | null
          statut?: 'actif' | 'inactif'
          specialite?: string | null
          zone_intervention?: string | null
          nombre_reservations?: number
          date_creation?: string
          notes?: string | null
          siret?: string | null
          adresse?: string | null
          responsable?: string | null
          telephone_responsable?: string | null
          email_responsable?: string | null
          agrement?: string | null
          date_agrement?: string | null
          zone_intervention_array?: string[] | null
          specialites?: string[] | null
          partenariats?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: number
          usager_id: number
          chambre_id: number
          hotel_id: number
          date_arrivee: string
          date_depart: string
          statut: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'
          prescripteur: string
          prix: number
          duree: number
          operateur_id: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          usager_id: number
          chambre_id: number
          hotel_id: number
          date_arrivee: string
          date_depart: string
          statut?: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'
          prescripteur: string
          prix: number
          duree: number
          operateur_id?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          usager_id?: number
          chambre_id?: number
          hotel_id?: number
          date_arrivee?: string
          date_depart?: string
          statut?: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'
          prescripteur?: string
          prix?: number
          duree?: number
          operateur_id?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conventions_prix: {
        Row: {
          id: number
          operateur_id: number
          hotel_id: number
          type_chambre: string
          prix_conventionne: number
          prix_standard: number
          reduction: number
          date_debut: string
          date_fin: string | null
          statut: 'active' | 'expiree' | 'suspendue'
          conditions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          operateur_id: number
          hotel_id: number
          type_chambre: string
          prix_conventionne: number
          prix_standard: number
          reduction: number
          date_debut: string
          date_fin?: string | null
          statut?: 'active' | 'expiree' | 'suspendue'
          conditions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          operateur_id?: number
          hotel_id?: number
          type_chambre?: string
          prix_conventionne?: number
          prix_standard?: number
          reduction?: number
          date_debut?: string
          date_fin?: string | null
          statut?: 'active' | 'expiree' | 'suspendue'
          conditions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      processus_reservations: {
        Row: {
          id: number
          reservation_id: number
          statut: 'en_cours' | 'termine' | 'annule'
          date_debut: string
          date_fin: string | null
          duree_estimee: number | null
          priorite: 'basse' | 'normale' | 'haute' | 'urgente'
          etapes: Record<string, unknown>[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          reservation_id: number
          statut?: 'en_cours' | 'termine' | 'annule'
          date_debut?: string
          date_fin?: string | null
          duree_estimee?: number | null
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente'
          etapes?: Record<string, unknown>[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          reservation_id?: number
          statut?: 'en_cours' | 'termine' | 'annule'
          date_debut?: string
          date_fin?: string | null
          duree_estimee?: number | null
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente'
          etapes?: Record<string, unknown>[] | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: number
          operateur_id: number
          admin_id: string | null
          sujet: string
          date_creation: string
          date_dernier_message: string
          nombre_messages: number
          statut: 'active' | 'terminee' | 'archivée'
          derniere_message: string | null
          non_lus: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          operateur_id: number
          admin_id?: string | null
          sujet: string
          date_creation?: string
          date_dernier_message?: string
          nombre_messages?: number
          statut?: 'active' | 'terminee' | 'archivée'
          derniere_message?: string | null
          non_lus?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          operateur_id?: number
          admin_id?: string | null
          sujet?: string
          date_creation?: string
          date_dernier_message?: string
          nombre_messages?: number
          statut?: 'active' | 'terminee' | 'archivée'
          derniere_message?: string | null
          non_lus?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          conversation_id: number
          expediteur_id: string | null
          expediteur_type: 'admin' | 'operateur'
          destinataire_id: number | null
          destinataire_type: 'admin' | 'operateur'
          sujet: string | null
          contenu: string
          date_envoi: string
          date_lecture: string | null
          statut: 'envoye' | 'lu' | 'repondu'
          priorite: 'normale' | 'importante' | 'urgente'
          piece_jointe: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          conversation_id: number
          expediteur_id?: string | null
          expediteur_type: 'admin' | 'operateur'
          destinataire_id?: number | null
          destinataire_type: 'admin' | 'operateur'
          sujet?: string | null
          contenu: string
          date_envoi?: string
          date_lecture?: string | null
          statut?: 'envoye' | 'lu' | 'repondu'
          priorite?: 'normale' | 'importante' | 'urgente'
          piece_jointe?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          conversation_id?: number
          expediteur_id?: string | null
          expediteur_type?: 'admin' | 'operateur'
          destinataire_id?: number | null
          destinataire_type?: 'admin' | 'operateur'
          sujet?: string | null
          contenu?: string
          date_envoi?: string
          date_lecture?: string | null
          statut?: 'envoye' | 'lu' | 'repondu'
          priorite?: 'normale' | 'importante' | 'urgente'
          piece_jointe?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_templates: {
        Row: {
          id: number
          nom: string
          type: 'facture' | 'bon_reservation' | 'prolongation_reservation' | 'fin_prise_charge'
          description: string | null
          contenu: string
          variables: Record<string, unknown> | null
          statut: 'actif' | 'inactif'
          date_creation: string
          date_modification: string
          version: string
          format: 'pdf' | 'docx' | 'html'
          en_tete: string | null
          pied_de_page: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          type: 'facture' | 'bon_reservation' | 'prolongation_reservation' | 'fin_prise_charge'
          description?: string | null
          contenu: string
          variables?: Record<string, unknown> | null
          statut?: 'actif' | 'inactif'
          date_creation?: string
          date_modification?: string
          version?: string
          format?: 'pdf' | 'docx' | 'html'
          en_tete?: string | null
          pied_de_page?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          type?: 'facture' | 'bon_reservation' | 'prolongation_reservation' | 'fin_prise_charge'
          description?: string | null
          contenu?: string
          variables?: Record<string, unknown> | null
          statut?: 'actif' | 'inactif'
          date_creation?: string
          date_modification?: string
          version?: string
          format?: 'pdf' | 'docx' | 'html'
          en_tete?: string | null
          pied_de_page?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: number
          template_id: number
          reservation_id: number | null
          nom: string
          type: string
          contenu: string
          variables_remplies: Record<string, unknown> | null
          date_generation: string
          fichier_url: string | null
          statut: 'genere' | 'envoye' | 'archive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          template_id: number
          reservation_id?: number | null
          nom: string
          type: string
          contenu: string
          variables_remplies?: Record<string, unknown> | null
          date_generation?: string
          fichier_url?: string | null
          statut?: 'genere' | 'envoye' | 'archive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          template_id?: number
          reservation_id?: number | null
          nom?: string
          type?: string
          contenu?: string
          variables_remplies?: Record<string, unknown> | null
          date_generation?: string
          fichier_url?: string | null
          statut?: 'genere' | 'envoye' | 'archive'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string | null
          type: 'success' | 'warning' | 'info' | 'error'
          message: string
          lu: boolean
          date_creation: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          type: 'success' | 'warning' | 'info' | 'error'
          message: string
          lu?: boolean
          date_creation?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          type?: 'success' | 'warning' | 'info' | 'error'
          message?: string
          lu?: boolean
          date_creation?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: number
          nom: string
          prenom: string | null
          email: string | null
          telephone: string | null
          adresse: string | null
          ville: string | null
          code_postal: string | null
          type_id: number
          statut: 'actif' | 'inactif' | 'prospect'
          numero_client: string | null
          raison_sociale: string | null
          siret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          prenom?: string | null
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          type_id?: number
          statut?: 'actif' | 'inactif' | 'prospect'
          numero_client?: string | null
          raison_sociale?: string | null
          siret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          prenom?: string | null
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          type_id?: number
          statut?: 'actif' | 'inactif' | 'prospect'
          numero_client?: string | null
          raison_sociale?: string | null
          siret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      referents: {
        Row: {
          id: number
          client_id: number
          nom: string
          prenom: string | null
          fonction: string | null
          telephone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          client_id: number
          nom: string
          prenom?: string | null
          fonction?: string | null
          telephone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          client_id?: number
          nom?: string
          prenom?: string | null
          fonction?: string | null
          telephone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conventions_tarifaires: {
        Row: {
          id: number
          client_id: number
          date_debut: string | null
          date_fin: string | null
          reduction_pourcentage: number | null
          forfait_mensuel: number | null
          conditions: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          client_id: number
          date_debut?: string | null
          date_fin?: string | null
          reduction_pourcentage?: number | null
          forfait_mensuel?: number | null
          conditions?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          client_id?: number
          date_debut?: string | null
          date_fin?: string | null
          reduction_pourcentage?: number | null
          forfait_mensuel?: number | null
          conditions?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      client_types: {
        Row: {
          id: number
          nom: string
          description: string | null
          icone: string | null
          couleur: string | null
          ordre: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          description?: string | null
          icone?: string | null
          couleur?: string | null
          ordre?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          description?: string | null
          icone?: string | null
          couleur?: string | null
          ordre?: number
          created_at?: string
          updated_at?: string
        }
      }
      establishments: {
        Row: {
          id: number
          name: string
          type: string
          address: string | null
          city: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          email: string | null
          website: string | null
          description: string | null
          logo: string | null
          facilities: Record<string, unknown>[] | null
          policies: Record<string, unknown> | null | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          type?: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          logo?: string | null
          facilities?: Record<string, unknown>[] | null
          policies?: Record<string, unknown> | null | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          logo?: string | null
          facilities?: Record<string, unknown>[] | null
          policies?: Record<string, unknown> | null | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      equipments: {
        Row: {
          id: number
          nom: string
          nom_en: string | null
          description: string | null
          description_en: string | null
          icone: string | null
          categorie: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
          couleur: string | null
          est_premium: boolean
          ordre_affichage: number
          est_actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          nom_en?: string | null
          description?: string | null
          description_en?: string | null
          icone?: string | null
          categorie?: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
          couleur?: string | null
          est_premium?: boolean
          ordre_affichage?: number
          est_actif?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nom?: string
          nom_en?: string | null
          description?: string | null
          description_en?: string | null
          icone?: string | null
          categorie?: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
          couleur?: string | null
          est_premium?: boolean
          ordre_affichage?: number
          est_actif?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      equipment_assignments: {
        Row: {
          id: number
          hotel_id: number
          equipment_id: number
          room_id: number | null
          est_disponible: boolean
          est_gratuit: boolean | null
          est_fonctionnel: boolean | null
          prix_supplement: number | null
          description_specifique: string | null
          horaires_disponibilite: Record<string, unknown> | null
          conditions_usage: string | null
          date_ajout: string
          date_installation: string | null
          date_derniere_maj: string
          date_derniere_verification: string | null
          notes_internes: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          hotel_id: number
          equipment_id: number
          room_id?: number | null
          est_disponible?: boolean
          est_gratuit?: boolean | null
          est_fonctionnel?: boolean | null
          prix_supplement?: number | null
          description_specifique?: string | null
          horaires_disponibilite?: Record<string, unknown> | null
          conditions_usage?: string | null
          date_ajout?: string
          date_installation?: string | null
          date_derniere_maj?: string
          date_derniere_verification?: string | null
          notes_internes?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          hotel_id?: number
          equipment_id?: number
          room_id?: number | null
          est_disponible?: boolean
          est_gratuit?: boolean | null
          est_fonctionnel?: boolean | null
          prix_supplement?: number | null
          description_specifique?: string | null
          horaires_disponibilite?: Record<string, unknown> | null
          conditions_usage?: string | null
          date_ajout?: string
          date_installation?: string | null
          date_derniere_maj?: string
          date_derniere_verification?: string | null
          notes_internes?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Types spécifiques
export type User = Tables<'users'>
export type Hotel = Tables<'hotels'>
export type Establishment = Tables<'hotels'> // Alias pour clarté
export type Room = Tables<'rooms'>
export type RoomInsert = Inserts<'rooms'>
export type RoomUpdate = Updates<'rooms'>
export type Usager = Tables<'usagers'>
export type OperateurSocial = Tables<'operateurs_sociaux'>
export type Reservation = Tables<'reservations'>
export type ConventionPrix = Tables<'conventions_prix'>
export type ProcessusReservation = Tables<'processus_reservations'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type DocumentTemplate = Tables<'document_templates'>
export type Document = Tables<'documents'>
export type Notification = Tables<'notifications'>
export type Client = Tables<'clients'>
export type ClientType = Tables<'client_types'>
export type Referent = Tables<'referents'>
export type ConventionTarifaire = Tables<'conventions_tarifaires'>
export type Equipment = Tables<'equipments'>
export type EquipmentInsert = Inserts<'equipments'>
export type EquipmentUpdate = Updates<'equipments'>
export type EquipmentAssignment = Tables<'equipment_assignments'>
export type EquipmentAssignmentInsert = Inserts<'equipment_assignments'>
export type EquipmentAssignmentUpdate = Updates<'equipment_assignments'>

// Backward compatibility types (deprecated - use EquipmentAssignment instead)
export type HotelEquipment = EquipmentAssignment
export type HotelEquipmentInsert = EquipmentAssignmentInsert
export type HotelEquipmentUpdate = EquipmentAssignmentUpdate
export type RoomEquipment = EquipmentAssignment
export type RoomEquipmentInsert = EquipmentAssignmentInsert
export type RoomEquipmentUpdate = EquipmentAssignmentUpdate

// Extended types with relationships
export interface EquipmentWithHotelInfo extends Equipment {
  equipment_assignment?: EquipmentAssignment
  is_available_in_hotel?: boolean
  is_free?: boolean
  supplement_price?: number | null
}

export interface EquipmentAssignmentWithDetails extends EquipmentAssignment {
  equipment?: Equipment
}

// Backward compatibility types (deprecated - use EquipmentAssignmentWithDetails instead)
export interface HotelEquipmentWithDetails extends EquipmentAssignment {
  equipment?: Equipment
}

export interface RoomEquipmentWithDetails extends EquipmentAssignment {
  equipment?: Equipment
}

// Simplified client types
export interface ClientWithDetails extends Client {
  type?: ClientType
  referents?: Referent[]
  conventions?: ConventionTarifaire[]
}

export interface ClientFormData {
  // Basic info (essential only)
  nom: string
  prenom?: string
  raison_sociale?: string
  siret?: string
  email?: string
  telephone?: string
  adresse?: string
  code_postal?: string
  ville?: string
  type_id?: number
  statut?: 'actif' | 'inactif' | 'prospect'
  
  // Billing information
  mode_paiement?: 'virement' | 'cheque' | 'especes' | 'carte'
  delai_paiement?: number
  taux_tva?: number
  
  // Referent data
  referent_nom?: string
  referent_prenom?: string
  referent_telephone?: string
  referent_email?: string
  referent_fonction?: string
  
  // Convention data (only for non-Particulier)
  convention_date_debut?: string
  convention_date_fin?: string
  convention_reduction_pourcentage?: number
  convention_forfait_mensuel?: number
  convention_conditions?: string
  convention_active?: boolean
}

export interface ClientSearchResult {
  id: number
  numero_client: string
  nom_complet: string
  type_nom: string
  email?: string
  telephone?: string
  ville?: string
  statut: string
  date_creation: string
}

export interface ClientStatistics {
  total_clients: number
  clients_actifs: number
  nouveaux_ce_mois: number
}

// Simplified referent and convention form data
export interface ReferentFormData {
  nom: string
  prenom?: string
  fonction?: string
  telephone?: string
  email?: string
}

export interface ConventionFormData {
  date_debut?: string
  date_fin?: string
  reduction_pourcentage?: number
  forfait_mensuel?: number
  conditions?: string
  active: boolean
}

// Room-specific types for API responses
export interface RoomAvailabilityCheck {
  available: boolean
  conflictingReservations?: any[]
  reason?: string
}

export interface RoomFilters {
  statut?: 'disponible' | 'occupee' | 'maintenance'
  type?: string
  floor?: number
  bed_type?: string
  view_type?: string
  is_smoking?: boolean
  limit?: number
  offset?: number
}

export interface RoomStatistics {
  total: number
  available: number
  occupied: number
  maintenance: number
  occupancyRate: number
  averagePrice?: number
  roomsByType: Record<string, number>
  roomsByFloor?: Record<string, number>
  potentialRevenue?: number
}

// Fonctions helper pour les établissements
export const establishmentHelpers = {
  // Récupérer tous les établissements actifs
  async getActiveEstablishments() {
    return await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .order('nom')
  },


  // Créer un établissement avec catégories par défaut
  async createEstablishmentWithDefaults(data: Inserts<'hotels'>) {
    const { data: establishment, error } = await supabase.rpc(
      'create_establishment_with_default_categories',
      {
        p_nom: data.nom,
        p_adresse: data.adresse,
        p_ville: data.ville,
        p_code_postal: data.code_postal,
        p_telephone: data.telephone,
        p_email: data.email,
        p_description: data.description,
        p_type_etablissement: data.type_etablissement || 'hotel'
      }
    )
    return { data: establishment, error }
  },

  // Obtenir les statistiques d'un établissement
  async getEstablishmentStatistics(id: number) {
    return await supabase.rpc('get_hotel_statistics', { p_hotel_id: id })
  }
}


// Fonctions helper pour les équipements
// ====================================
// Hotel-specific Equipment Types
// ====================================

// Hotel Equipment (hotel-owned equipment catalog)
export interface HotelEquipment {
  id: number
  hotel_id: number
  nom: string
  description: string | null
  categorie: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
  icone: string | null
  couleur: string | null
  est_premium: boolean
  est_actif: boolean
  ordre_affichage: number
  created_at: string
  updated_at: string
}

export interface HotelEquipmentInsert {
  hotel_id: number
  nom: string
  description?: string | null
  categorie?: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
  icone?: string | null
  couleur?: string | null
  est_premium?: boolean
  est_actif?: boolean
  ordre_affichage?: number
}

export interface HotelEquipmentUpdate {
  nom?: string
  description?: string | null
  categorie?: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
  icone?: string | null
  couleur?: string | null
  est_premium?: boolean
  est_actif?: boolean
  ordre_affichage?: number
}

// Room Equipment Assignments (links hotel equipment to rooms)
export interface RoomEquipmentAssignment {
  id: number
  room_id: number
  hotel_equipment_id: number
  est_fonctionnel: boolean
  notes: string | null
  date_installation: string | null
  created_at: string
  updated_at: string
}

export interface RoomEquipmentAssignmentInsert {
  room_id: number
  hotel_equipment_id: number
  est_fonctionnel?: boolean
  notes?: string | null
  date_installation?: string | null
}

export interface RoomEquipmentWithDetails extends RoomEquipmentAssignment {
  hotel_equipment?: HotelEquipment
}

export const equipmentHelpers = {
  // Récupérer tous les équipements actifs
  async getAllEquipments() {
    return await supabase
      .from('equipments')
      .select('*')
      .eq('est_actif', true)
      .order('categorie, ordre_affichage')
  },

  // Récupérer les équipements par catégorie
  async getEquipmentsByCategory(category: string) {
    return await supabase
      .from('equipments')
      .select('*')
      .eq('categorie', category)
      .eq('est_actif', true)
      .order('ordre_affichage')
  },


  // Obtenir les statistiques des équipements
  async getEquipmentStatistics() {
    return await supabase.rpc('get_equipment_statistics')
  }
}


// API Layer References
// For establishments CRUD operations, use the dedicated API:
// import { establishmentsApi } from '@/lib/api/establishments'