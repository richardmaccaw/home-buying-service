"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProperty } from "@/lib/context/PropertyContext";

export function CurrentValue() {
  const { data, loading } = useProperty();

  if (loading || !data) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case "structural-project":
        return "Structural project";
      case "renovation":
        return "Renovation required";
      case "ready-to-move":
        return "Ready to move in";
      default:
        return condition;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "structural-project":
        return "destructive";
      case "renovation":
        return "secondary";
      case "ready-to-move":
        return "default";
      default:
        return "secondary";
    }
  };

  // Local average price per m²
  const areaAverage = data.localArea.areaAverage ?? 3000;
  const percentageVsAverage =
    ((data.pricePerSqM - areaAverage) / areaAverage) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current value</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price per m² comparison */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">
              Price per m² vs area average
            </span>
            <span
              className={`text-sm font-semibold ${percentageVsAverage > 0 ? "text-red-500" : "text-green-500"}`}
            >
              {percentageVsAverage > 0 ? "+" : ""}
              {(percentageVsAverage ?? 0).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>This property</span>
              <span className="font-medium">
                {formatPrice(data.pricePerSqM)}/m²
              </span>
            </div>
            <Progress
              value={Math.min(
                (data.pricePerSqM / (areaAverage * 1.5)) * 100,
                100,
              )}
              className="h-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Area average</span>
              <span>{formatPrice(areaAverage)}/m²</span>
            </div>
          </div>
        </div>

        {/* Property condition */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            Current state of this property
          </h4>
          <div className="flex items-center gap-2">
            <Badge
              variant={getConditionColor(data.condition) as any}
              className="text-sm"
            >
              {getConditionLabel(data.condition)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {data.condition === "ready-to-move" &&
              "This property appears to be in good condition and ready for occupation."}
            {data.condition === "renovation" &&
              "This property may require modernisation or renovation work."}
            {data.condition === "structural-project" &&
              "This property likely requires significant structural work."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
