import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let adminClient: SupabaseClient<Database> | null = null
let anonServerClient: SupabaseClient<Database> | null = null

function readRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )
  }

  return adminClient
}

export function getSupabaseAnonServer() {
  if (!anonServerClient) {
    anonServerClient = createClient<Database>(
      readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      readRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )
  }

  return anonServerClient
}

export const attachmentsBucket = process.env.ATTACHMENTS_BUCKET || 'ticket-attachments'
export const maxAttachmentMb = Number(process.env.MAX_ATTACHMENT_MB || 10)
export const attachmentRetentionDays = Number(process.env.ATTACHMENT_RETENTION_DAYS || 30)
