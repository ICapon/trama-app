"use client"

import { useEffect, useState } from "react"
import { graphApi } from "@/lib/api/graph"
import type { SocialAnalysis } from "@/types/social-analysis"

// ─── Risk flag labels ─────────────────────────────────────────────────────────

const RISK_FLAG_LABELS: Record<string, string> = {
  high_amplification:       "Alta amplificación (>70% retweets)",
  low_engagement:           "Engagement bajo para el tamaño de audiencia",
  abnormal_follower_ratio:  "Ratio followers/following anormal",
  low_follow_back_rate:     "Muy bajo follow-back rate",
  new_account:              "Cuenta reciente (<30 días)",
  dormant_account:          "Cuenta dormida (vieja, poco activa)",
  narrow_activity_window:   "Ventana de actividad muy estrecha",
  very_high_posting_frequency: "Frecuencia de publicación muy alta (>50/día)",
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  if (total === 0) return 0
  return Math.round((n / total) * 100)
}

function AuthenticityRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-500" :
    score >= 45 ? "text-amber-500"   : "text-red-500"
  const label =
    score >= 70 ? "Alta" :
    score >= 45 ? "Media" : "Baja"
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{score}</div>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{label}</div>
      <div className="text-[10px] text-zinc-400">autenticidad</div>
    </div>
  )
}

function MiniBar({ value, max, color = "bg-sky-500" }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  nodeId: string
}

