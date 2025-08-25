export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      equipments: {
        Row: {
          categorie: string | null
          couleur: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          est_actif: boolean | null
          est_premium: boolean | null
          icone: string | null
          id: number
          nom: string
          nom_en: string | null
          ordre_affichage: number | null
          updated_at: string | null
        }
        Insert: {
          categorie?: string | null
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          est_actif?: boolean | null
          est_premium?: boolean | null
          icone?: string | null
          id?: number
          nom: string
          nom_en?: string | null
          ordre_affichage?: number | null
          updated_at?: string | null
        }
        Update: {
          categorie?: string | null
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          est_actif?: boolean | null
          est_premium?: boolean | null
          icone?: string | null
          id?: number
          nom?: string
          nom_en?: string | null
          ordre_affichage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hotel_equipments: {
        Row: {
          conditions_usage: string | null
          created_at: string | null
          date_ajout: string | null
          date_derniere_maj: string | null
          description_specifique: string | null
          equipment_id: number
          est_disponible: boolean | null
          est_gratuit: boolean | null
          horaires_disponibilite: Json | null
          hotel_id: number
          id: number
          notes_internes: string | null
          prix_supplement: number | null
          updated_at: string | null
        }
        Insert: {
          conditions_usage?: string | null
          created_at?: string | null
          date_ajout?: string | null
          date_derniere_maj?: string | null
          description_specifique?: string | null
          equipment_id: number
          est_disponible?: boolean | null
          est_gratuit?: boolean | null
          horaires_disponibilite?: Json | null
          hotel_id: number
          id?: number
          notes_internes?: string | null
          prix_supplement?: number | null
          updated_at?: string | null
        }
        Update: {
          conditions_usage?: string | null
          created_at?: string | null
          date_ajout?: string | null
          date_derniere_maj?: string | null
          description_specifique?: string | null
          equipment_id?: number
          est_disponible?: boolean | null
          est_gratuit?: boolean | null
          horaires_disponibilite?: Json | null
          hotel_id?: number
          id?: number
          notes_internes?: string | null
          prix_supplement?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_equipments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_equipments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          adresse: string
          capacite: number | null
          chambres_occupees: number | null
          chambres_total: number | null
          check_in_time: string | null
          check_out_time: string | null
          classement_etoiles: number | null
          code_postal: string
          created_at: string | null
          description: string | null
          directeur: string | null
          email: string | null
          email_directeur: string | null
          gestionnaire: string | null
          id: number
          nom: string
          nombre_etages: number | null
          parking_places: number | null
          siret: string | null
          site_web: string | null
          statut: string | null
          surface_totale: number | null
          taux_occupation: number | null
          telephone: string | null
          telephone_directeur: string | null
          tva_intracommunautaire: string | null
          type_etablissement: string | null
          updated_at: string | null
          user_owner_id: string
          ville: string
        }
        Insert: {
          adresse: string
          capacite?: number | null
          chambres_occupees?: number | null
          chambres_total?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          classement_etoiles?: number | null
          code_postal: string
          created_at?: string | null
          description?: string | null
          directeur?: string | null
          email?: string | null
          email_directeur?: string | null
          gestionnaire?: string | null
          id?: number
          nom: string
          nombre_etages?: number | null
          parking_places?: number | null
          siret?: string | null
          site_web?: string | null
          statut?: string | null
          surface_totale?: number | null
          taux_occupation?: number | null
          telephone?: string | null
          telephone_directeur?: string | null
          tva_intracommunautaire?: string | null
          type_etablissement?: string | null
          updated_at?: string | null
          user_owner_id: string
          ville: string
        }
        Update: {
          adresse?: string
          capacite?: number | null
          chambres_occupees?: number | null
          chambres_total?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          classement_etoiles?: number | null
          code_postal?: string
          created_at?: string | null
          description?: string | null
          directeur?: string | null
          email?: string | null
          email_directeur?: string | null
          gestionnaire?: string | null
          id?: number
          nom?: string
          nombre_etages?: number | null
          parking_places?: number | null
          siret?: string | null
          site_web?: string | null
          statut?: string | null
          surface_totale?: number | null
          taux_occupation?: number | null
          telephone?: string | null
          telephone_directeur?: string | null
          tva_intracommunautaire?: string | null
          type_etablissement?: string | null
          updated_at?: string | null
          user_owner_id?: string
          ville?: string
        }
        Relationships: []
      }
      room_categories: {
        Row: {
          amenities: Json | null
          base_price: number
          created_at: string | null
          description: string | null
          display_order: number | null
          hotel_id: number
          id: number
          images: Json | null
          is_active: boolean | null
          max_occupancy: number
          name: string
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          base_price: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hotel_id: number
          id?: number
          images?: Json | null
          is_active?: boolean | null
          max_occupancy?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hotel_id?: number
          id?: number
          images?: Json | null
          is_active?: boolean | null
          max_occupancy?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_categories_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      room_equipments: {
        Row: {
          created_at: string | null
          date_derniere_verification: string | null
          date_installation: string | null
          equipment_id: number
          est_disponible: boolean | null
          est_fonctionnel: boolean | null
          id: number
          notes: string | null
          room_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_derniere_verification?: string | null
          date_installation?: string | null
          equipment_id: number
          est_disponible?: boolean | null
          est_fonctionnel?: boolean | null
          id?: number
          notes?: string | null
          room_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_derniere_verification?: string | null
          date_installation?: string | null
          equipment_id?: number
          est_disponible?: boolean | null
          est_fonctionnel?: boolean | null
          id?: number
          notes?: string | null
          room_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_equipments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_equipments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_details_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_equipments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json | null
          bed_type: string | null
          category_id: number | null
          created_at: string | null
          description: string | null
          floor: number | null
          hotel_id: number
          id: number
          images: Json | null
          is_smoking: boolean | null
          last_cleaned: string | null
          notes: string | null
          numero: string
          prix: number
          room_size: number | null
          statut: string | null
          type: string
          updated_at: string | null
          view_type: string | null
        }
        Insert: {
          amenities?: Json | null
          bed_type?: string | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          floor?: number | null
          hotel_id: number
          id?: number
          images?: Json | null
          is_smoking?: boolean | null
          last_cleaned?: string | null
          notes?: string | null
          numero: string
          prix: number
          room_size?: number | null
          statut?: string | null
          type: string
          updated_at?: string | null
          view_type?: string | null
        }
        Update: {
          amenities?: Json | null
          bed_type?: string | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          floor?: number | null
          hotel_id?: number
          id?: number
          images?: Json | null
          is_smoking?: boolean | null
          last_cleaned?: string | null
          notes?: string | null
          numero?: string
          prix?: number
          room_size?: number | null
          statut?: string | null
          type?: string
          updated_at?: string | null
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      room_details_view: {
        Row: {
          amenities: Json | null
          bed_type: string | null
          category_base_price: number | null
          category_id: number | null
          category_name: string | null
          created_at: string | null
          description: string | null
          equipment_count: number | null
          floor: number | null
          hotel_adresse: string | null
          hotel_id: number | null
          hotel_nom: string | null
          hotel_ville: string | null
          id: number | null
          images: Json | null
          is_smoking: boolean | null
          last_cleaned: string | null
          notes: string | null
          numero: string | null
          prix: number | null
          room_size: number | null
          statut: string | null
          type: string | null
          updated_at: string | null
          view_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_hotel_occupancy: {
        Args: { hotel_id_param: number }
        Returns: number
      }
      get_room_all_equipment: {
        Args: { room_id_param: number }
        Returns: {
          categorie: string
          description: string
          equipment_id: number
          est_disponible: boolean
          icone: string
          nom: string
          source: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

