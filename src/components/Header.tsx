import React from 'react';
import { BrainCircuit, Database, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ModelInfo } from '../types';

interface HeaderProps {
  activeTab: 'train' | 'predict';
  setActiveTab: (tab: 'train' | 'predict') => void;
  modelInfo: ModelInfo | null;
  loadingInfo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  modelInfo,
  loadingInfo,
}) => {
  const isTrained = modelInfo?.is_trained;
  const accuracy = modelInfo?.metrics?.accuracy;
  const algorithm = modelInfo?.algorithm?.replace(/_/g, ' ');

  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Student Performance Classifier
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Supervised ML • Python
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Train on student performance datasets & classify grades into Excellent, Good, or Poor categories
              </p>
            </div>
          </div>

          {/* Model Status & ML Stack badge */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Python 3.10 Engine</span>
            </div>

            {loadingInfo ? (
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 animate-pulse">
                Checking model status...
              </div>
            ) : isTrained ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="capitalize font-semibold">{algorithm}</span>
                {accuracy !== undefined && (
                  <span className="bg-emerald-200/70 text-emerald-900 font-bold px-1.5 py-0.5 rounded text-[11px]">
                    {accuracy}% Acc
                  </span>
                )}
                <span className="text-emerald-600 text-[11px]">
                  ({modelInfo?.classes?.join(', ')})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Untrained (Upload or train dataset)</span>
              </div>
            )}
          </div>
        </div>

        {/* The Two Main Operations Navigation Tabs */}
        <div className="flex border-t border-slate-100 -mb-px">
          <button
            type="button"
            id="tab-operation-1"
            onClick={() => setActiveTab('train')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'train'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Operation 1: Dataset & Supervised Training</span>
          </button>

          <button
            type="button"
            id="tab-operation-2"
            onClick={() => setActiveTab('predict')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'predict'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Operation 2: Student Marks Prediction</span>
            {isTrained && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
