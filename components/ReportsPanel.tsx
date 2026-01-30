'use client';

import { useState, useEffect } from 'react';
import type { MarketPulseReport } from '@/lib/types';

export default function ReportsPanel() {
  const [reports, setReports] = useState<MarketPulseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();

      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        console.error('API returned non-array data:', data);
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const recipients = sendEmail
        ? emailRecipients.split(',').map((e) => e.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail,
          recipients,
        }),
      });

      if (res.ok) {
        alert('Market Pulse Report generated successfully!');
        fetchReports();
        setEmailRecipients('');
        setSendEmail(false);
      } else {
        const error = await res.json();
        alert(`Failed to generate report: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading reports...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Market Pulse Reports</h2>
        <p className="text-slate-600 mt-1">
          LPNS Pattern: Line → Proof → Next Step
        </p>
      </div>

      <div className="mb-6 p-6 bg-white rounded-lg shadow">
        <h3 className="font-semibold text-slate-900 mb-4">Generate New Report</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="sendEmail" className="text-sm font-medium text-slate-700">
              Send via Resend Email
            </label>
          </div>

          {sendEmail && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Recipients (comma-separated)
              </label>
              <input
                type="text"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={generating}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Market Pulse Report'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-slate-500">
              No reports generated yet. Generate your first Market Pulse Report above!
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Market Pulse Report
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Generated: {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {report.sentViaEmail && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Sent via Email
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 mb-2">Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {report.driftAnalyses.length}
                    </div>
                    <div className="text-xs text-slate-600">Competitors Analyzed</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {report.topImplications.length}
                    </div>
                    <div className="text-xs text-slate-600">Top Implications</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {report.recommendedActions.filter((a) => a.status === 'VALIDATED').length}
                    </div>
                    <div className="text-xs text-slate-600">Validated Actions</div>
                  </div>
                </div>
              </div>

              {report.topImplications.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Top Implications</h4>
                  <div className="space-y-2">
                    {report.topImplications.slice(0, 3).map((imp, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50 rounded text-sm"
                      >
                        <p className="font-medium text-slate-900">{imp.text}</p>
                        <p className="text-slate-600 mt-1 text-xs">{imp.soWhat}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendedActions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Recommended Actions (LPNS)
                  </h4>
                  <div className="space-y-2">
                    {report.recommendedActions.slice(0, 5).map((action, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded text-sm border-l-4 ${
                          action.status === 'VALIDATED'
                            ? 'bg-green-50 border-green-500'
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              <span className="text-xs text-slate-600">Line:</span> {action.line}
                            </p>
                            {action.proofId && (
                              <p className="text-xs text-slate-600 mt-1">
                                <span className="font-semibold">Proof:</span>{' '}
                                <span className="font-mono bg-purple-100 px-1 rounded">
                                  {action.proofId}
                                </span>
                              </p>
                            )}
                            <p className="text-xs text-slate-600 mt-1">
                              <span className="font-semibold">Next Step:</span> {action.nextStep}
                            </p>
                          </div>
                          <span
                            className={`ml-2 px-2 py-1 text-xs rounded ${
                              action.status === 'VALIDATED'
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {action.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-2">
          Stop / Start / Scale Framework
        </h3>
        <div className="text-sm text-purple-800 space-y-1">
          <p><strong>Stop:</strong> Building static competitive grids</p>
          <p><strong>Start:</strong> Your 90-Day Copy Seismograph</p>
          <p><strong>Scale:</strong> Forward your first Market Pulse email to leadership to prove your value as a Market Architect</p>
        </div>
      </div>
    </div>
  );
}
