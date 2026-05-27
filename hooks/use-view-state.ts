'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Investigation, InvestigationViewState } from '@/types/investigation'
import type { PinnedPosition } from '@/types/view-state'
import { investigationsApi } from '@/lib/api/investigations'

const DEBOUNCE_MS = 1500

export function useViewState(investigation: Investigation | null) {
  const [viewState, setViewState] = useState<InvestigationViewState>(
    investigation?.viewState ?? {},
  )
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(investigation?.id)
  const vsRef = useRef<InvestigationViewState>(investigation?.viewState ?? {})

  useEffect(() => { idRef.current = investigation?.id }, [investigation?.id])

  useEffect(() => {
    if (!investigation?.viewState) return
    vsRef.current = investigation.viewState
    setViewState(investigation.viewState)
  }, [investigation?.id])

  const scheduleSave = useCallback((next: InvestigationViewState) => {
    if (!idRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      investigationsApi.patchViewState(idRef.current!, next).catch(console.error)
    }, DEBOUNCE_MS)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const commit = useCallback((next: InvestigationViewState) => {
    vsRef.current = next
    setViewState(next)
    scheduleSave(next)
  }, [scheduleSave])

  const flushSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (idRef.current) {
      investigationsApi.patchViewState(idRef.current, vsRef.current).catch(console.error)
    }
  }, [])

  const updatePinnedPositions = useCallback(
    (pinnedPositions: Record<string, PinnedPosition>) => {
      commit({ ...vsRef.current, graph: { ...vsRef.current.graph, pinnedPositions } })
    },
    [commit],
  )

  const toggleBookmark = useCallback(
    (nodeId: string) => {
      const set = new Set(vsRef.current.graph?.bookmarkedNodeIds ?? [])
      set.has(nodeId) ? set.delete(nodeId) : set.add(nodeId)
      commit({ ...vsRef.current, graph: { ...vsRef.current.graph, bookmarkedNodeIds: [...set] } })
    },
    [commit],
  )

  const setNote = useCallback(
    (nodeId: string, note: string) => {
      const notes = { ...vsRef.current.notes, [nodeId]: note }
      if (!note.trim()) delete notes[nodeId]
      commit({ ...vsRef.current, notes })
    },
    [commit],
  )

  const updateLayout = useCallback(
    (layout: 'force' | 'radial') => {
      commit({ ...vsRef.current, graph: { ...vsRef.current.graph, layout } })
    },
    [commit],
  )

  const isBookmarked = useCallback(
    (nodeId: string) => viewState.graph?.bookmarkedNodeIds?.includes(nodeId) ?? false,
    [viewState],
  )

  const getNoteForNode = useCallback(
    (nodeId: string) => viewState.notes?.[nodeId] ?? '',
    [viewState],
  )

  return { viewState, updatePinnedPositions, toggleBookmark, setNote, updateLayout, flushSave, isBookmarked, getNoteForNode }
}
