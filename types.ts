
export interface ArchiveSource {
  name: string;
  url: string;
}

export interface ResearchReport {
  name: string;
  geography: string;
  facts: string;
  etymology: string;
  geographicDistribution: string;
  socialAnalysis: string;
  variability: string;
  archives: ArchiveSource[];
  headerImageUrl?: string;
  etymologyImageUrl?: string;
  geoImageUrl?: string;
  socialImageUrl?: string;
  variabilityImageUrl?: string;
  etymologyAudioUrl?: string;
  geoAudioUrl?: string;
  socialAudioUrl?: string;
  variabilityAudioUrl?: string;
}

export interface ResearchFormData {
  name: string;
  geography?: string;
  facts?: string;
}
