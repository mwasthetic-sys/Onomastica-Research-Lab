
export interface ArchiveSource {
  name: string;
  url: string;
}

export interface ResearchReport {
  name: string;
  geography: string;
  facts: string;
  etymology: string[];
  geographicDistribution: string[];
  socialAnalysis: string[];
  variability: string[];
  archives: ArchiveSource[];
  headerImageUrl?: string;
  etymologyImageUrl?: string;
  geoImageUrl?: string;
  socialImageUrl?: string;
  variabilityImageUrl?: string;
  etymologyAudioUrls?: string[];
  geoAudioUrls?: string[];
  socialAudioUrls?: string[];
  variabilityAudioUrls?: string[];
  etymologyComplete?: boolean;
  geoComplete?: boolean;
  socialComplete?: boolean;
  variabilityComplete?: boolean;
}

export interface ResearchFormData {
  name: string;
  geography?: string;
  facts?: string;
}
