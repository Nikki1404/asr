export interface BenchmarkResult {
  model: string;
  wer: number; // Word Error Rate
  dataset: string;
}

export interface ModelPerformanceData {
  model: string;
  avgWer: number;
}

export interface BlogPostType {
  id: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
  benchmarkData?: BenchmarkResult[];
  modelPerformanceData?: ModelPerformanceData[];
}

export interface TrendDataPoint {
  name: string; // e.g., 'Q1 2023'
  'Model Alpha': number;
  'Model Beta': number;
  'Model Gamma': number;
}

export interface DashboardDataRow {
  'Audio File Name': string;
  'Audio Length': number;
  'Model': string;
  'Ground_truth': string;
  'Transcription': string;
  'WER Score': number;
  'Inference time (in sec)': number;
}

export interface TranscriptionError {
  type: 'Substitution' | 'Deletion' | 'Insertion';
  ground_truth_segment: string;
  transcription_segment: string;
}

export interface AnalysisResult {
  summary: string;
  errors: TranscriptionError[];
}

export interface HeadToHeadAnalysis {
  winner: string;
  summary: string;
  accuracyAnalysis: string;
  speedAnalysis: string;
  tradeOffs: string;
}