import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProperty } from "@/lib/context/PropertyContext";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Brain, CheckCircle2, XCircle } from "lucide-react";
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Brain className="h-5 w-5 text-orange-600 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">Property Verdict</CardTitle>
              <CardDescription className="text-sm">Getting the brutal truth...</CardDescription>
            </div>
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

  const getVerdictIcon = () => {
    switch (verdictType) {
      case "positive":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "negative":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
  };

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
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            verdictType === "positive" ? "bg-green-100" : 
            verdictType === "negative" ? "bg-red-100" : "bg-yellow-100"
          )}>
            <Brain className={cn(
              "h-5 w-5",
              verdictType === "positive" ? "text-green-600" : 
              verdictType === "negative" ? "text-red-600" : "text-yellow-600"
            )} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Property Verdict</CardTitle>
            <CardDescription className="text-sm">The no-nonsense analysis you need</CardDescription>
          </div>
          {getVerdictIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Verdict - Strava-style prominent section */}
        <div className={cn(
          "p-4 rounded-lg border",
          verdictType === "positive" ? "bg-green-50/50 border-green-200" : 
          verdictType === "negative" ? "bg-red-50/50 border-red-200" : "bg-yellow-50/50 border-yellow-200"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
              verdictType === "positive" ? "bg-green-100" : 
              verdictType === "negative" ? "bg-red-100" : "bg-yellow-100"
            )}>
              {verdictType === "positive" ? 
                <TrendingUp className="h-4 w-4 text-green-600" /> :
                verdictType === "negative" ? 
                <TrendingDown className="h-4 w-4 text-red-600" /> :
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed whitespace-pre-line">
                {analysis.overallVerdict}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 