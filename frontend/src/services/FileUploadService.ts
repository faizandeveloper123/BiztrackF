// Use the same pattern as other services
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_url: string;
  filename: string;
  original_filename: string;
  s3_key?: string;
  file_size: number;
  content_type: string;
}

export interface LogoInfoResponse {
  success: boolean;
  has_logo: boolean;
  message?: string;
  file_url?: string;
  filename?: string;
  file_size?: number;
  upload_date?: string;
}

class FileUploadService {
  async uploadLogo(file: File): Promise<FileUploadResponse> {
    const token = localStorage.getItem("auth_token"); // Fixed: use correct key
    const tenantId = localStorage.getItem("currentTenantId"); // Fixed: use correct key

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/file-upload/logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload logo");
    }

    return await response.json();
  }

  async deleteLogo(): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("currentTenantId");

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/file-upload/logo`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete logo");
    }

    return await response.json();
  }

  async getLogoInfo(): Promise<LogoInfoResponse> {
    const token = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("currentTenantId");

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/file-upload/logo`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get logo info");
    }

    return await response.json();
  }

  async uploadDocument(file: File): Promise<FileUploadResponse> {
    const token = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("currentTenantId");

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/file-upload/document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload document");
    }

    return await response.json();
  }

  async uploadEmployeeFile(
    file: File,
    category: "resume" | "attachment",
  ): Promise<FileUploadResponse> {
    const token = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("currentTenantId");

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/file-upload/employee/${category}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to upload ${category}`);
    }

    return await response.json();
  }

  async deleteFile(s3Key: string): Promise<void> {
    const token = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("currentTenantId");

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}/file-upload/delete/${s3Key}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete file");
    }
  }

  getLogoUrl(fileUrl: string): string {
    // If it's already a full URL (S3), return as is
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return fileUrl;
    }
    // Convert relative URL to full URL (for backward compatibility)
    if (fileUrl.startsWith("/static/")) {
      return `${API_BASE_URL}${fileUrl}`;
    }
    return fileUrl;
  }

  extractS3KeyFromUrl(url: string): string | null {
    if (!url) {
      return null;
    }

    try {
      if (!url.includes("contabostorage.com")) {
        console.warn("URL does not appear to be a Contabo URL:", url);
        return null;
      }

      const urlWithoutParams = url.split("?")[0];

      if (urlWithoutParams.includes("/logos/")) {
        const s3Key = "logos/" + urlWithoutParams.split("/logos/")[1];
        return s3Key;
      } else if (urlWithoutParams.includes("/avatars/")) {
        const s3Key = "avatars/" + urlWithoutParams.split("/avatars/")[1];
        return s3Key;
      } else if (urlWithoutParams.includes("/documents/")) {
        const s3Key = "documents/" + urlWithoutParams.split("/documents/")[1];
        return s3Key;
      } else if (urlWithoutParams.includes("/employees/")) {
        const s3Key = "employees/" + urlWithoutParams.split("/employees/")[1];
        return s3Key;
      } else if (urlWithoutParams.includes("/reports/")) {
        const s3Key = "reports/" + urlWithoutParams.split("/reports/")[1];
        return s3Key;
      }

      return null;
    } catch (error) {
      console.error("Error extracting S3 key from URL:", error);
      return null;
    }
  }
}

export default new FileUploadService();
