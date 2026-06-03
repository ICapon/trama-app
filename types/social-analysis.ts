export interface FreqItem {
  tag?: string
  domain?: string
  handle?: string
  freq: number
}

export interface CooccurrenceItem {
  tagA: string
  tagB: string
  coFreq: number
}

export interface SocialAnalysis {
  postMetrics: {
    totalPosts: number
    avgLikes: number
    avgRetweets: number
    avgReplies: number
    avgEngagement: number
  }
  contentBreakdown: {
    originalCount: number
    retweetedCount: number
    quotedCount: number
    repliedCount: number
  }
  engagementRate: number | null
  amplificationRatio: number
  topHashtags: { tag: string; freq: number }[]
  hashtagCooccurrence: CooccurrenceItem[]
  topDomains: { domain: string; freq: number }[]
  topMentions: { handle: string; freq: number }[]
  topReplies: { handle: string; freq: number }[]
  topRetweets: { handle: string; freq: number }[]
  networkInGraph: { followersInGraph: number; followingInGraph: number }
  authenticityScore: number
  riskFlags: string[]
  estimatedTimezone: string | null
}
