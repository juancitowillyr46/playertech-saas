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
            activities: {
                Row: {
                    academy_id: string;
                    call_at: string | null;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    ends_at: string | null;
                    external_field_id: string | null;
                    id: string;
                    notes: string | null;
                    opponent: string | null;
                    series_id: string | null;
                    starts_at: string;
                    status: string;
                    tournament: string | null;
                    type: string;
                    updated_at: string;
                    venue_id: string | null;
                };
                Insert: {
                    academy_id: string;
                    call_at?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    ends_at?: string | null;
                    external_field_id?: string | null;
                    id?: string;
                    notes?: string | null;
                    opponent?: string | null;
                    series_id?: string | null;
                    starts_at: string;
                    status?: string;
                    tournament?: string | null;
                    type: string;
                    updated_at?: string;
                    venue_id?: string | null;
                };
                Update: {
                    academy_id?: string;
                    call_at?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    ends_at?: string | null;
                    external_field_id?: string | null;
                    id?: string;
                    notes?: string | null;
                    opponent?: string | null;
                    series_id?: string | null;
                    starts_at?: string;
                    status?: string;
                    tournament?: string | null;
                    type?: string;
                    updated_at?: string;
                    venue_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'activities_academy_id_external_field_id_fkey';
                        columns: ['academy_id', 'external_field_id'];
                        isOneToOne: false;
                        referencedRelation: 'external_fields';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'activities_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'activities_academy_id_venue_id_fkey';
                        columns: ['academy_id', 'venue_id'];
                        isOneToOne: false;
                        referencedRelation: 'venues';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            call_up_lists: {
                Row: {
                    academy_id: string;
                    call_up_id: string;
                    created_at: string;
                    created_by: string;
                    group_id: string | null;
                    id: string;
                    intro: string | null;
                    position: number;
                    token: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    call_up_id: string;
                    created_at?: string;
                    created_by?: string;
                    group_id?: string | null;
                    id?: string;
                    intro?: string | null;
                    position: number;
                    token?: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    call_up_id?: string;
                    created_at?: string;
                    created_by?: string;
                    group_id?: string | null;
                    id?: string;
                    intro?: string | null;
                    position?: number;
                    token?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'call_up_lists_academy_id_call_up_id_fkey';
                        columns: ['academy_id', 'call_up_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_ups';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_lists_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'call_up_lists_academy_id_group_id_fkey';
                        columns: ['academy_id', 'group_id'];
                        isOneToOne: false;
                        referencedRelation: 'groups';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            call_up_players: {
                Row: {
                    academy_id: string;
                    call_up_id: string;
                    created_at: string;
                    created_by: string;
                    list_id: string;
                    player_id: string;
                };
                Insert: {
                    academy_id: string;
                    call_up_id: string;
                    created_at?: string;
                    created_by?: string;
                    list_id: string;
                    player_id: string;
                };
                Update: {
                    academy_id?: string;
                    call_up_id?: string;
                    created_at?: string;
                    created_by?: string;
                    list_id?: string;
                    player_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'call_up_players_academy_id_call_up_id_fkey';
                        columns: ['academy_id', 'call_up_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_ups';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_list_id_fkey';
                        columns: ['academy_id', 'list_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_up_lists';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_player_id_fkey';
                        columns: ['academy_id', 'player_id'];
                        isOneToOne: false;
                        referencedRelation: 'players';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            call_up_responses: {
                Row: {
                    academy_id: string;
                    answer: string;
                    call_up_id: string;
                    created_at: string;
                    created_by: string | null;
                    device_id: string | null;
                    guardian_link_id: string | null;
                    id: string;
                    player_id: string;
                    reason: string | null;
                    reason_text: string | null;
                    source: string;
                };
                Insert: {
                    academy_id: string;
                    answer: string;
                    call_up_id: string;
                    created_at?: string;
                    created_by?: string | null;
                    device_id?: string | null;
                    guardian_link_id?: string | null;
                    id?: string;
                    player_id: string;
                    reason?: string | null;
                    reason_text?: string | null;
                    source: string;
                };
                Update: {
                    academy_id?: string;
                    answer?: string;
                    call_up_id?: string;
                    created_at?: string;
                    created_by?: string | null;
                    device_id?: string | null;
                    guardian_link_id?: string | null;
                    id?: string;
                    player_id?: string;
                    reason?: string | null;
                    reason_text?: string | null;
                    source?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'call_up_responses_academy_id_call_up_id_fkey';
                        columns: ['academy_id', 'call_up_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_ups';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_responses_academy_id_device_id_fkey';
                        columns: ['academy_id', 'device_id'];
                        isOneToOne: false;
                        referencedRelation: 'guardian_devices';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_responses_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'call_up_responses_academy_id_guardian_link_id_fkey';
                        columns: ['academy_id', 'guardian_link_id'];
                        isOneToOne: false;
                        referencedRelation: 'guardian_links';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_responses_academy_id_player_id_fkey';
                        columns: ['academy_id', 'player_id'];
                        isOneToOne: false;
                        referencedRelation: 'players';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            call_ups: {
                Row: {
                    academy_id: string;
                    activity_id: string;
                    closed_at: string | null;
                    created_at: string;
                    created_by: string;
                    deadline: string | null;
                    deleted_at: string | null;
                    id: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    activity_id: string;
                    closed_at?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deadline?: string | null;
                    deleted_at?: string | null;
                    id?: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    activity_id?: string;
                    closed_at?: string | null;
                    created_at?: string;
                    created_by?: string;
                    deadline?: string | null;
                    deleted_at?: string | null;
                    id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'call_ups_academy_id_activity_id_fkey';
                        columns: ['academy_id', 'activity_id'];
                        isOneToOne: false;
                        referencedRelation: 'activities';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_ups_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    }
                ];
            };
            external_fields: {
                Row: {
                    academy_id: string;
                    address: string | null;
                    city: string | null;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    directions: string | null;
                    id: string;
                    name: string;
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
                    name: string;
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
                    name?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'external_fields_academy_id_fkey';
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
            group_members: {
                Row: {
                    academy_id: string;
                    created_at: string;
                    created_by: string;
                    group_id: string;
                    player_id: string;
                };
                Insert: {
                    academy_id: string;
                    created_at?: string;
                    created_by?: string;
                    group_id: string;
                    player_id: string;
                };
                Update: {
                    academy_id?: string;
                    created_at?: string;
                    created_by?: string;
                    group_id?: string;
                    player_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'group_members_academy_id_group_id_fkey';
                        columns: ['academy_id', 'group_id'];
                        isOneToOne: false;
                        referencedRelation: 'groups';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'group_members_academy_id_player_id_fkey';
                        columns: ['academy_id', 'player_id'];
                        isOneToOne: false;
                        referencedRelation: 'players';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            groups: {
                Row: {
                    academy_id: string;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    id: string;
                    name: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    id?: string;
                    name: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    id?: string;
                    name?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'groups_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    }
                ];
            };
            guardian_devices: {
                Row: {
                    academy_id: string;
                    created_at: string;
                    declared_name: string | null;
                    declared_relationship: string;
                    guardian_id: string;
                    id: string;
                    last_seen_at: string | null;
                    secret_hash: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    created_at?: string;
                    declared_name?: string | null;
                    declared_relationship: string;
                    guardian_id: string;
                    id?: string;
                    last_seen_at?: string | null;
                    secret_hash: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    created_at?: string;
                    declared_name?: string | null;
                    declared_relationship?: string;
                    guardian_id?: string;
                    id?: string;
                    last_seen_at?: string | null;
                    secret_hash?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'guardian_devices_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'guardian_devices_academy_id_guardian_id_fkey';
                        columns: ['academy_id', 'guardian_id'];
                        isOneToOne: false;
                        referencedRelation: 'guardians';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            guardian_links: {
                Row: {
                    academy_id: string;
                    created_at: string;
                    created_by: string | null;
                    deleted_at: string | null;
                    guardian_id: string;
                    id: string;
                    player_id: string;
                    relationship: string;
                    source: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    created_at?: string;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    guardian_id: string;
                    id?: string;
                    player_id: string;
                    relationship: string;
                    source?: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    created_at?: string;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    guardian_id?: string;
                    id?: string;
                    player_id?: string;
                    relationship?: string;
                    source?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'guardian_links_academy_id_guardian_id_fkey';
                        columns: ['academy_id', 'guardian_id'];
                        isOneToOne: false;
                        referencedRelation: 'guardians';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'guardian_links_academy_id_player_id_fkey';
                        columns: ['academy_id', 'player_id'];
                        isOneToOne: false;
                        referencedRelation: 'players';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            guardians: {
                Row: {
                    academy_id: string;
                    consent_at: string;
                    consent_document_id: string;
                    created_at: string;
                    created_by: string | null;
                    deleted_at: string | null;
                    full_name: string;
                    id: string;
                    phone: string;
                    source: string;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    consent_at?: string;
                    consent_document_id: string;
                    created_at?: string;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    full_name: string;
                    id?: string;
                    phone: string;
                    source?: string;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    consent_at?: string;
                    consent_document_id?: string;
                    created_at?: string;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    full_name?: string;
                    id?: string;
                    phone?: string;
                    source?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'guardians_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'guardians_consent_document_id_fkey';
                        columns: ['consent_document_id'];
                        isOneToOne: false;
                        referencedRelation: 'legal_documents';
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
            players: {
                Row: {
                    academy_id: string;
                    birth_date: string;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    first_names: string;
                    id: string;
                    is_active: boolean;
                    last_names: string;
                    nickname: string | null;
                    phone: string | null;
                    updated_at: string;
                };
                Insert: {
                    academy_id: string;
                    birth_date: string;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    first_names: string;
                    id?: string;
                    is_active?: boolean;
                    last_names: string;
                    nickname?: string | null;
                    phone?: string | null;
                    updated_at?: string;
                };
                Update: {
                    academy_id?: string;
                    birth_date?: string;
                    created_at?: string;
                    created_by?: string;
                    deleted_at?: string | null;
                    first_names?: string;
                    id?: string;
                    is_active?: boolean;
                    last_names?: string;
                    nickname?: string | null;
                    phone?: string | null;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'players_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    }
                ];
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
            call_up_current_responses: {
                Row: {
                    academy_id: string | null;
                    answer: string | null;
                    call_up_id: string | null;
                    created_at: string | null;
                    declared_name: string | null;
                    device_id: string | null;
                    device_status: string | null;
                    guardian_id: string | null;
                    guardian_link_id: string | null;
                    guardian_name: string | null;
                    link_status: string | null;
                    list_id: string | null;
                    phone_match: boolean | null;
                    player_id: string | null;
                    reason: string | null;
                    reason_text: string | null;
                    relationship: string | null;
                    source: string | null;
                    unvalidated: boolean | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'call_up_players_academy_id_call_up_id_fkey';
                        columns: ['academy_id', 'call_up_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_ups';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_list_id_fkey';
                        columns: ['academy_id', 'list_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_up_lists';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_player_id_fkey';
                        columns: ['academy_id', 'player_id'];
                        isOneToOne: false;
                        referencedRelation: 'players';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
            call_up_summaries: {
                Row: {
                    academy_id: string | null;
                    activity_id: string | null;
                    call_up_id: string | null;
                    list_id: string | null;
                    maybe: number | null;
                    no: number | null;
                    total: number | null;
                    unanswered: number | null;
                    yes: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'call_up_players_academy_id_call_up_id_fkey';
                        columns: ['academy_id', 'call_up_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_ups';
                        referencedColumns: ['academy_id', 'id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_fkey';
                        columns: ['academy_id'];
                        isOneToOne: false;
                        referencedRelation: 'academies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'call_up_players_academy_id_list_id_fkey';
                        columns: ['academy_id', 'list_id'];
                        isOneToOne: false;
                        referencedRelation: 'call_up_lists';
                        referencedColumns: ['academy_id', 'id'];
                    }
                ];
            };
        };
        Functions: {
            add_player_guardian: {
                Args: { p_consent: boolean; p_full_name: string; p_phone: string; p_player_id: string; p_relationship: string };
                Returns: {
                    guardian_existed: boolean;
                    guardian_id: string;
                    guardian_name: string;
                    link_id: string;
                }[];
            };
            assign_guardians: { Args: { p_assignments: Json; p_player_id: string }; Returns: number };
            call_up_is_open: { Args: { p_call_up_id: string }; Returns: boolean };
            create_call_up: { Args: { p_activity_id: string; p_deadline: string; p_lists: Json }; Returns: string };
            current_academy_id: { Args: Record<PropertyKey, never>; Returns: string };
            current_user_id: { Args: Record<PropertyKey, never>; Returns: string };
            find_player_by_identity: {
                Args: { p_birth_date: string; p_first_names: string; p_last_names: string };
                Returns: {
                    academy_id: string;
                    birth_date: string;
                    created_at: string;
                    created_by: string;
                    deleted_at: string | null;
                    first_names: string;
                    id: string;
                    is_active: boolean;
                    last_names: string;
                    nickname: string | null;
                    phone: string | null;
                    updated_at: string;
                }[];
                SetofOptions: {
                    from: '*';
                    to: 'players';
                    isOneToOne: false;
                    isSetofReturn: true;
                };
            };
            guardian_responses_count: { Args: { p_call_up_id: string; p_player_id: string }; Returns: number };
            has_academy_role: { Args: { p_academy_id: string; p_roles: string[] }; Returns: boolean };
            is_academy_member: { Args: { p_academy_id: string }; Returns: boolean };
            normalize_name: { Args: { p_text: string }; Returns: string };
            player_short_name: { Args: { p_first_names: string; p_last_names: string }; Returns: string };
            public_call_up: { Args: { p_device_keys: string[]; p_token: string }; Returns: Json };
            public_device: {
                Args: { p_academy_id: string; p_keys: string[] };
                Returns: {
                    academy_id: string;
                    created_at: string;
                    declared_name: string | null;
                    declared_relationship: string;
                    guardian_id: string;
                    id: string;
                    last_seen_at: string | null;
                    secret_hash: string;
                    status: string;
                    updated_at: string;
                };
                SetofOptions: {
                    from: '*';
                    to: 'guardian_devices';
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            };
            public_identify: { Args: { p_consent: boolean; p_device_key: string; p_full_name: string; p_phone: string; p_player_id: string; p_relationship: string; p_token: string }; Returns: string };
            public_open_list: {
                Args: { p_player_id: string; p_token: string };
                Returns: {
                    academy_id: string;
                    call_up_id: string;
                    created_at: string;
                    created_by: string;
                    group_id: string | null;
                    id: string;
                    intro: string | null;
                    position: number;
                    token: string;
                    updated_at: string;
                };
                SetofOptions: {
                    from: '*';
                    to: 'call_up_lists';
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            };
            public_respond: { Args: { p_answer: string; p_device_key: string; p_player_id: string; p_reason: string; p_reason_text: string; p_token: string }; Returns: Json };
            review_guardian: { Args: { p_decision: string; p_device_id: string; p_link_id: string }; Returns: undefined };
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
