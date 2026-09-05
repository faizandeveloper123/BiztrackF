"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { apiService } from "../../services/ApiService";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";

interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  failed_count: number;
  errors: string[];
}

interface CustomerImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function CustomerImportDialog({
  open,
  onClose,
  onImportComplete,
}: CustomerImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.toLowerCase().split(".").pop();
      if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
        toast.error("Please select a CSV or Excel file");
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", file);

      const response = await apiService.post(
        "/crm/customers/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success !== false) {
        setImportResult({
          success: response.imported_count > 0,
          message: response.message,
          imported_count: response.imported_count || 0,
          failed_count: response.failed_count || 0,
          errors: response.errors || [],
        });

        if (response.imported_count > 0) {
          toast.success(
            `Successfully imported ${response.imported_count} customers`,
          );
          onImportComplete();
        } else {
          toast.error("No customers were imported");
        }
      } else {
        toast.error(response.message || "Import failed");
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, "Import failed");
      toast.error(errorMessage);
      setImportResult({
        success: false,
        message: errorMessage,
        imported_count: 0,
        failed_count: 0,
        errors: [],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiService.get("/crm/customers/import/template");

      if (response.success) {
        // Create blob and download
        const blob = new Blob([response.template], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = response.filename || "customer_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Template downloaded successfully");
      } else {
        toast.error("Failed to download template");
      }
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setImportResult(null);
      setProgress(0);
      onClose();
    }
  };

  const getStatusIcon = () => {
    if (uploading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (importResult?.success)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (importResult && !importResult.success)
      return <XCircle className="h-4 w-4 text-red-500" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Import Customers
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple customers at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex flex-col gap-3 border rounded-lg bg-blue-50 p-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Download className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-blue-900">Need a template?</p>
                <p className="text-sm text-blue-700">
                  Download our CSV template with sample data and column headers
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 break-all">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing customers...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert
              className={
                importResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{importResult.message}</p>
                  {importResult.imported_count > 0 && (
                    <p className="text-sm">
                      ✅ Successfully imported: {importResult.imported_count}{" "}
                      customers
                    </p>
                  )}
                  {importResult.failed_count > 0 && (
                    <p className="text-sm">
                      ❌ Failed to import: {importResult.failed_count} customers
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Errors:</p>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>
                            ... and {importResult.errors.length - 5} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">Required columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>firstName</strong> - Customer&apos;s first name
              </li>
              <li>
                <strong>lastName</strong> - Customer&apos;s last name
              </li>
              <li>
                <strong>email</strong> - Customer&apos;s email address
              </li>
            </ul>
            <p className="font-medium mt-3">Optional columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>phone, mobile, cnic, dateOfBirth, gender</li>
              <li>address, city, state, country, postalCode</li>
              <li>customerType, customerStatus, creditLimit, currentBalance</li>
              <li>paymentTerms, notes, tags</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {importResult ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!file || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Customers
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
