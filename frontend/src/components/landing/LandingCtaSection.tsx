"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { Button } from "../ui/button";

export function LandingCtaSection() {
  const router = useRouter();

  return (
    <section
      id="contact"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 text-white"
    >
      <div className="container mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-100 mb-3">
          Get Started
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Ready to See BizTrack in Action?
        </h2>
        <p className="text-lg text-blue-50/95 mb-10 max-w-2xl mx-auto">
          Book a demo or get in touch with our team. We will help you find the
          right setup for your business.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="text-base sm:text-lg px-8 py-6 h-auto bg-white text-blue-700 hover:bg-blue-50"
            onClick={() => router.push("/signup")}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book a Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base sm:text-lg px-8 py-6 h-auto border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/contact">
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-blue-100/90">
          Prefer self-serve?{" "}
          <button
            type="button"
            className="font-semibold underline underline-offset-2 hover:text-white"
            onClick={() => router.push("/signup")}
          >
            Start your free trial
          </button>
        </p>
      </div>
    </section>
  );
}
