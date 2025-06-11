"use client";

import { useSearchParams, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { usePropertyData } from "@/hooks/usePropertyData";
import { PropertyProvider } from "@/lib/context/PropertyContext";

// Property components
import { Header } from "@/components/property/Header";
import { CurrentValue } from "@/components/property/CurrentValue";
import { IndicesTable } from "@/components/property/IndicesTable";
import { History } from "@/components/property/History";
import { ListingDelta } from "@/components/property/ListingDelta";
import { LocalArea } from "@/components/property/LocalArea";
import { Costs } from "@/components/property/Costs";
import { NextSteps } from "@/components/property/NextSteps";

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  if (!query) {
    redirect("/");
  }

  const { data, loading, error } = usePropertyData(query);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Search
            </Link>
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PropertyProvider data={data} loading={loading} error={error}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Search
            </Link>
          </Button>
          {data && (
            <h1 className="text-lg font-medium text-muted-foreground">
              Property Report: {data.address}
            </h1>
          )}
        </div>

        {/* Property sections */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <Header />
            <CurrentValue />
            <IndicesTable />
            <History />
            <ListingDelta />
            <LocalArea />
            <Costs />
            <NextSteps />
          </div>
        )}
      </div>
    </PropertyProvider>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
