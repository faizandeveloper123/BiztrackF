"use client";

import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/src/lib/utils";
import {
  GOOGLE_DUMMY_REVIEWS,
  TRUSTPILOT_DUMMY_REVIEWS,
  type ReviewItem,
} from "@/src/constants/reviewsReputation";

const TRUSTPILOT_SUMMARY = {
  rating: 4.8,
  reviewCount: 128,
  profileUrl: "https://www.trustpilot.com/",
};

const GOOGLE_SUMMARY = {
  rating: 4.9,
  reviewCount: 89,
  profileUrl: "https://www.google.com/maps",
};

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
                ? "fill-amber-200 text-amber-400"
                : "fill-muted text-muted-foreground/30",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <Card className="min-w-[280px] max-w-[320px] shrink-0 snap-center border border-border/60 bg-card/90 shadow-sm md:min-w-0 md:max-w-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <StarRating rating={review.rating} size="sm" />
          <span className="text-xs text-muted-foreground">{review.date}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          &ldquo;{review.excerpt}&rdquo;
        </p>
        <p className="mt-3 text-sm font-semibold text-foreground">
          {review.author}
        </p>
      </CardContent>
    </Card>
  );
}

function ReviewCarousel({ reviews }: { reviews: ReviewItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -300 : 300;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="hidden sm:flex absolute -top-12 right-0 gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => scroll("left")}
          aria-label="Previous reviews"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => scroll("right")}
          aria-label="Next reviews"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none md:pb-0 [scrollbar-width:thin]"
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

function WidgetPlaceholder({
  platform,
  accentClass,
}: {
  platform: "Trustpilot" | "Google";
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-6 sm:p-8 text-center min-h-[140px] flex flex-col items-center justify-center gap-2",
        accentClass,
      )}
    >
      <Badge variant="secondary" className="text-xs">
        Placeholder
      </Badge>
      <p className="text-sm font-medium text-foreground">
        {platform} widget embed
      </p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Live feed or summary card will appear here once connected.
      </p>
    </div>
  );
}

function PlatformPanel({
  platform,
  rating,
  reviewCount,
  profileUrl,
  ctaLabel,
  reviews,
  widgetAccent,
  tabAccent,
}: {
  platform: "Trustpilot" | "Google";
  rating: number;
  reviewCount: number;
  profileUrl: string;
  ctaLabel: string;
  reviews: ReviewItem[];
  widgetAccent: string;
  tabAccent: string;
}) {
  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className={cn("border-0 shadow-md", tabAccent)}>
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center sm:items-start sm:text-left">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Overall rating on {platform}
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">
                {rating.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground">/ 5</span>
            </div>
            <StarRating rating={rating} size="lg" />
            <p className="mt-3 text-sm text-muted-foreground">
              Based on{" "}
              <span className="font-semibold text-foreground">
                {reviewCount.toLocaleString()}
              </span>{" "}
              reviews
            </p>
            <Button className="mt-6 w-full sm:w-auto" variant="default" asChild>
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                {ctaLabel}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <WidgetPlaceholder platform={platform} accentClass={widgetAccent} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Latest reviews
        </h3>
        <ReviewCarousel reviews={reviews} />
      </div>
    </div>
  );
}

export function ReviewsReputationSection() {
  const [activeTab, setActiveTab] = useState("trustpilot");

  return (
    <section
      id="reviews"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50/30"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-3">
            Reviews &amp; Reputation
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Trusted by Teams Like Yours
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how customers rate BizTrack on independent review platforms.
            Sample data shown until live feeds are connected.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-12 p-1.5 bg-muted/80 rounded-full w-full max-w-md grid grid-cols-2 gap-1">
              <TabsTrigger
                value="trustpilot"
                className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-[#00b67a] data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Trustpilot
              </TabsTrigger>
              <TabsTrigger
                value="google"
                className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-[#4285f4] data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Google
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="trustpilot"
            className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden"
          >
            <PlatformPanel
              platform="Trustpilot"
              rating={TRUSTPILOT_SUMMARY.rating}
              reviewCount={TRUSTPILOT_SUMMARY.reviewCount}
              profileUrl={TRUSTPILOT_SUMMARY.profileUrl}
              ctaLabel="Read on Trustpilot"
              reviews={TRUSTPILOT_DUMMY_REVIEWS}
              widgetAccent="border-[#00b67a]/30 bg-[#00b67a]/5"
              tabAccent="bg-gradient-to-br from-emerald-50/80 to-background"
            />
          </TabsContent>

          <TabsContent
            value="google"
            className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden"
          >
            <PlatformPanel
              platform="Google"
              rating={GOOGLE_SUMMARY.rating}
              reviewCount={GOOGLE_SUMMARY.reviewCount}
              profileUrl={GOOGLE_SUMMARY.profileUrl}
              ctaLabel="View on Google"
              reviews={GOOGLE_DUMMY_REVIEWS}
              widgetAccent="border-[#4285f4]/30 bg-[#4285f4]/5"
              tabAccent="bg-gradient-to-br from-blue-50/80 to-background"
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
