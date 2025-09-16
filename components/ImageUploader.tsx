import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useTranslations } from '../hooks/useTranslations';

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string, mimeType: string) => void;
  currentImage: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, currentImage }) => {
  const t = useTranslations();
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result, file.type);
      };
      reader.readAsDataURL(file);
    } else {
        alert(t.invalidFileError);
    }
  }, [onImageUpload, t]);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <label htmlFor="file-upload-input" className="block text-sm font-medium text-gray-300 mb-2">
        {t.sourceImageLabel}
      </label>
      <label
        htmlFor="file-upload-input"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex justify-center items-center w-full h-48 px-1 pt-1 pb-1 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
          isDragging ? 'border-yellow-400 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {currentImage ? (
            <img src={currentImage} alt={t.currentSourceAlt} className="h-full w-full object-contain rounded-md" />
        ) : (
            <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                <div className="flex text-sm text-gray-400">
                    <p className="pl-1" dangerouslySetInnerHTML={{ __html: t.dragDropOrBrowse }} />
                </div>
                <p className="text-xs text-gray-500">{t.supportedFormats}</p>
            </div>
        )}
        <input id="file-upload-input" name="file-upload" type="file" className="sr-only" onChange={handleChange} accept="image/*" />
      </label>
    </div>
  );
};

export default ImageUploader;