'use client';

import { useState } from 'react';
import CompetitorsPanel from '@/components/CompetitorsPanel';
import DriftAnalysisPanel from '@/components/DriftAnalysisPanel';
import ProofVaultPanel from '@/components/ProofVaultPanel';
import ReportsPanel from '@/components/ReportsPanel';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('competitors');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Market Sensor Engine
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Predictive CI Loop: Collect → Compare → Conclude → Communicate → Counter
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/api/export"
                download
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-sm font-medium"
              >
                Export CSV
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('competitors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'competitors'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Competitors
            </button>
            <button
              onClick={() => setActiveTab('drift')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'drift'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Drift Analysis
            </button>
            <button
              onClick={() => setActiveTab('proof')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'proof'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Proof Vault
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'reports'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Market Pulse Reports
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'competitors' && <CompetitorsPanel />}
        {activeTab === 'drift' && <DriftAnalysisPanel />}
        {activeTab === 'proof' && <ProofVaultPanel />}
        {activeTab === 'reports' && <ReportsPanel />}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-600">
            Built with the "Systems, Not Slides" framework by Ray Beharry
          </p>
        </div>
      </footer>
    </div>
  );
}
