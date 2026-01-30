'use client';

import { useState, useEffect } from 'react';
import type { CompetitorConfig } from '@/lib/types';

export default function CompetitorsPanel() {
  const [competitors, setCompetitors] = useState<CompetitorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchCompetitors();
  }, []);

  async function fetchCompetitors() {
    try {
      const res = await fetch('/api/competitors');
      const data = await res.json();
      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setCompetitors(data);
      } else {
        console.error('API returned non-array data:', data);
        setCompetitors([]);
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  }

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, name: newName }),
      });

      if (res.ok) {
        setNewUrl('');
        setNewName('');
        setShowAddForm(false);
        fetchCompetitors();
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
    }
  }

  async function scanCompetitor(url: string) {
    setScanning(url);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        alert('Scan completed successfully!');
        fetchCompetitors();
      } else {
        alert('Scan failed');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed');
    } finally {
      setScanning(null);
    }
  }

  async function scanAll() {
    setScanning('all');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Scanned ${result.scannedCount} of ${result.totalCount} competitors`);
        fetchCompetitors();
      } else {
        alert('Scan failed');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed');
    } finally {
      setScanning(null);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Competitor URLs</h2>
        <div className="flex gap-2">
          <button
            onClick={scanAll}
            disabled={scanning !== null}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {scanning === 'all' ? 'Scanning...' : 'Scan All'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            {showAddForm ? 'Cancel' : 'Add Competitor'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={addCompetitor} className="mb-6 p-6 bg-white rounded-lg shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Competitor Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Acme Corp"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add Competitor
          </button>
        </form>
      )}

      <div className="space-y-4">
        {competitors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-slate-500">No competitors added yet. Add your first competitor to start monitoring!</p>
          </div>
        ) : (
          competitors.map((comp) => (
            <div key={comp.url} className="p-6 bg-white rounded-lg shadow hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{comp.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{comp.url}</p>
                  {comp.lastScanned && (
                    <p className="text-xs text-slate-500 mt-2">
                      Last scanned: {new Date(comp.lastScanned).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      comp.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {comp.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => scanCompetitor(comp.url)}
                    disabled={scanning !== null}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {scanning === comp.url ? 'Scanning...' : 'Scan Now'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">90-Day Copy Seismograph</h3>
        <p className="text-sm text-blue-800">
          Add your top 3 rivals URLs above. The system will maintain a 90-day baseline and automatically detect language drift, new positioning terms, and pricing changes.
        </p>
      </div>
    </div>
  );
}
