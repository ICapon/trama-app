export type TramaNodeCategory =
  | 'identity'
  | 'organization'
  | 'digitalInfrastructure'
  | 'socialContent'
  | 'location'
  | 'legalBusiness'
  | 'assets'
  | 'evidenceSources'
  | 'investigation'
  | 'aiAnalysis'

export const TRAMA_NODE_CATEGORIES = {
  identity:              ['Person', 'Alias', 'Username', 'Email', 'PhoneNumber', 'SocialProfile', 'IdentityDocument', 'Address'],
  organization:          ['Organization', 'Company', 'GovernmentEntity', 'School', 'NGO', 'PoliticalParty', 'CriminalGroup', 'BusinessUnit'],
  digitalInfrastructure: ['Domain', 'Subdomain', 'URL', 'Website', 'IPAddress', 'IPRange', 'ASN', 'DNSRecord', 'NameServer', 'MXRecord', 'SSLCertificate', 'HostingProvider', 'CloudProvider', 'Technology', 'OpenPort', 'Service'],
  socialContent:         ['Post', 'Comment', 'Reaction', 'Hashtag', 'Mention', 'Media', 'Image', 'Video', 'Document', 'Link', 'Channel', 'Group', 'Page'],
  location:              ['Location', 'Country', 'State', 'City', 'Municipality', 'Neighborhood', 'Street', 'GeoPoint', 'Place'],
  legalBusiness:         ['RFC', 'CURP', 'LegalRepresentative', 'Shareholder', 'CompanyRegistration', 'PublicRegistryRecord', 'TaxStatus', 'Invoice', 'Contract', 'Lawsuit', 'CourtCase', 'Sanction', 'License', 'Permit'],
  assets:                ['Vehicle', 'LicensePlate', 'VIN', 'Property', 'RealEstate', 'BankAccount', 'WalletAddress', 'CryptoTransaction', 'Asset'],
  evidenceSources:       ['Source', 'Evidence', 'Screenshot', 'File', 'CrawlJob', 'ScrapeResult', 'Dataset', 'Finding', 'ConfidenceScore', 'Tag', 'Note'],
  investigation:         ['Case', 'Investigation', 'Target', 'Hypothesis', 'TimelineEvent', 'Report', 'Task', 'Alert', 'Watchlist'],
  aiAnalysis:            ['AIInsight', 'AIExtraction', 'EntityMention', 'RelationshipSuggestion', 'Summary', 'RiskSignal'],
} as const satisfies Record<TramaNodeCategory, readonly string[]>

export type TramaNodeType = typeof TRAMA_NODE_CATEGORIES[TramaNodeCategory][number]

export interface GraphNodeResponse {
  id: string
  type: TramaNodeType
  category: TramaNodeCategory
  label: string
  properties: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface GraphEdgeResponse {
  id: string
  source: string
  target: string
  type: string
  label?: string
  properties?: Record<string, unknown>
}

export interface NeighborResult {
  neighbor: GraphNodeResponse
  edge: GraphEdgeResponse | null
}
