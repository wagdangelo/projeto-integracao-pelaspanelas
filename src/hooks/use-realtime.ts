import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * Hook for real-time subscriptions using Supabase Realtime.
 * Adapted to emit PocketBase-like events to maintain compatibility
 * with existing dashboard components.
 */
export function useRealtime(
  collectionName: string,
  callback: (payload: any) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`public:${collectionName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: collectionName,
        },
        (payload) => {
          const actionMap: Record<string, string> = {
            INSERT: 'create',
            UPDATE: 'update',
            DELETE: 'delete',
          }

          const record = payload.eventType === 'DELETE' ? payload.old : payload.new

          // Map to format expected by existing PB-based components:
          // { action: 'create'|'update'|'delete', record: { ... } }
          callbackRef.current({
            action: actionMap[payload.eventType] || payload.eventType.toLowerCase(),
            record: {
              ...record,
              created: record?.created_at,
              updated: record?.updated_at,
            },
            originalPayload: payload,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [collectionName, enabled])
}
