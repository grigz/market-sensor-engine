'use client';

import { useState, useEffect } from 'react';
import type { DriftAnalysis } from '@/lib/types';

export default function DriftAnalysisPanel() {
  const [analyses, setAnalyses] = useState<DriftAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  async function fetchAnalyses() {
    try {
      const res = await fetch('/api/drift');
      const data = await res.json();

      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setAnalyses(data);
      } else {
        console.error('API returned non-array data:', data);
        setAnalyses([]);
      }
    } catch (error) {
      console.error('Failed to fetch drift analyses:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading drift analyses...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Language Drift Analysis</h2>
        <p className="text-slate-600 mt-1">
          Auto-Diff Engine detecting competitive positioning changes
        </p>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-slate-500">
            No drift analyses available yet. Run a scan on your competitors first.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {analysis.competitorName}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">
                    {analysis.driftScore}
                  </div>
                  <div className="text-xs text-slate-600">Drift Score</div>
                </div>
              </div>

              {analysis.trajectoryCall && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="font-semibold text-yellow-900">Trajectory Call</p>
                  <p className="text-yellow-800 text-sm mt-1">
                    {analysis.trajectoryCall}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-4">
                {analysis.newNouns.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">New Nouns</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.newNouns.map((noun, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {noun}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.newVerbs.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">New Verbs</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.newVerbs.map((verb, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {verb}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.toneShifts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Tone Shifts</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.toneShifts.map((shift, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                        >
                          {shift}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-slate-900 mb-3">Implications</h4>
                <div className="space-y-3">
                  {analysis.implications.map((imp, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border-l-4 ${
                        imp.severity === 'high'
                          ? 'bg-red-50 border-red-500'
                          : imp.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{imp.text}</p>
                      <p className="text-sm text-slate-700 mt-2">
                        <span className="font-medium">So What:</span> {imp.soWhat}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                          {imp.narrativeTag}
                        </span>
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                          {imp.persona}
                        </span>
                        <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">
                          {imp.stage}
                        </span>
                        <span
                          className={`px-2 py-1 text-white text-xs rounded ${
                            imp.severity === 'high'
                              ? 'bg-red-600'
                              : imp.severity === 'medium'
                              ? 'bg-yellow-600'
                              : 'bg-slate-600'
                          }`}
                        >
                          {imp.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
