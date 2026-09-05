"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiService } from "@/src/services/ApiService";

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Processing authorization...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const success = searchParams.get("success");

        if (error) {
          setStatus("error");
          setMessage(`Authorization failed: ${error}`);
          if (window.opener) {
            window.opener.postMessage(
              { type: "GOOGLE_AUTH_ERROR", error },
              "*",
            );
          }
          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        if (success === "true") {
          setStatus("success");
          setMessage("Authorization successful! Closing window...");

          if (window.opener) {
            window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, "*");
          }

          setTimeout(() => {
            window.close();
          }, 1500);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("No authorization code received");
          if (window.opener) {
            window.opener.postMessage(
              { type: "GOOGLE_AUTH_ERROR", error: "No code" },
              "*",
            );
          }
          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        try {
          await apiService.googleAuthCallback(code);

          setStatus("success");
          setMessage("Authorization successful! Closing window...");

          if (window.opener) {
            window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, "*");
          }

          setTimeout(() => {
            window.close();
          }, 1500);
        } catch (apiError: any) {
          setStatus("error");
          const errorMsg =
            apiError?.response?.data?.detail ||
            apiError?.message ||
            "Authorization failed";
          setMessage(errorMsg);

          if (window.opener) {
            window.opener.postMessage(
              { type: "GOOGLE_AUTH_ERROR", error: errorMsg },
              "*",
            );
          }

          setTimeout(() => {
            window.close();
          }, 3000);
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred");
        if (window.opener) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_ERROR", error: "Unexpected error" },
            "*",
          );
        }
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Processing Authorization
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-green-600 mb-2">
              Authorization Successful!
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-red-600 mb-2">
              Authorization Failed
            </h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              This window will close automatically...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
