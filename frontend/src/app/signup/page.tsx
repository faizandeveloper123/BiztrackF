"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { LogIn, Home } from "lucide-react";
import { AuthForm } from "../../components/auth";
import { useAuth } from "../../hooks/useAuth";

export default function SignupPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSignupSuccess = () => {
    router.push("/");
  };

  if (user) {
    return null; // Prevent flash of signup form
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Home Navigation Link */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      {/* Sign In Button */}
      <div className="absolute top-4 right-4">
        <Link href="/login">
          <Button variant="outline" className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </Link>
      </div>

      <AuthForm mode="signup" onSuccess={handleSignupSuccess} />
    </div>
  );
}
