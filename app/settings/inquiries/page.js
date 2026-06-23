'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, responded

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { 
      router.push('/dashboard'); 
      return; 
    }
    
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inquiries');
      const data = await response.json();
      
      if (data.success) {
        setInquiries(data.inquiries || []);
      } else {
        setError('Failed to load inquiries');
      }
    } catch (err) {
      setError('Error fetching inquiries: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResponded = async (inquiryId) => {
    if (!responseNotes.trim()) {
      alert('Please enter response notes');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, responseNotes }),
      });

      const data = await response.json();
      
      if (data.success) {
        setInquiries(inquiries.map((i) => i.id === inquiryId ? data.inquiry : i));
        setSelectedInquiry(null);
        setResponseNotes('');
        alert('Inquiry marked as responded');
      } else {
        setError('Failed to update inquiry');
      }
    } catch (err) {
      setError('Error updating inquiry: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInquiries = inquiries.filter((i) => {
    if (filterStatus === 'pending') return !i.responded;
    if (filterStatus === 'responded') return i.responded;
    return true;
  });

  const pendingCount = inquiries.filter((i) => !i.responded).length;
  const respondedCount = inquiries.filter((i) => i.responded).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <Link href="/settings" className="text-[#0891B2] hover:underline text-sm font-medium">
            ← Back to Settings
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Tier Inquiries</h1>
            <p className="text-gray-500 text-sm mt-1">Manage custom tier inquiries from prospects</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-[#0891B2]">{inquiries.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Inquiries</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-500 mt-1">Pending Response</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600">{respondedCount}</div>
            <div className="text-sm text-gray-500 mt-1">Responded</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filterStatus === 'all'
                ? 'bg-[#0891B2] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({inquiries.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('responded')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filterStatus === 'responded'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Responded ({respondedCount})
          </button>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading inquiries...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No inquiries found</p>
              <p className="text-sm text-gray-400 mt-2">When customers request a custom plan, their inquiries will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospitals</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{inquiry.contactName}</div>
                        <div className="text-xs text-gray-500">{inquiry.email}</div>
                        {inquiry.phone && (
                          <div className="text-xs text-gray-500">{inquiry.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{inquiry.companyName}</td>
                      <td className="px-5 py-4 text-center">
                        {inquiry.hospitalsNeeded ? (
                          <span className="font-semibold text-gray-900">{inquiry.hospitalsNeeded}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-500 text-xs">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {inquiry.responded ? (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            ✓ Responded
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="text-[#0891B2] hover:underline text-xs font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-gray-900 font-medium">{selectedInquiry.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-900">
                      <a href={`mailto:${selectedInquiry.email}`} className="text-[#0891B2] hover:underline">
                        {selectedInquiry.email}
                      </a>
                    </p>
                  </div>
                  {selectedInquiry.phone && (
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-gray-900">{selectedInquiry.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Organization</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Company Name</p>
                    <p className="text-gray-900 font-medium">{selectedInquiry.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hospitals Needed</p>
                    <p className="text-gray-900 font-medium">
                      {selectedInquiry.hospitalsNeeded || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inquiry Notes */}
              {selectedInquiry.inquiryNotes && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Inquiry Notes</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedInquiry.inquiryNotes}</p>
                  </div>
                </div>
              )}

              {/* Inquiry Meta */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Timeline</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-gray-900">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-gray-900">
                      {selectedInquiry.responded ? (
                        <span className="text-green-600 font-bold">✓ Responded</span>
                      ) : (
                        <span className="text-yellow-600 font-bold">Pending</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Response History */}
              {selectedInquiry.responseNotes && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Response</h3>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedInquiry.responseNotes}</p>
                  </div>
                </div>
              )}

              {/* Response Form (if not responded) */}
              {!selectedInquiry.responded && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Mark as Responded</h3>
                  <div className="space-y-3">
                    <textarea
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder="Add response notes..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkResponded(selectedInquiry.id)}
                        disabled={submitting || !responseNotes.trim()}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {submitting ? 'Saving...' : 'Mark as Responded'}
                      </button>
                      <button
                        onClick={() => setSelectedInquiry(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
