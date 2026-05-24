import type { TramaNodeCategory } from './types'

export const CATEGORY_COLORS: Record<TramaNodeCategory, string> = {
  identity:              '#8b5cf6', // violet  — Person, Email, Phone, Username
  legalBusiness:         '#f59e0b', // amber   — RFC, CURP, TaxStatus
  organization:          '#3b82f6', // blue
  location:              '#22c55e', // green
  assets:                '#10b981', // emerald
  digitalInfrastructure: '#06b6d4', // cyan
  socialContent:         '#ec4899', // pink
  evidenceSources:       '#6b7280', // gray    — ScrapeResult, Source, Evidence
  investigation:         '#f97316', // orange  — Case, Target
  aiAnalysis:            '#a855f7', // purple
}

export const CATEGORY_LABELS: Record<TramaNodeCategory, string> = {
  identity:              'Identity',
  legalBusiness:         'Legal / Business',
  organization:          'Organization',
  location:              'Location',
  assets:                'Assets',
  digitalInfrastructure: 'Digital Infrastructure',
  socialContent:         'Social Content',
  evidenceSources:       'Evidence',
  investigation:         'Investigation',
  aiAnalysis:            'AI Analysis',
}

export const DEFAULT_COLOR = '#71717a'