export function SocialAnalysisPanel({ nodeId }: Props) {
  const [data, setData] = useState<SocialAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    graphApi.getSocialAnalysis(nodeId)
      .then(({ data: d }) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [nodeId])

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" />
    </div>
  )

  if (error) return (
    <p className="text-xs text-red-500 px-4 py-3">{error}</p>
  )

  if (!data) return null

  const { postMetrics: pm, contentBreakdown: cd, engagementRate, amplificationRatio,
    topHashtags, hashtagCooccurrence, topDomains, topMentions, topReplies, topRetweets,
    networkInGraph, authenticityScore, riskFlags, estimatedTimezone } = data

  const totalTyped = cd.originalCount + cd.retweetedCount + cd.quotedCount + cd.repliedCount
  const maxHashFreq = topHashtags[0]?.freq ?? 1
  const maxDomFreq  = topDomains[0]?.freq  ?? 1
  const maxMenFreq  = topMentions[0]?.freq ?? 1

  return (
    <div className="flex flex-col gap-5 px-4 pb-4">

      {/* Score + engagement rate */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-4">
        <AuthenticityRing score={authenticityScore} />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-[10px] text-zinc-400 mb-0.5">Engagement rate</p>
              <p className={`text-sm font-semibold tabular-nums ${
                engagementRate === null ? "text-zinc-400"
                : engagementRate >= 1   ? "text-emerald-600 dark:text-emerald-400"
                : engagementRate >= 0.1 ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
              }`}>
                {engagementRate !== null ? `${engagementRate}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 mb-0.5">Amplificación</p>
              <p className={`text-sm font-semibold tabular-nums ${amplificationRatio > 70 ? "text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                {amplificationRatio}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 mb-0.5">Posts analizados</p>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{pm.totalPosts}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 mb-0.5">TZ estimada</p>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{estimatedTimezone ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <Section title="Señales de riesgo">
          <div className="flex flex-col gap-1.5">
            {riskFlags.map((flag) => (
              <div key={flag} className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 px-2.5 py-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                  {RISK_FLAG_LABELS[flag] ?? flag}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Content breakdown */}
      <Section title="Tipo de contenido">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Original", count: cd.originalCount,  color: "text-sky-600 dark:text-sky-400" },
            { label: "RT",       count: cd.retweetedCount, color: "text-violet-600 dark:text-violet-400" },
            { label: "Quote",    count: cd.quotedCount,    color: "text-teal-600 dark:text-teal-400" },
            { label: "Reply",    count: cd.repliedCount,   color: "text-pink-600 dark:text-pink-400" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex flex-col items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/60 py-2 px-1 gap-0.5">
              <p className={`text-sm font-bold tabular-nums ${color}`}>{pct(count, totalTyped)}%</p>
              <p className="text-[10px] text-zinc-400">{label}</p>
              <p className="text-[10px] text-zinc-500 tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Avg engagement per post */}
      <Section title="Engagement promedio / post">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Likes",   val: pm.avgLikes,    color: "text-pink-500" },
            { label: "RTs",     val: pm.avgRetweets, color: "text-green-500" },
            { label: "Replies", val: pm.avgReplies,  color: "text-sky-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex flex-col items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/60 py-2 px-1">
              <p className={`text-sm font-bold tabular-nums ${color}`}>{val}</p>
              <p className="text-[10px] text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Top hashtags */}
      {topHashtags.length > 0 && (
        <Section title="Top hashtags">
          <div className="flex flex-col gap-1.5">
            {topHashtags.slice(0, 8).map(({ tag, freq }) => (
              <div key={tag} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 w-28 truncate shrink-0">#{tag}</span>
                <MiniBar value={freq} max={maxHashFreq} color="bg-sky-500" />
                <span className="text-[10px] tabular-nums text-zinc-400 w-5 text-right shrink-0">{freq}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Hashtag co-occurrence */}
      {hashtagCooccurrence.length > 0 && (
        <Section title="Narrativas (co-ocurrencia)">
          <div className="flex flex-col gap-1">
            {hashtagCooccurrence.slice(0, 5).map(({ tagA, tagB, coFreq }) => (
              <div key={`${tagA}-${tagB}`} className="flex items-center gap-1.5 text-[11px]">
                <span className="font-mono text-sky-600 dark:text-sky-400">#{tagA}</span>
                <span className="text-zinc-400">+</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">#{tagB}</span>
                <span className="ml-auto text-zinc-400 tabular-nums">{coFreq}×</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Top domains */}
      {topDomains.length > 0 && (
        <Section title="Dominios más compartidos">
          <div className="flex flex-col gap-1.5">
            {topDomains.slice(0, 6).map(({ domain, freq }) => (
              <div key={domain} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 w-28 truncate shrink-0">{domain}</span>
                <MiniBar value={freq} max={maxDomFreq} color="bg-emerald-500" />
                <span className="text-[10px] tabular-nums text-zinc-400 w-5 text-right shrink-0">{freq}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Interaction network */}
      {(topMentions.length > 0 || topReplies.length > 0 || topRetweets.length > 0) && (
        <Section title="Red de interacción">
          {topMentions.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-[10px] text-zinc-400 mb-0.5">Más mencionados</p>
              {topMentions.slice(0, 5).map(({ handle, freq }) => (
                <div key={handle} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 w-28 truncate shrink-0">@{handle}</span>
                  <MiniBar value={freq} max={maxMenFreq} color="bg-violet-500" />
                  <span className="text-[10px] tabular-nums text-zinc-400 w-5 text-right shrink-0">{freq}</span>
                </div>
              ))}
            </div>
          )}
          {topReplies.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-[10px] text-zinc-400 mb-0.5">Más respondidos</p>
              {topReplies.slice(0, 3).map(({ handle, freq }) => (
                <div key={handle} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 w-28 truncate shrink-0">@{handle}</span>
                  <MiniBar value={freq} max={topReplies[0].freq} color="bg-pink-500" />
                  <span className="text-[10px] tabular-nums text-zinc-400 w-5 text-right shrink-0">{freq}</span>
                </div>
              ))}
            </div>
          )}
          {topRetweets.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-zinc-400 mb-0.5">Más retuiteados</p>
              {topRetweets.slice(0, 3).map(({ handle, freq }) => (
                <div key={handle} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 w-28 truncate shrink-0">@{handle}</span>
                  <MiniBar value={freq} max={topRetweets[0].freq} color="bg-teal-500" />
                  <span className="text-[10px] tabular-nums text-zinc-400 w-5 text-right shrink-0">{freq}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Network in graph */}
      <Section title="Red capturada en grafo">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/60 py-2">
            <p className="text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-300">{networkInGraph.followersInGraph}</p>
            <p className="text-[10px] text-zinc-400">Seguidores</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/60 py-2">
            <p className="text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-300">{networkInGraph.followingInGraph}</p>
            <p className="text-[10px] text-zinc-400">Siguiendo</p>
          </div>
        </div>
      </Section>

    </div>
  )
}
