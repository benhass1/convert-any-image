/** Shared HTTP contract between the Vercel frontend and the Cloudflare transcript edge API. */
export type TranscriptRequest = {
  videoId: string;
  language?: string;
};

export type TranscriptCue = {
  text: string;
  startMs: number;
  durationMs: number;
};

export type TranscriptResponse = {
  videoId: string;
  language: string;
  cached: boolean;
  cues: TranscriptCue[];
};
