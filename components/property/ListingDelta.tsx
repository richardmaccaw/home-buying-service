"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/lib/context/PropertyContext";
import { TrendingDown, TrendingUp } from "lucide-react";

export function ListingDelta() {
  const { data, loading } = useProperty();

  if (loading || !data) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeVariant = (change: number) => {
    return change >= 0 ? "default" : "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>The local area</CardTitle>
        <p className="text-sm text-muted-foreground">
          Price changes since this property was listed on{" "}
          {formatDate(data.listingDelta.listingDate)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getChangeIcon(data.listingDelta.rightmove)}
              <h4 className="font-semibold">Rightmove index</h4>
            </div>
            <Badge
              variant={getChangeVariant(data.listingDelta.rightmove) as any}
              className="text-sm"
            >
              {data.listingDelta.rightmove > 0 ? "+" : ""}
              {data.listingDelta.rightmove.toFixed(1)}%
            </Badge>
            <p className="text-sm text-muted-foreground">
              Local market change since listing
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getChangeIcon(data.listingDelta.acadata)}
              <h4 className="font-semibold">Acadata index</h4>
            </div>
            <Badge
              variant={getChangeVariant(data.listingDelta.acadata) as any}
              className="text-sm"
            >
              {data.listingDelta.acadata > 0 ? "+" : ""}
              {data.listingDelta.acadata.toFixed(1)}%
            </Badge>
            <p className="text-sm text-muted-foreground">
              Regional market change since listing
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm">
            <strong>What this means:</strong> These indices show how the broader
            market has moved since this property was first listed. A negative
            change might indicate the property is now relatively more expensive
            compared to when it was first listed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
