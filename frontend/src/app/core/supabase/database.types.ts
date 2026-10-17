export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    public: {
        Tables: {
            academies: {
                Row: {
                    address: string | null;
                    city: string | null;
                    contact_email: string | null;
                    contact_phone: string | null;
                    country_code: string;
                    created_at: string;
                    created_by: string;
                    id: string;
                    logo_file_id: string | null;
                    name: string;
                    slug: string;
                    status: string;
                    timezone: string;
                    updated_at: string;
                };
                Insert: {
                    address?: string | null;
                    city?: string | null;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    country_code?: string;
                    created_at?: string;
                    created_by: string;
                    id?: string;
                    logo_file_id?: string | null;
                    name: string;
                    slug: string;
                    status?: string;
                    timezone?: string;
                    updated_at?: string;
                };
                Update: {
                    address?: string | null;
                    city?: string | null;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    country_code?: string;
                    created_at?: string;
                    created_by?: string;
                    id?: string;
                    logo_file_id?: string | null;
                    name?: string;
                    slug?: string;
                    status?: string;
                    timezone?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'academies_logo_file_fk';
                        columns: ['id', 'logo_file_id'];
                        isOneToOne: false;
                        referencedRelation: 'files';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            academy_members: {
                Row: {
                    academy_id: string;
                    created_at: string;
                    id: string;
                    role: string;
                    status: string;
                    user_id: string;
                };
                Insert: {
                    academy_id: string;
                    created_at?: string;
                    id?: string;
                    role: string;
                    status?: string;
                    user_id: string;
                };
                Update: {
                    academy_id?: string;
                    created_at?: string;
                    id?: string;
                    role?: string;
                    status?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'academy_members_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    }
                ];
            };
            files: {
                Row: {
                    academy_id: string;
                    bucket: string;
                    checksum_sha256: string | null;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    entity_id: string;
                    id: string;
                    mime_type: string;
                    module: string;
                    original_name: string;
                    size_bytes: number;
                    storage_key: string;
                };
                Insert: {
                    academy_id: string;
                    bucket: string;
                    checksum_sha256?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    entity_id: string;
                    id?: string;
                    mime_type: string;
                    module: string;
                    original_name: string;
                    size_bytes: number;
                    storage_key: string;
                };
                Update: {
                    academy_id?: string;
                    bucket?: string;
                    checksum_sha256?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    entity_id?: string;
                    id?: string;
                    mime_type?: string;
                    module?: string;
                    original_name?: string;
                    size_bytes?: number;
                    storage_key?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'files_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    }
                ];
            };
            legal_acceptances: {
                Row: {
                    academy_id: string;
                    accepted_at: string;
                    id: string;
                    ip_address: unknown;
                    legal_document_id: string;
                    user_agent: string | null;
                    user_id: string;
                };
                Insert: {
                    academy_id: string;
                    accepted_at?: string;
                    id?: string;
                    ip_address?: unknown;
                    legal_document_id: string;
                    user_agent?: string | null;
                    user_id: string;
                };
                Update: {
                    academy_id?: string;
                    accepted_at?: string;
                    id?: string;
                    ip_address?: unknown;
                    legal_document_id?: string;
                    user_agent?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'legal_acceptances_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'legal_acceptances_legal_document_id_fkey';
                        columns: ['legal_document_id'];
                        isOneToOne: false;
                        referencedRelation: 'legal_documents';
                        referencedColumns: ['id'];
                    }
                ];
            };
            legal_documents: {
                Row: {
                    id: string;
                    is_current: boolean;
                    published_at: string;
                    type: string;
                    url: string;
                    version: string;
                };
                Insert: {
                    id?: string;
                    is_current?: boolean;
                    published_at: string;
                    type: string;
                    url: string;
                    version: string;
                };
                Update: {
                    id?: string;
                    is_current?: boolean;
                    published_at?: string;
                    type?: string;
                    url?: string;
                    version?: string;
                };
                Relationships: [];
            };
            plans: {
                Row: {
                    code: string;
                    created_at: string;
                    id: string;
                    is_active: boolean;
                    max_members: number | null;
                    max_players: number | null;
                    max_venues: number | null;
                    name: string;
                };
                Insert: {
                    code: string;
                    created_at?: string;
                    id?: string;
                    is_active?: boolean;
                    max_members?: number | null;
                    max_players?: number | null;
                    max_venues?: number | null;
                    name: string;
                };
                Update: {
                    code?: string;
                    created_at?: string;
                    id?: string;
                    is_active?: boolean;
                    max_members?: number | null;
                    max_players?: number | null;
                    max_venues?: number | null;
                    name?: string;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    created_at: string;
                    full_name: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    full_name: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    full_name?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            subscriptions: {
                Row: {
                    academy_id: string;
                    created_at: string;
                    ends_at: string | null;
                    id: string;
                    plan_id: string;
                    provider_ref: string | null;
                    started_at: string;
                    status: string;
                };
                Insert: {
                    academy_id: string;
                    created_at?: string;
                    ends_at?: string | null;
                    id?: string;
                    plan_id: string;
                    provider_ref?: string | null;
                    started_at?: string;
                    status: string;
                };
                Update: {
                    academy_id?: string;
                    created_at?: string;
                    ends_at?: string | null;
                    id?: string;
                    plan_id?: string;
                    provider_ref?: string | null;
                    started_at?: string;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'subscriptions_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'subscriptions_plan_id_fkey';
                        columns: ['plan_id'];
                        isOneToOne: false;
                        referencedRelation: 'plans';
                        referencedColumns: ['id'];
                    }
                ];
            };
            venues: {
                Row: {
                    academy_id: string;
                    address: string | null;
                    city: string | null;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    directions: string | null;
                    id: string;
                    is_active: boolean;
                    is_primary: boolean;
                    name: string;
                    type: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    address?: string | null;
                    city?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    directions?: string | null;
                    id?: string;
                    is_active?: boolean;
                    is_primary?: boolean;
                    name: string;
                    type?: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    address?: string | null;
                    city?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    directions?: string | null;
                    id?: string;
                    is_active?: boolean;
                    is_primary?: boolean;
                    name?: string;
                    type?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'venues_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            current_academy_id: { Args: Record<PropertyKey, never>; Returns: string };
            has_academy_role: { Args: { p_academy_id: string; p_roles: string[] }; Returns: boolean };
            is_academy_member: { Args: { p_academy_id: string }; Returns: boolean };
            set_primary_venue: { Args: { p_venue_id: string }; Returns: undefined };
            slugify: { Args: { p_text: string }; Returns: string };
            storage_object_academy_id: { Args: { p_name: string }; Returns: string };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {}
    },
    public: {
        Enums: {}
    }
} as const;
