'use client';

import { useState, useEffect } from 'react';
import type { ProofRecord, NarrativeTag, Persona, Stage } from '@/lib/types';

export default function ProofVaultPanel() {
  const [proofs, setProofs] = useState<ProofRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    evidenceSentence: '',
    sourceLink: '',
    personaTag: 'CTO' as Persona,
    narrativeTag: 'Trust' as NarrativeTag,
    stage: 'Awareness' as Stage,
    expiryDate: '',
  });

  useEffect(() => {
    fetchProofs();
  }, []);

  async function fetchProofs() {
    try {
      const res = await fetch('/api/proof');
      const data = await res.json();

      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setProofs(data);
      } else {
        console.error('API returned non-array data:', data);
        setProofs([]);
      }
    } catch (error) {
      console.error('Failed to fetch proofs:', error);
      setProofs([]);
    } finally {
      setLoading(false);
    }
  }

  async function addProof(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          evidenceSentence: '',
          sourceLink: '',
          personaTag: 'CTO',
          narrativeTag: 'Trust',
          stage: 'Awareness',
          expiryDate: '',
        });
        setShowAddForm(false);
        fetchProofs();
      }
    } catch (error) {
      console.error('Failed to add proof:', error);
    }
  }

  async function deleteProof(proofId: string) {
    if (!confirm('Are you sure you want to delete this proof record?')) return;

    try {
      const res = await fetch(`/api/proof?proofId=${proofId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProofs();
      }
    } catch (error) {
      console.error('Failed to delete proof:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading proof vault...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Proof Vault (ESOT)</h2>
          <p className="text-slate-600 mt-1">
            Enablement Source of Truth - Governance for counter-moves
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          {showAddForm ? 'Cancel' : 'Add Proof'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addProof} className="mb-6 p-6 bg-white rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Evidence Sentence
              </label>
              <textarea
                value={formData.evidenceSentence}
                onChange={(e) =>
                  setFormData({ ...formData, evidenceSentence: e.target.value })
                }
                placeholder="The specific claim or evidence..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Source Link
              </label>
              <input
                type="url"
                value={formData.sourceLink}
                onChange={(e) =>
                  setFormData({ ...formData, sourceLink: e.target.value })
                }
                placeholder="https://..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Narrative Tag
                </label>
                <select
                  value={formData.narrativeTag}
                  onChange={(e) =>
                    setFormData({ ...formData, narrativeTag: e.target.value as NarrativeTag })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="Trust">Trust</option>
                  <option value="Speed">Speed</option>
                  <option value="Control">Control</option>
                  <option value="Innovation">Innovation</option>
                  <option value="Cost">Cost</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Persona
                </label>
                <select
                  value={formData.personaTag}
                  onChange={(e) =>
                    setFormData({ ...formData, personaTag: e.target.value as Persona })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="CTO">CTO</option>
                  <option value="CFO">CFO</option>
                  <option value="Data Engineer">Data Engineer</option>
                  <option value="VP Engineering">VP Engineering</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value as Stage })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="Awareness">Awareness</option>
                  <option value="Consideration">Consideration</option>
                  <option value="Decision">Decision</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add Proof Record
          </button>
        </form>
      )}

      <div className="space-y-4">
        {proofs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-slate-500">
              No proof records yet. Add evidence to validate your counter-moves!
            </p>
          </div>
        ) : (
          proofs.map((proof) => (
            <div key={proof.proofId} className="p-6 bg-white rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-mono rounded">
                      {proof.proofId}
                    </span>
                    {proof.expiryDate && (
                      <span className="text-xs text-slate-500">
                        Expires: {new Date(proof.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-900 font-medium">{proof.evidenceSentence}</p>
                  <a
                    href={proof.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    {proof.sourceLink}
                  </a>
                </div>
                <button
                  onClick={() => deleteProof(proof.proofId)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="flex gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {proof.narrativeTag}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {proof.personaTag}
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                  {proof.stage}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-900 mb-2">Safety Stop Rule</h3>
        <p className="text-sm text-red-800">
          Every counter-move must be paired with a ProofID from this vault. If no matching proof is found, the system will output: <span className="font-mono">[INSUFFICIENT DATA—PROOF NEEDED]</span>
        </p>
      </div>
    </div>
  );
}
