import React, { useRef, useState } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  maxWidth,
  maxHeight,
  quality = 0.75
}) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/webp', quality);
          onChange(base64);
        }
        setLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isBase64 = value.startsWith('data:image/');

  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-bold uppercase text-gray-500">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={isBase64 ? 'Uploaded Image (WebP Compressed)' : value}
          onChange={(e) => {
            if (!isBase64) onChange(e.target.value);
            else onChange(''); // clear base64 to let them paste URL
          }}
          placeholder={isBase64 ? 'Uploaded WebP Image' : 'Paste URL or upload image'}
          className="flex-1 rounded-xl border border-gray-700 bg-[#080b12] px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition placeholder:text-gray-600"
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => {
            if (isBase64) {
              onChange(''); // clear if already uploaded to let them upload a new one
            } else {
              fileInputRef.current?.click();
            }
          }}
          disabled={loading}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black transition ${
            isBase64
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700'
          } disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isBase64 ? (
            <Check className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {loading ? 'Processing…' : isBase64 ? 'Change' : 'Upload File'}
        </button>
      </div>
    </div>
  );
};
