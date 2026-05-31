'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  selectedFile?: File | null;
}

export default function FileUpload({ onFileSelect, accept = '.pdf,.jpg,.jpeg,.png', maxSizeMB = 5, label = 'Upload Document', selectedFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): boolean {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be under ${maxSizeMB} MB`);
      return false;
    }
    setError('');
    return true;
  }

  function handleFile(file: File) {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : selectedFile
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
        }`}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
        {selectedFile ? (
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-green-400 font-medium">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="text-sm text-slate-400">Drag & drop your file here, or <span className="text-indigo-400 font-medium">browse</span></p>
            <p className="text-xs text-slate-500">PDF, JPG, PNG up to {maxSizeMB} MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
