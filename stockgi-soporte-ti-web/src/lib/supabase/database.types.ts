export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          name: string
          client_name: string | null
          internal_code: string | null
          status: 'active' | 'inactive'
          starts_at: string | null
          ends_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          client_name?: string | null
          internal_code?: string | null
          status?: 'active' | 'inactive'
          starts_at?: string | null
          ends_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>
      }
      app_users: {
        Row: {
          id: string
          contract_id: string
          document_id: string
          full_name: string
          role: 'usuario' | 'ti_operativo' | 'ti_administrativo'
          password_hash: string
          email: string | null
          phone: string | null
          area: string | null
          position: string | null
          location: string | null
          status: 'active' | 'inactive'
          must_change_password: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          document_id: string
          full_name: string
          role: 'usuario' | 'ti_operativo' | 'ti_administrativo'
          password_hash: string
          email?: string | null
          phone?: string | null
          area?: string | null
          position?: string | null
          location?: string | null
          status?: 'active' | 'inactive'
          must_change_password?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['app_users']['Insert']>
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          contract_id: string
          requester_id: string
          category_id: string
          request_type_id: string
          subject: string
          description: string
          status: 'nuevo' | 'asignado' | 'en_proceso' | 'esperando_informacion' | 'resuelto' | 'cerrado' | 'reabierto' | 'cancelado'
          priority: 'baja' | 'media' | 'alta' | 'critica'
          response_sla_minutes: number
          resolution_sla_minutes: number
          first_response_due_at: string
          resolution_due_at: string
          first_response_at: string | null
          assigned_to_id: string | null
          assigned_at: string | null
          closed_at: string | null
          closed_by_id: string | null
          solution: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Partial<Database['public']['Tables']['tickets']['Row']>, 'id' | 'created_at' | 'updated_at'> & {
          contract_id: string
          requester_id: string
          category_id: string
          request_type_id: string
          subject: string
          description: string
          priority: 'baja' | 'media' | 'alta' | 'critica'
          response_sla_minutes: number
          resolution_sla_minutes: number
          first_response_due_at: string
          resolution_due_at: string
        }
        Update: Partial<Database['public']['Tables']['tickets']['Row']>
      }
      ticket_categories: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      ticket_request_types: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      ticket_comments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      ticket_attachments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      ticket_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      bulk_imports: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      bulk_import_rows: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      ticket_counters: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    }
    Views: Record<string, never>
    Functions: {
      next_ticket_number: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
