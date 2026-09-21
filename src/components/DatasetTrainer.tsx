import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  BarChart3,
  Sliders,
  Table,
  RefreshCw,
  FileText
} from 'lucide-react';
import { DatasetPreview, TrainResult, ModelInfo } from '../types';
import { formatScore } from '../utils/formatters';

interface DatasetTrainerProps {
  onModelTrained: (result: TrainResult) => void;
  onNavigateToPredict: () => void;
  currentModel: ModelInfo | null;
}

const ALGORITHMS = [
  { id: 'random_forest', name: 'Random Forest Classifier', desc: 'Ensemble of decision trees. High accuracy and resilient to overfitting.' },
  { id: 'logistic_regression', name: 'Logistic Regression', desc: 'Linear classification with calibrated probabilities.' },
  { id: 'decision_tree', name: 'Decision Tree Classifier', desc: 'Direct hierarchical rules and splits based on mark thresholds.' },
  { id: 'svm', name: 'Support Vector Machine (SVM)', desc: 'Maximizes classification margin in multi-dimensional feature space.' },
  { id: 'knn', name: 'K-Nearest Neighbors (KNN)', desc: 'Classifies based on proximity to nearest historical student profiles.' },
  { id: 'naive_bayes', name: 'Gaussian Naive Bayes', desc: 'Fast probabilistic classifier using Bayes theorem.' },
];

