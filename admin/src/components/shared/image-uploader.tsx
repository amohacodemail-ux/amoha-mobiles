'use client';
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, folder = 'general', label, className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);
      const { data } = await apiClient.post('/upload', formData, {
        timeout: 30000,
      });
      onChange(data.data.url);
      toast.success('Image uploaded');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }, [uploadFile]);

  const handleRemove = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-secondary/30">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-40 object-contain bg-secondary/50"
            onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="px-3 py-2 text-xs text-muted-foreground truncate border-t border-border">
            Uploaded image
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">Drop image here or click to upload</p>
              <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP up to 5MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  max?: number;
  onUploadingChange?: (uploading: boolean) => void;
}

/** Compress an image client-side using Canvas before uploading.
 *  Resizes to max 900px and re-encodes as JPEG @ 78% quality.
 *  Reduces a typical 3–5 MB phone photo to ~120 KB.
 */
function compressImage(file: File, maxPx = 900, quality = 0.78): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); resolve(file); };
    img.src = URL.createObjectURL(file);
  });
}

export function MultiImageUploader({ value, onChange, folder = 'general', label, max = 10, onUploadingChange }: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const setUploadingState = (state: boolean) => {
    setUploading(state);
    onUploadingChange?.(state);
  };
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/')).slice(0, max - value.length);
    if (imageFiles.length === 0) return;
    setUploadingState(true);
    try {
      const compressed = await Promise.all(imageFiles.map((f) => compressImage(f)));
      const formData = new FormData();
      compressed.forEach(f => formData.append('images', f));
      formData.append('folder', folder);
      const { data } = await apiClient.post('/upload/multiple', formData, {
        timeout: 60000,
      });
      onChange([...value, ...data.data.urls]);
      toast.success('Images uploaded');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploadingState(false);
    }
  }, [folder, onChange, value, max, onUploadingChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files);
    e.target.value = '';
  }, [uploadFiles]);

  const removeImage = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-secondary border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <p className="mt-1.5 text-xs text-muted-foreground">Drop images or click ({value.length}/{max})</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
