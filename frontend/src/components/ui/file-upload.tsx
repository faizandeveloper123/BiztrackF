"use client";

import React, { useRef, useState } from "react";
import { Button } from "./button";
import { Label } from "./label";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  currentFile?: File | null;
  currentUrl?: string | null;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  currentFile,
  currentUrl,
  accept = "image/*",
  maxSize = 5,
  className = "",
  label = "Upload File",
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type for images
    if (accept.includes("image") && !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    // Create preview URL for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileRemove?.();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? "border-primary bg-primary/5" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={disabled ? undefined : openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {currentFile || currentUrl || previewUrl ? (
          <div className="space-y-3">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={previewUrl || currentUrl || ""}
                  alt="Preview"
                  className="max-h-32 max-w-32 object-contain rounded border"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* File info */}
            <div className="text-sm text-gray-600">
              {currentFile?.name || "Current file"}
              {currentFile && (
                <span className="block text-xs text-gray-500">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>

            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Change File
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {dragOver
                  ? "Drop file here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept.includes("image")
                  ? "PNG, JPG, GIF up to"
                  : "Files up to"}{" "}
                {maxSize}MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select File
            </Button>
          </div>
        )}
      </div>

      {/* File requirements */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Maximum file size: {maxSize}MB</span>
        </div>
        {accept.includes("image") && (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Supported formats: PNG, JPG, GIF, WebP</span>
          </div>
        )}
      </div>
    </div>
  );
}
