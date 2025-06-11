import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProperty } from "@/lib/context/PropertyContext";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Brain, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

interface Analysis {
  overallVerdict: string;
  keyInsights: string[];
  recommendations: string[];
  confidence: number;
  riskFactors: string[];
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
              <CardTitle className="text-lg">Ross Kemp&apos;s Property Verdict</CardTitle>
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
    const lowerVerdict = analysis.overallVerdict.toLowerCase();
    if (lowerVerdict.includes("buy") && !lowerVerdict.includes("don't")) {
      return "positive";
    } else if (lowerVerdict.includes("don't buy") || lowerVerdict.includes("avoid") || lowerVerdict.includes("walk away")) {
      return "negative";
    }
    return "neutral";
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
            <CardTitle className="text-lg">Ross Kemp&apos;s Property Verdict</CardTitle>
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

        {/* Insights Grid - Strava-style metrics */}
        {analysis.keyInsights.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Key Insights
            </h3>
            <div className="space-y-2">
              {analysis.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded bg-green-50/30">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {analysis.riskFactors.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Risk Factors
            </h3>
            <div className="space-y-2">
              {analysis.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded bg-amber-50/30">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
            Next Steps
          </h3>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded bg-blue-50/30">
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>
                <span className="text-sm text-muted-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Footer - Strava-style */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Analysis Confidence</span>
            <span className="font-medium">{Math.round(analysis.confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${analysis.confidence * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 