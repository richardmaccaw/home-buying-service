"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProperty } from "@/lib/context/PropertyContext";
import { Bed, Bath, Home, Clock } from "lucide-react";

export function Header() {
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{data.address}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property facts */}
        <div className="flex flex-wrap gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            {data.bedrooms} bed{data.bedrooms !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            {data.bathrooms} bath{data.bathrooms !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            {data.tenure}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {data.marketTime} days on market
          </Badge>
        </div>

        {/* Price and value */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">On the market for</h3>
            <p className="text-3xl font-bold text-brand">
              {formatPrice(data.price)}
            </p>
            <p className="text-muted-foreground">
              {formatPrice(data.pricePerSqM)} per m²
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Value for money</h3>
            <div className="flex items-center gap-3">
              <span
                className={`text-3xl font-bold ${getScoreColor(data.valueForMoney)}`}
              >
                {data.valueForMoney.toFixed(1)}
              </span>
              <span className="text-muted-foreground">/ 10</span>
            </div>
            <Progress value={data.valueForMoney * 10} className="mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
