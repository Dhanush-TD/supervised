/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DatasetTrainer } from './components/DatasetTrainer';
import { MarksPredictor } from './components/MarksPredictor';
import { ModelInfo, TrainResult } from './types';
import { BookOpen, GraduationCap, CheckCircle, Award } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'train' | 'predict'>('predict');
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);

  // Fetch model info on startup
  const fetchModelInfo = async () => {
    try {
      setLoadingInfo(true);
      const res = await fetch('/api/model/info');
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
        // If not trained yet, default to training tab
        if (!data.is_trained) {
          setActiveTab('train');
        }
      }
    } catch (err) {
      console.error('Failed to load model info', err);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const handleModelTrained = (result: TrainResult) => {
    // Update local model info
    setModelInfo({
      status: 'success',
      is_trained: true,
      algorithm: result.algorithm,
      features: result.features,
      target_column: result.target_column,
      classes: result.classes,
      metrics: {
        accuracy: result.accuracy,
        cv_score: result.cv_accuracy,
        test_samples: result.test_samples,
        train_samples: result.train_samples,
      },
      feature_meta: result.feature_meta,
      class_centroids: result.class_centroids,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & Status Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelInfo={modelInfo}
        loadingInfo={loadingInfo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Supervised Learning Concept Info Pill */}
        <div className="bg-white/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800">Supervised Learning Architecture:</span>
              <span className="text-slate-600 ml-1.5">
                Trains a classifier on labeled historical student marks (Math, Science, English, etc.) to map patterns to discrete performance categories (<strong className="text-emerald-700">Excellent</strong>, <strong className="text-blue-700">Good</strong>, <strong className="text-rose-700">Poor</strong>).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Labelled Training</span>
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>Real-time Inference</span>
            </span>
          </div>
        </div>

        {/* Operation 1: Dataset & Training */}
        {activeTab === 'train' && (
          <DatasetTrainer
            onModelTrained={handleModelTrained}
            onNavigateToPredict={() => setActiveTab('predict')}
            currentModel={modelInfo}
          />
        )}

        {/* Operation 2: Student Marks Prediction */}
        {activeTab === 'predict' && (
          <MarksPredictor
            modelInfo={modelInfo}
            onNavigateToTrain={() => setActiveTab('train')}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Student Performance Classification Project</span>
            <span>— Supervised Learning Concept</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Python 3.10 Backend</span>
            <span>•</span>
            <span>scikit-learn & pandas</span>
            <span>•</span>
            <span>Express & React UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
