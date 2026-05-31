'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import FileUpload from '@/components/ui/FileUpload';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState(false);

  async function handleUpload() {
    if (!file || !user) return;
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('ownerId', user._id);
      formData.append('documentType', 'SALARY_SLIP');

      const data = await api.upload<{ document: { url: string } }>('/api/documents/upload', formData);
      localStorage.setItem('salarySlipUrl', data.document.url);
      setUploaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function handleContinue() {
    router.push('/apply/configure');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">Upload Documents</h2>
      <p className="text-slate-400 mb-6">Upload your salary slip for verification</p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <Card>
        <div className="space-y-6">
          <FileUpload
            label="Salary Slip"
            onFileSelect={setFile}
            selectedFile={file}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={5}
          />

          {!uploaded ? (
            <Button onClick={handleUpload} isLoading={isUploading} disabled={!file} className="w-full" size="lg">
              Upload Document
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Document uploaded successfully!
              </div>
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue to Loan Configuration
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
