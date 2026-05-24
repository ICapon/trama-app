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

  useEffect(() => {
    idRef.current = investigation?.id
  }, [investigation?.id])

  const scheduleSave = useCallback((next: InvestigationViewState) => {
    if (!idRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      investigationsApi.patchViewState(idRef.current!, next).catch(console.error)
    }, DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const updatePinnedPositions = useCallback(
    (pinnedPositions: Record<string, PinnedPosition>) => {
      setViewState((prev) => {
        console.log('Updating pinned positions:', pinnedPositions)
        const next = { ...prev, graph: { ...prev.graph, pinnedPositions } }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const toggleBookmark = useCallback(
    (nodeId: string) => {
      setViewState((prev) => {
        const set = new Set(prev.graph?.bookmarkedNodeIds ?? [])
        set.has(nodeId) ? set.delete(nodeId) : set.add(nodeId)
        const next = { ...prev, graph: { ...prev.graph, bookmarkedNodeIds: [...set] } }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const setNote = useCallback(
    (nodeId: string, note: string) => {
      setViewState((prev) => {
        const notes = { ...prev.notes, [nodeId]: note }
        if (!note.trim()) delete notes[nodeId]
        const next = { ...prev, notes }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const isBookmarked = useCallback(
    (nodeId: string) => viewState.graph?.bookmarkedNodeIds?.includes(nodeId) ?? false,
    [viewState],
  )

  const getNoteForNode = useCallback(
    (nodeId: string) => viewState.notes?.[nodeId] ?? '',
    [viewState],
  )

  return {
    viewState,
    updatePinnedPositions,
    toggleBookmark,
    setNote,
    isBookmarked,
    getNoteForNode,
  }
}
