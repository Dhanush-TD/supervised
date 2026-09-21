export interface ColumnStat {
  type: 'numeric' | 'categorical';
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  missing: number;
  unique_values?: string[];
  value_counts?: Record<string, number>;
}

export interface DatasetPreview {
  total_rows: number;
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  suggested_features: string[];
  suggested_target: string | null;
  column_stats: Record<string, ColumnStat>;
  preview_rows: Record<string, any>[];
}

export interface FeatureMeta {
  min: number;
  max: number;
  mean: number;
  median: number;
  std?: number;
}

export interface ModelInfo {
  status: string;
  is_trained: boolean;
  algorithm?: string;
  features?: string[];
  target_column?: string;
  classes?: string[];
  metrics?: {
    accuracy: number;
    cv_score?: number;
    test_samples?: number;
    train_samples?: number;
  };
  feature_meta?: Record<string, FeatureMeta>;
  class_centroids?: Record<string, Record<string, number>>;
  default_features?: string[];
  default_target?: string;
  default_classes?: string[];
  total_default_samples?: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  'f1-score': number;
  support: number;
}

export interface TrainResult {
  status: string;
  message: string;
  algorithm: string;
  accuracy: number;
  cv_accuracy: number;
  classes: string[];
  features: string[];
  target_column: string;
  confusion_matrix: ConfusionMatrix;
  classification_report: Record<string, ClassMetrics | any>;
  feature_importances: FeatureImportance[];
  feature_meta: Record<string, FeatureMeta>;
  class_centroids: Record<string, Record<string, number>>;
  total_samples: number;
  train_samples: number;
  test_samples: number;
}

export interface SubjectAnalysisItem {
  subject: string;
  score: number;
  cohort_mean: number;
  class_typical: number;
  difference: number;
  assessment: 'Above Average' | 'Below Average' | 'Average';
}

export interface PredictionResult {
  status: string;
  predicted_category: string;
  confidence: number;
  probabilities: Record<string, number>;
  marks_evaluated: Record<string, number>;
  subject_analysis: SubjectAnalysisItem[];
  recommendation: string;
  model_algorithm: string;
  model_accuracy: number;
}

export interface BatchPredictionItem {
  input: Record<string, any>;
  predicted_category: string;
  probabilities: Record<string, number>;
}
