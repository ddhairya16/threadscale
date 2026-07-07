import { createAdminClient } from '@/lib/supabase/server'

export interface AuditLogParams {
  /** ID of the user performing the action. null = system action */
  actorId: string | null
  /** Role snapshot at time of action */
  actorRole?: string | null
  /** Action identifier, e.g. 'assignment.approve', 'rate.update' */
  action: string
  /** Type of the target resource, e.g. 'assignment', 'user', 'payment' */
  targetType?: string
  /** ID of the target resource */
  targetId?: string
  /** State of the record before the change */
  beforeState?: Record<string, unknown>
  /** State of the record after the change */
  afterState?: Record<string, unknown>
  /** Client IP address */
  ipAddress?: string
  /** User agent string */
  userAgent?: string
}

/**
 * Inserts an append-only audit log entry.
 *
 * Uses the admin (service role) client to bypass RLS on audit_logs.
 * Never throws — a failed audit log should never break the main flow.
 * Errors are logged to the console for investigation.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      actor_role: params.actorRole ?? null,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      before_state: (params.beforeState ?? null) as unknown as import('@/types/database.types').Json,
      after_state: (params.afterState ?? null) as unknown as import('@/types/database.types').Json,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })

    if (error) {
      console.error('[Audit Log] Insert failed:', error.message)
    }
  } catch (err) {
    console.error('[Audit Log] Unexpected error:', err)
  }
}

/** Extracts IP and User-Agent from a NextRequest for audit logging */
export function getRequestMeta(req: Request): Pick<AuditLogParams, 'ipAddress' | 'userAgent'> {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  }
}
