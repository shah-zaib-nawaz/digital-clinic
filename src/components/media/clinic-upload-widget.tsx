'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle2, Loader2, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
}

interface ClinicUploadWidgetProps {
  preset: 'clinic_doctor_profiles' | 'clinic_medical_docs';
  onUploadComplete: (result: UploadResult) => void;
  currentUrl?: string;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  className?: string;
}

export function ClinicUploadWidget({
  preset,
  onUploadComplete,
  currentUrl,
  label = 'Upload Asset',
  accept = 'image/jpeg,image/png,image/webp,image/avif',
  maxSizeMb = 10,
  className = '',
}: ClinicUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds maximum allowed size of ${maxSizeMb}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Fetch upload signature from backend
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      });

      if (!signRes.ok) {
        const errorData = await signRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to acquire upload authorization');
      }

      const { signature, timestamp, apiKey, cloudName, folder, uploadPreset } =
        await signRes.json();

      // 2. Perform direct upload to Cloudinary using XMLHttpRequest for accurate progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);
      if (uploadPreset) {
        formData.append('upload_preset', uploadPreset);
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                secureUrl: response.secure_url,
                publicId: response.public_id,
                format: response.format,
              });
            } catch (err) {
              reject(new Error('Invalid response from Cloudinary'));
            }
          } else {
            try {
              const errResp = JSON.parse(xhr.responseText);
              reject(new Error(errResp.error?.message || 'Upload rejected by Cloudinary'));
            } catch {
              reject(new Error(`Upload failed with HTTP status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
      });

      const result = await uploadPromise;

      setPreviewUrl(result.secureUrl);
      onUploadComplete(result);
      toast.success('Asset uploaded securely to Cloudinary');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setPreviewUrl(undefined);
    setFileName('');
    onUploadComplete({ secureUrl: '', publicId: '', format: '' });
  };

  const isImage = previewUrl && (previewUrl.includes('/image/') || previewUrl.match(/\.(jpg|jpeg|png|webp|avif)$/i));

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative border rounded-xl p-3 bg-card flex items-center gap-3">
          {isImage ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted shrink-0">
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-8 w-8" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Uploaded & Signed
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {fileName || previewUrl}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleClear}
                disabled={isUploading}
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isUploading
              ? 'bg-muted/50 border-muted-foreground/30 pointer-events-none'
              : 'hover:border-primary/50 hover:bg-primary/5 border-border'
          }`}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Encrypting & Uploading...
                </span>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{fileName}</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag and drop or click to browse. Max size {maxSizeMb}MB.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
