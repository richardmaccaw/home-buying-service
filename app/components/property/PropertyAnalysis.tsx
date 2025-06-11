import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProperty } from "@/lib/context/PropertyContext";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface Analysis {
  overallVerdict: string;
  recommendation: "BUY" | "DON'T_BUY" | "NEUTRAL";
}

export function PropertyAnalysis() {
  const { data, loading } = useProperty();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (data && !loading) {
      setAnalyzing(true);
      fetch("/api/analysis/property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyData: data }),
      })
        .then((res) => res.json())
        .then((data) => {
          setAnalysis(data);
          setAnalyzing(false);
        })
        .catch((error) => {
          console.error("Error fetching analysis:", error);
          setAnalyzing(false);
        });
    }
  }, [data, loading]);

  if (loading || analyzing) {
    return (
      <Card className="border-2 border-orange-200/20 bg-gradient-to-br from-orange-50/5 to-red-50/5">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg">Property Verdict</CardTitle>
            <CardDescription className="text-sm">
              Getting the brutal truth...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const getVerdictType = () => {
    if (!analysis?.recommendation) return "neutral";

    switch (analysis.recommendation) {
      case "BUY":
        return "positive";
      case "DON'T_BUY":
        return "negative";
      default:
        return "neutral";
    }
  };

  const verdictType = getVerdictType();

  const getVerdictColor = () => {
    switch (verdictType) {
      case "positive":
        return "border-green-200/30 bg-gradient-to-br from-green-50/10 to-emerald-50/5";
      case "negative":
        return "border-red-200/30 bg-gradient-to-br from-red-50/10 to-orange-50/5";
      default:
        return "border-yellow-200/30 bg-gradient-to-br from-yellow-50/10 to-amber-50/5";
    }
  };

  return (
    <Card className={cn("border-2", getVerdictColor())}>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img
              src="/images/Ross.png"
              alt="Ross"
              className="w-28 h-40 object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed whitespace-pre-line">
              {analysis.overallVerdict}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
