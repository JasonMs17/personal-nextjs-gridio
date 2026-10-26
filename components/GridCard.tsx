'use client'

import { GridItem } from '@/types'
import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { SupabaseProvider } from '@supabase-labs/y-supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import NoteEditor from '@/components/NoteEditor'
import { InfoIcon, TrashIcon } from '@/components/icons'
import {
  CLEAR_ORIGIN,
  SEED_ORIGIN,
  clearNote,
  entryRoom,
  isNoteEmpty,
  readNote,
  seedLegacyNote
} from '@/lib/collab-notes'

interface GridCardProps {
  item: GridItem
  entryDate: string
  onSave: (title: string, content: string) => Promise<void>
  onDelete?: () => Promise<boolean>
}

type LoadState = 'loading' | 'ready' | 'error'
type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
type Connection = 'connecting' | 'connected' | 'disconnected'

const AUTOSAVE_DELAY = 800

export default function GridCard({ item, entryDate, onSave, onDelete }: GridCardProps) {
  const room = entryRoom(item.categoryId, entryDate)
  const [doc] = useState(() => new Y.Doc())
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [connection, setConnection] = useState<Connection>('connecting')

  // Latest props for use inside long-lived Yjs listeners
  const itemRef = useRef(item)
  const onSaveRef = useRef(onSave)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    itemRef.current = item
    onSaveRef.current = onSave
  })

  useEffect(() => {
    const supabase = createClientComponentClient()
    const provider = new SupabaseProvider(room, doc, supabase, {
      persistence: true,
      broadcastThrottleMs: 50
    })
    const persistence = provider.getPersistence()!
    let loadFailed = false

    const save = async () => {
      saveTimerRef.current = null
      const { title, content } = readNote(doc)
      // Don't create empty entries; an existing entry may still be emptied
      if (!title && !content && !itemRef.current.entryId) {
        setSaveState('idle')
        return
      }
      setSaveState('saving')
      try {
        await onSaveRef.current(title, content)
        setSaveState('saved')
      } catch (error) {
        console.error('Autosave failed:', error)
        setSaveState('error')
      }
    }

    const scheduleSave = () => {
      setSaveState('pending')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(save, AUTOSAVE_DELAY)
    }

    // Only local edits are written to `entries`; peers save their own edits
    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || origin === persistence || origin === SEED_ORIGIN || origin === CLEAR_ORIGIN) return
      scheduleSave()
    }

    const handlePersistenceError = (error: Error) => {
      console.error('Yjs persistence error:', error)
      if (!persistence.synced) loadFailed = true
      else setSaveState('error')
    }

    // `synced` also fires after a failed fetch, so failures are tracked separately
    const handleSynced = () => {
      if (loadFailed) {
        setLoadState('error')
        return
      }
      const current = itemRef.current
      if (isNoteEmpty(doc) && current.entryId && (current.title || current.content)) {
        seedLegacyNote(doc, current.title, current.content)
      }
      setLoadState('ready')

      // Repair a stale `entries` row (e.g. a peer closed the tab before its autosave ran)
      const { title, content } = readNote(doc)
      if ((title || content) && (title !== current.title || content !== current.content)) {
        scheduleSave()
      }
    }

    doc.on('update', handleUpdate)
    persistence.on('error', handlePersistenceError)
    persistence.on('synced', handleSynced)
    provider.on('status', setConnection)

    return () => {
      doc.off('update', handleUpdate)
      persistence.off('error', handlePersistenceError)
      persistence.off('synced', handleSynced)
      provider.off('status', setConnection)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        save()
      }
      provider.destroy()
    }
  }, [doc, room])

  const handleDelete = async () => {
    if (!onDelete) return
    const deleted = await onDelete()
    if (!deleted) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    clearNote(doc)
    setSaveState('idle')
  }

  const status =
    loadState === 'loading'
      ? { label: 'Loading', dot: 'bg-slate-300 animate-pulse', text: 'text-slate-400' }
      : loadState === 'error'
        ? { label: 'Sync off', dot: 'bg-amber-400', text: 'text-amber-600' }
        : saveState === 'pending' || saveState === 'saving'
          ? { label: 'Saving…', dot: 'bg-brand-400 animate-pulse', text: 'text-slate-500' }
          : saveState === 'error'
            ? { label: 'Save failed', dot: 'bg-rose-500', text: 'text-rose-600' }
            : connection === 'connected'
              ? { label: saveState === 'saved' ? 'Saved' : 'Live', dot: 'bg-brand-500', text: 'text-brand-600' }
              : { label: connection === 'connecting' ? 'Connecting' : 'Offline', dot: 'bg-slate-300', text: 'text-slate-400' }

  return (
    <div className="card group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-lg hover:shadow-slate-200/60">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-900">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base"
            style={{ backgroundColor: `${item.categoryColor}1f` }}
          >
            {item.categoryIcon}
          </span>
          <span className="truncate">{item.categoryName}</span>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`inline-flex items-center gap-1.5 px-1.5 text-[11px] font-semibold ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="icon-btn-danger h-7 w-7"
              aria-label="Delete note"
            >
              <TrashIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>

      {loadState === 'loading' && (
        <div className="space-y-2.5">
          <div className="h-6 w-1/2 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {loadState === 'error' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            <InfoIcon width={14} height={14} className="mt-0.5 shrink-0" />
            <p>Realtime sync is unavailable. Run the Supabase migration for <code>yjs_documents</code>, then reload.</p>
          </div>
          {(item.title || item.content) && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
              {item.title && <p className="mb-1 text-sm font-semibold text-slate-900">{item.title}</p>}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.content}</p>
            </div>
          )}
        </div>
      )}

      {loadState === 'ready' && <NoteEditor doc={doc} />}
    </div>
  )
}
