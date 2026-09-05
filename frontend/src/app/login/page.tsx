"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { UserPlus, Home } from "lucide-react";
import { AuthForm } from "../../components/auth";
import { SessionManager } from "@/src/services/SessionManager";
import { getDefaultLandingPath } from "@/src/utils/getDefaultLandingPath";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    const user = new SessionManager().getUser();
    router.push(getDefaultLandingPath([], false, user?.userRole));
  };

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

      {/* Sign Up Button */}
      <div className="absolute top-4 right-4">
        <Link href="/signup">
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Sign Up
          </Button>
        </Link>
      </div>

      <AuthForm mode="login" onSuccess={handleLoginSuccess} />
    </div>
  );
}