export const DatasetTrainer: React.FC<DatasetTrainerProps> = ({
  onModelTrained,
  onNavigateToPredict,
  currentModel,
}) => {
  const [dataMode, setDataMode] = useState<'sample' | 'upload' | 'paste'>('sample');
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsing, setParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [datasetPreview, setDatasetPreview] = useState<DatasetPreview | null>(null);

  // Configuration
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('random_forest');
  const [testSize, setTestSize] = useState<number>(20);

  // Training state
  const [training, setTraining] = useState<boolean>(false);
  const [trainError, setTrainError] = useState<string | null>(null);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);

  // Load sample dataset on initial mount
  useEffect(() => {
    loadSampleDataset();
  }, []);

  const loadSampleDataset = async () => {
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch('/api/dataset/sample');
      if (!res.ok) throw new Error('Failed to load sample student dataset');
      const data = await res.json();
      setCsvText(data.csv);
      setFileName('default_student_performance_dataset.csv');
      
      // Parse dataset
      await parseCsvString(data.csv);
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const parseCsvString = async (csvData: string) => {
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch('/api/dataset/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_data: csvData }),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Failed to parse dataset');
      }

      setDatasetPreview(data);
      setSelectedFeatures(data.suggested_features || []);
      setTargetColumn(data.suggested_target || data.categorical_columns[0] || '');
    } catch (err: any) {
      setParseError(err.message);
      setDatasetPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      await parseCsvString(text);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = async () => {
    if (!csvText.trim()) {
      setParseError('Please enter valid CSV formatted data.');
      return;
    }
    setFileName('pasted_dataset.csv');
    await parseCsvString(csvText);
  };

  const toggleFeature = (col: string) => {
    if (selectedFeatures.includes(col)) {
      if (selectedFeatures.length <= 1) return; // keep at least 1
      setSelectedFeatures(selectedFeatures.filter(f => f !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  const handleTrain = async () => {
    if (!datasetPreview) return;
    if (selectedFeatures.length === 0) {
      setTrainError('Please select at least one numeric feature column.');
      return;
    }
    if (!targetColumn) {
      setTrainError('Please select a target classification category column.');
      return;
    }

    setTraining(true);
    setTrainError(null);
    try {
      const res = await fetch('/api/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv_data: csvText,
          features: selectedFeatures,
          target_column: targetColumn,
          algorithm: selectedAlgorithm,
          test_size: testSize / 100,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Training failed');
      }

      setTrainResult(data);
      onModelTrained(data);
    } catch (err: any) {
      setTrainError(err.message);
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Dataset Source Selection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">1</span>
              Provide Student Dataset for Training
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Use the built-in realistic student performance dataset or upload/paste your own custom mark records
            </p>
          </div>

          {/* Dataset Source Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto text-xs font-medium">
            <button
              type="button"
              id="source-sample"
              onClick={() => {
                setDataMode('sample');
                loadSampleDataset();
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dataMode === 'sample'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Default Dataset (360 Students)
            </button>
            <button
              type="button"
              id="source-upload"
              onClick={() => setDataMode('upload')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dataMode === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload Custom CSV
            </button>
            <button
              type="button"
              id="source-paste"
              onClick={() => setDataMode('paste')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dataMode === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste CSV Text
            </button>
          </div>
        </div>

        {/* Dynamic Source Inputs */}
        <div className="pt-4">
          {dataMode === 'sample' && (
            <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Standard Student Performance Dataset</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Features: Math, Science, English, History, Computer Science, Study Hours, Attendance Rate • Target: <span className="font-semibold text-indigo-700">Excellent, Good, Poor</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-refresh-sample"
                onClick={loadSampleDataset}
                disabled={parsing}
                className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${parsing ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>
            </div>
          )}

          {dataMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800">
                Upload your custom student marks dataset
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Supports CSV format with numeric marks columns and category column (e.g. Excellent, Good, Poor)
              </p>
              <label
                htmlFor="file-upload-input"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Select CSV File</span>
              </label>
              <input
                id="file-upload-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {fileName && (
                <div className="mt-3 text-xs text-indigo-700 font-medium">
                  Selected: <span className="font-bold">{fileName}</span>
                </div>
              )}
            </div>
          )}

          {dataMode === 'paste' && (
            <div className="space-y-3">
              <label htmlFor="csv-paste-textarea" className="block text-xs font-medium text-slate-700">
                Paste CSV formatted student marks and performance labels:
              </label>
              <textarea
                id="csv-paste-textarea"
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Math,Science,English,Computer_Science,Performance_Category&#10;88,92,85,90,Excellent&#10;72,68,74,70,Good&#10;42,38,45,40,Poor"
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              />
              <button
                type="button"
                id="btn-parse-pasted"
                onClick={handlePasteSubmit}
                disabled={parsing || !csvText.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-xs"
              >
                {parsing ? 'Parsing CSV...' : 'Parse & Preview Dataset'}
              </button>
            </div>
          )}

          {parseError && (
            <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Dataset Summary & Data Preview */}
        {datasetPreview && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Dataset Inspection ({datasetPreview.total_rows} Records)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {datasetPreview.numeric_columns.length} Numeric Features
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {datasetPreview.categorical_columns.length} Categorical Columns
                </span>
              </div>
            </div>

            {/* Preview table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-52 overflow-y-auto text-xs bg-white">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {datasetPreview.columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-semibold text-slate-700 tracking-wider whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          <span>{col}</span>
                          {selectedFeatures.includes(col) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Selected Feature"></span>
                          )}
                          {targetColumn === col && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Target Column"></span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datasetPreview.preview_rows.slice(0, 7).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      {datasetPreview.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                          {col === targetColumn ? (
                            <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {String(row[col])}
                            </span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Feature Mapping & Supervised Algorithm Configuration */}
      {datasetPreview && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">2</span>
            Configure Supervised Learning Classification
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
            {/* Column 1: Feature Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Student Features ({selectedFeatures.length})</span>
                </label>
                <span className="text-[11px] text-slate-400">Numeric marks / inputs</span>
              </div>
              <p className="text-xs text-slate-500">
                Select the mark columns fed into the supervised model:
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                {datasetPreview.numeric_columns.map((col) => {
                  const isChecked = selectedFeatures.includes(col);
                  return (
                    <label
                      key={col}
                      className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-medium' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{col}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature(col)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Target Classification Category */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="target-column-select" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target Class Label</span>
                </label>
                <span className="text-[11px] text-slate-400">Predicted grade</span>
              </div>
              <p className="text-xs text-slate-500">
                Select the column defining classification categories:
              </p>
              <select
                id="target-column-select"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {datasetPreview.columns.map((col) => (
                  <option key={col} value={col}>
                    {col} {datasetPreview.categorical_columns.includes(col) ? '(Categorical)' : '(Numeric)'}
                  </option>
                ))}
              </select>

              {/* Class distribution info if available */}
              {targetColumn && datasetPreview.column_stats[targetColumn]?.value_counts && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Class Category Distribution:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(datasetPreview.column_stats[targetColumn].value_counts || {}).map(([cls, count]) => (
                      <span
                        key={cls}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[11px]"
                      >
                        <span className="font-semibold text-indigo-700">{cls}:</span> {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Train/Test Split slider */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span className="font-medium">Train/Test Evaluation Split:</span>
                  <span className="font-bold text-indigo-600">{100 - testSize}% Train / {testSize}% Test</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={5}
                  value={testSize}
                  onChange={(e) => setTestSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Column 3: Supervised Learning Algorithm Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Supervised ML Algorithm</span>
                </label>
                <span className="text-[11px] text-slate-400">scikit-learn</span>
              </div>
              <p className="text-xs text-slate-500">
                Choose the classification algorithm:
              </p>

              <div className="space-y-2">
                {ALGORITHMS.map((algo) => (
                  <label
                    key={algo.id}
                    className={`block p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedAlgorithm === algo.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="ml-algorithm"
                        value={algo.id}
                        checked={selectedAlgorithm === algo.id}
                        onChange={() => setSelectedAlgorithm(algo.id)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-900">{algo.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5 leading-relaxed">
                      {algo.desc}
                    </p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {trainError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{trainError}</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              Pipeline: <span className="font-medium text-slate-700">StandardScaler</span> → <span className="font-medium text-slate-700">{selectedAlgorithm.replace(/_/g, ' ')}</span>
            </div>
            <button
              type="button"
              id="btn-train-model"
              onClick={handleTrain}
              disabled={training || selectedFeatures.length === 0 || !targetColumn}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {training ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Training ML Model in Python...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Train Supervised Model Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Training Results & Model Evaluation Report */}
      {trainResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">✓</span>
                <h3 className="text-base font-bold text-slate-900">
                  Model Trained Successfully!
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {trainResult.accuracy}% Test Accuracy
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: <span className="capitalize font-semibold text-slate-800">{trainResult.algorithm.replace(/_/g, ' ')}</span> • Trained on {trainResult.train_samples} student records • Evaluated on {trainResult.test_samples} unseen test records
              </p>
            </div>

            <button
              type="button"
              id="btn-go-to-predict"
              onClick={onNavigateToPredict}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <span>Test Student Marks in Operation 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Test Accuracy</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{trainResult.accuracy}%</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Holdout validation</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cross-Val Score</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{trainResult.cv_accuracy}%</div>
              <div className="text-[11px] text-indigo-600 font-medium mt-0.5">5-fold Stratified</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Classes Learned</div>
              <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                {trainResult.classes.join(', ')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{trainResult.classes.length} performance tiers</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Mark Features</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{trainResult.features.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Subject metrics</div>
            </div>
          </div>

          {/* Confusion Matrix & Feature Importance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Confusion Matrix */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Confusion Matrix (True vs Predicted)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Rows indicate Actual categories, columns indicate Model Predicted categories:
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full text-center border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-[10px] text-slate-400 font-semibold uppercase">Actual \ Pred</th>
                      {trainResult.confusion_matrix.labels.map((lbl) => (
                        <th key={lbl} className="p-1.5 font-bold text-slate-700 bg-slate-100 rounded-t border-b border-slate-200 text-[11px]">
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trainResult.confusion_matrix.matrix.map((row, rIdx) => {
                      const actualLabel = trainResult.confusion_matrix.labels[rIdx];
                      return (
                        <tr key={actualLabel}>
                          <td className="p-1.5 font-bold text-slate-700 bg-slate-100 text-left text-[11px]">
                            {actualLabel}
                          </td>
                          {row.map((val, cIdx) => {
                            const isDiagonal = rIdx === cIdx;
                            return (
                              <td
                                key={cIdx}
                                className={`p-2 font-mono font-bold text-xs border border-white ${
                                  isDiagonal
                                    ? val > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-400'
                                    : val > 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-50 text-slate-300'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Importance Ranking */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Feature Importance Weights</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Relative influence of each student mark on performance classification:
              </p>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {trainResult.feature_importances.map((item, idx) => {
                  const pct = Math.round(item.importance * 100);
                  return (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          {idx + 1}. {item.feature.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono font-bold text-indigo-600">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Classification Report per Class Tier */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Performance Breakdown per Class Category (Precision, Recall, F1)
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Class Category</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Precision</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Recall</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">F1-Score</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Test Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainResult.classes.map((cls) => {
                    const metrics = trainResult.classification_report[cls];
                    if (!metrics) return null;
                    return (
                      <tr key={cls} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-900">{cls}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {formatScore(metrics.precision * 100)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {formatScore(metrics.recall * 100)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-700">
                          {formatScore(metrics['f1-score'] * 100)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-500">
                          {metrics.support}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
