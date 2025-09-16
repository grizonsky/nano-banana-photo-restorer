export interface ResultItem {
  id: string;
  imageUrl: string;
  mimeType: string;
  prompt: string;
  sourceImageUrl?: string; // The URL of the image used to generate this result
}

export type ComparisonMode = 'side' | 'slider' | 'single';

export type PromptMode = 'retouch' | 'reimagine';

export interface Pan {
  x: number;
  y: number;
}

export interface PresetPrompt {
  id: string;
  prompt: string;
}
