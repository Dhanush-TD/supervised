import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  Download,
  Lightbulb,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModelInfo, PredictionResult, BatchPredictionItem } from '../types';
import { getCategoryStyle, formatScore, exportToCSV } from '../utils/formatters';

interface MarksPredictorProps {
  modelInfo: ModelInfo | null;
  onNavigateToTrain: () => void;
}

export const MarksPredictor: React.FC<MarksPredictorProps> = ({
  modelInfo,
  onNavigateToTrain,
}) => {
  const isTrained = modelInfo?.is_trained;
  const features = modelInfo?.features || [];
  const featureMeta = modelInfo?.feature_meta || {};
  const classes = modelInfo?.classes || ['Excellent', 'Good', 'Poor'];

  // Input marks state
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [studentName, setStudentName] = useState<string>('Alex Johnson');
  const [predicting, setPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Batch mode state
  const [predictionMode, setPredictionMode] = useState<'single' | 'batch'>('single');
  const [batchText, setBatchText] = useState<string>('');
  const [batchResults, setBatchResults] = useState<BatchPredictionItem[] | null>(null);
  const [batchPredicting, setBatchPredicting] = useState<boolean>(false);

  // Initialize marks with medians or typical values when model info arrives
  useEffect(() => {
    if (features.length > 0) {
      const initialMarks: Record<string, number> = {};
      features.forEach((feat) => {
        const meta = featureMeta[feat];
        if (meta) {
          initialMarks[feat] = Math.round(meta.median ?? 70);
        } else {
          initialMarks[feat] = 70;
        }
      });
      setMarks(initialMarks);
    }
  }, [features]);

  const handleMarkChange = (feature: string, value: number) => {
    const meta = featureMeta[feature];
    const min = meta?.min ?? 0;
    const max = meta?.max ?? 100;
    const clamped = Math.max(min, Math.min(max, value));
    setMarks((prev) => ({
      ...prev,
      [feature]: clamped,
    }));
  };

  const applyPreset = (type: 'excellent' | 'good' | 'poor' | 'random') => {
    const newMarks: Record<string, number> = {};
    features.forEach((feat) => {
      const lower = feat.toLowerCase();
      const meta = featureMeta[feat];
      const maxVal = meta?.max ?? 100;
      const minVal = meta?.min ?? 0;

      if (type === 'excellent') {
        if (lower.includes('hours')) {
          newMarks[feat] = 24;
        } else if (lower.includes('attendance')) {
          newMarks[feat] = 95;
        } else {
          newMarks[feat] = Math.round(Math.min(maxVal, 88 + Math.random() * 8));
        }
      } else if (type === 'good') {
        if (lower.includes('hours')) {
          newMarks[feat] = 15;
        } else if (lower.includes('attendance')) {
          newMarks[feat] = 82;
        } else {
          newMarks[feat] = Math.round(68 + Math.random() * 7);
        }
      } else if (type === 'poor') {
        if (lower.includes('hours')) {
          newMarks[feat] = 6;
        } else if (lower.includes('attendance')) {
          newMarks[feat] = 60;
        } else {
          newMarks[feat] = Math.round(Math.max(minVal, 38 + Math.random() * 10));
        }
      } else {
        // Random
        newMarks[feat] = Math.round(minVal + Math.random() * (maxVal - minVal));
      }
    });
    setMarks(newMarks);
  };

  const handlePredict = async () => {
    setPredicting(true);
    setPredictError(null);
    try {
      const res = await fetch('/api/model/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks }),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Prediction failed');
      }

      setPredictionResult(data);

      // Trigger celebratory confetti if predicted category is Excellent
      if (data.predicted_category?.toLowerCase().includes('excellent')) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#34D399', '#FBBF24']
        });
      }
    } catch (err: any) {
      setPredictError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  // Populate sample batch
  const populateSampleBatch = () => {
    const headers = ['Student_Name', ...features];
    const row1 = ['Emma Watson', 94, 92, 90, 88, 96, 26, 96];
    const row2 = ['James Potter', 72, 69, 74, 68, 70, 14, 80];
    const row3 = ['Ronald Weasley', 45, 40, 48, 42, 38, 5, 55];
    const row4 = ['Luna Lovegood', 89, 91, 86, 84, 90, 22, 92];
    const row5 = ['Neville Longbottom', 65, 70, 66, 68, 62, 12, 78];

    const lines = [
      headers.join(','),
      row1.slice(0, headers.length).join(','),
      row2.slice(0, headers.length).join(','),
      row3.slice(0, headers.length).join(','),
      row4.slice(0, headers.length).join(','),
      row5.slice(0, headers.length).join(','),
    ];
    setBatchText(lines.join('\n'));
  };

  const handleBatchPredict = async () => {
    if (!batchText.trim()) {
      setPredictError('Please enter student marks in CSV format.');
      return;
    }
    setBatchPredicting(true);
    setPredictError(null);
    try {
      // Parse lines
      const lines = batchText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header line and one student data row.');
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const records = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          const raw = values[idx];
          const num = Number(raw);
          obj[h] = !isNaN(num) && raw !== '' ? num : raw;
        });
        return obj;
      });

      const res = await fetch('/api/model/batch-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Batch prediction failed');
      }

      setBatchResults(data.predictions);
    } catch (err: any) {
      setPredictError(err.message);
    } finally {
      setBatchPredicting(false);
    }
  };

  const downloadBatchCSV = () => {
    if (!batchResults || !batchResults.length) return;
    const exportRows = batchResults.map((item, idx) => {
      return {
        Student_Index: idx + 1,
        ...item.input,
        Predicted_Category: item.predicted_category,
        ...Object.fromEntries(
          Object.entries(item.probabilities || {}).map(([cls, prob]) => [`Prob_${cls}_Pct`, prob])
        ),
      };
    });
    exportToCSV('student_predicted_grades.csv', exportRows);
  };

  if (!isTrained) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          No Supervised Model is Currently Trained
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          To predict student performance categories (Excellent, Good, Poor), you must first train a supervised learning model on student marks data.
        </p>
        <button
          type="button"
          id="btn-nav-to-train"
          onClick={onNavigateToTrain}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs"
        >
          <span>Open Operation 1 to Train Model</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const categoryStyle = predictionResult ? getCategoryStyle(predictionResult.predicted_category) : null;

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">2</span>
            <h2 className="text-base font-bold text-slate-900">
              Student Marks Input & Performance Prediction
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Input student scores to predict the academic performance category using the trained supervised model
          </p>
        </div>

        {/* Single vs Batch Switcher */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            id="mode-single"
            onClick={() => setPredictionMode('single')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              predictionMode === 'single'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Individual Student
          </button>
          <button
            type="button"
            id="mode-batch"
            onClick={() => {
              setPredictionMode('batch');
              if (!batchText) populateSampleBatch();
            }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              predictionMode === 'batch'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batch Students
          </button>
        </div>
      </div>

      {predictError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{predictError}</span>
        </div>
      )}

      {/* SINGLE STUDENT PREDICTION MODE */}
      {predictionMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Marks Input Panel (5 cols) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Student Profile & Marks</h3>
              </div>

              {/* Student Name Input */}
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name"
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Test Profile Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  id="preset-excellent"
                  onClick={() => applyPreset('excellent')}
                  className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Trophy className="w-3 h-3 text-emerald-600" />
                  <span>Excellent</span>
                </button>
                <button
                  type="button"
                  id="preset-good"
                  onClick={() => applyPreset('good')}
                  className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>Good</span>
                </button>
                <button
                  type="button"
                  id="preset-poor"
                  onClick={() => applyPreset('poor')}
                  className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Poor</span>
                </button>
                <button
                  type="button"
                  id="preset-random"
                  onClick={() => applyPreset('random')}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Random</span>
                </button>
              </div>
            </div>

            {/* Subject Marks Input Controls */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {features.map((feat) => {
                const val = marks[feat] ?? 70;
                const meta = featureMeta[feat];
                const min = meta?.min ?? 0;
                const max = meta?.max ?? 100;
                const mean = meta?.mean ?? 60;
                const isStudyHours = feat.toLowerCase().includes('hours');
                const isAttendance = feat.toLowerCase().includes('attendance');

                return (
                  <div key={feat} className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`mark-input-${feat}`} className="text-xs font-bold text-slate-800">
                        {feat.replace(/_/g, ' ')}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          Avg: {mean}
                        </span>
                        <input
                          id={`mark-input-${feat}`}
                          type="number"
                          min={min}
                          max={max}
                          value={val}
                          onChange={(e) => handleMarkChange(feat, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-right font-mono font-bold text-xs rounded border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-slate-500 w-4">
                          {isStudyHours ? 'h' : isAttendance ? '%' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 w-6 font-mono">{min}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={isStudyHours ? 0.5 : 1}
                        value={val}
                        onChange={(e) => handleMarkChange(feat, Number(e.target.value))}
                        className="flex-1 accent-indigo-600 cursor-pointer h-1.5"
                      />
                      <span className="text-[10px] text-slate-400 w-6 text-right font-mono">{max}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Predict Button */}
            <button
              type="button"
              id="btn-predict-category"
              onClick={handlePredict}
              disabled={predicting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {predicting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Marks in Python ML...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Grade Category</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Prediction Output Display (7 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {predictionResult && categoryStyle ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                {/* Result Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Student Assessment
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {studentName || 'Student Performance Output'}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Model: {predictionResult.model_algorithm.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Hero Category Badge */}
                <div
                  className={`p-6 rounded-2xl border ${categoryStyle.border} ${categoryStyle.bg} text-center space-y-2 transition-all`}
                >
                  <div className="inline-flex p-3 rounded-full bg-white shadow-xs">
                    {categoryStyle.iconName === 'trophy' && (
                      <Trophy className="w-8 h-8 text-emerald-600" />
                    )}
                    {categoryStyle.iconName === 'check-circle' && (
                      <CheckCircle2 className="w-8 h-8 text-blue-600" />
                    )}
                    {categoryStyle.iconName === 'alert-circle' && (
                      <AlertTriangle className="w-8 h-8 text-rose-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Predicted Classification
                  </div>
                  <div
                    className={`text-3xl sm:text-4xl font-black tracking-tight ${categoryStyle.text}`}
                  >
                    {predictionResult.predicted_category.toUpperCase()}
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    Model Confidence: <span className="font-bold text-slate-900">{predictionResult.confidence}%</span>
                  </div>
                </div>

                {/* Class Probabilities Distribution */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Probability Distribution Across Classes:
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(predictionResult.probabilities).map(([cls, prob]) => {
                      const isWinning = cls === predictionResult.predicted_category;
                      return (
                        <div
                          key={cls}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isWinning
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="text-[11px] font-semibold truncate">{cls}</div>
                          <div className="text-base font-bold font-mono mt-0.5">{prob}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pedagogical Recommendation */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs">
                  <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900">Academic Guidance & Feedback</div>
                    <div className="text-amber-800/90 mt-0.5 leading-relaxed">
                      {predictionResult.recommendation}
                    </div>
                  </div>
                </div>

                {/* Subject-Wise Analysis Comparison */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Marks Breakdown vs. Cohort Average
                    </span>
                  </div>

                  <div className="space-y-2">
                    {predictionResult.subject_analysis.map((sub) => {
                      const isPositive = sub.difference >= 0;
                      return (
                        <div
                          key={sub.subject}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {sub.subject.replace(/_/g, ' ')}
                            </span>
                            <div className="text-[11px] text-slate-500">
                              Score: <span className="font-semibold text-slate-700">{sub.score}</span> • Cohort Avg: {sub.cohort_mean}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                isPositive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {isPositive ? `+${sub.difference}` : sub.difference}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                sub.assessment === 'Above Average'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.assessment === 'Below Average'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sub.assessment}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Ready to Classify Student Performance
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Adjust the student marks and metrics on the left, or pick one of the quick test presets, then click <strong className="text-slate-800">"Predict Grade Category"</strong>.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('excellent')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                  >
                    Load Sample Excellent Student
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('poor')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                  >
                    Load Sample Poor Student
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BATCH STUDENTS PREDICTION MODE */}
      {predictionMode === 'batch' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Batch Student Predictions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste or edit multiple student records in CSV format to classify an entire class roster at once
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-populate-batch"
                onClick={populateSampleBatch}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                Insert Sample Class Roster
              </button>
              <button
                type="button"
                id="btn-run-batch"
                onClick={handleBatchPredict}
                disabled={batchPredicting || !batchText.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                {batchPredicting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Predict All Students</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              rows={6}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`Student_Name,${features.join(',')}\nAlice,92,88,90,85,94,22,95\nBob,68,70,72,66,74,14,80`}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Batch Results Table */}
          {batchResults && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Classification Results ({batchResults.length} Students Evaluated)
                </span>
                <button
                  type="button"
                  id="btn-export-csv"
                  onClick={downloadBatchCSV}
                  className="px-3 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Classified CSV</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs bg-white">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">#</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Student Name / ID</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Predicted Category</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-700">Class Probabilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchResults.map((item, idx) => {
                      const style = getCategoryStyle(item.predicted_category);
                      const name = item.input.Student_Name || item.input.Student_ID || `Student ${idx + 1}`;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{name}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badge}`}
                            >
                              {item.predicted_category}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-1.5 text-[11px] font-mono">
                              {Object.entries(item.probabilities || {}).map(([cls, prob]) => (
                                <span key={cls} className="text-slate-600">
                                  <span className="font-semibold text-slate-800">{cls}:</span> {prob}%
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
