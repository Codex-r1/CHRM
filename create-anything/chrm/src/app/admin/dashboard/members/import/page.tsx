"use client";

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportMembersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/import-members', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Import error:', error);
      setResult({ success: false, error: 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Import Manual Members</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            CSV should have these columns:
          </p>
          <code className="bg-gray-100 p-2 block text-sm rounded">
            membership_number,full_name,email,phone,course,graduation_year,county
          </code>
        </div>

        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm border rounded p-2"
        />

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Upload size={20} />
          {importing ? 'Importing...' : 'Import Members'}
        </button>
      </div>

      {result && (
        <div className={`p-6 rounded-lg border ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.success ? (
              <>
                <CheckCircle className="text-green-600" size={24} />
                <h3 className="text-xl font-semibold text-green-900">Import Successful!</h3>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-600" size={24} />
                <h3 className="text-xl font-semibold text-red-900">Import Failed</h3>
              </>
            )}
          </div>

          {result.success && (
            <div className="space-y-2">
              <p className="text-green-800">
                Imported: <strong>{result.imported}</strong> members
              </p>
              {result.skipped > 0 && (
                <p className="text-yellow-800">
                   Skipped: <strong>{result.skipped}</strong> (already exist)
                </p>
              )}
              <p className="text-gray-700 mt-4">
                Members can now claim their accounts at: <code className="bg-white px-2 py-1 rounded">/claim-account</code>
              </p>
            </div>
          )}

          {result.error && (
            <p className="text-red-800">{result.error}</p>
          )}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2"> Sample CSV Format</h3>
        <pre className="bg-white p-4 rounded text-sm overflow-x-auto">
{`membership_number,full_name,email,phone,course,graduation_year,county
100196,John Doe,john@example.com,0712345678,BCom,2020,Nairobi
100197,Jane Smith,jane@example.com,0723456789,BA Economics,2019,Mombasa
100198,Bob Jones,bob@example.com,0734567890,BSc IT,2021,Kisumu`}
        </pre>
      </div>
    </div>
  );
}