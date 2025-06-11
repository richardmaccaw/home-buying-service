"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/lib/context/PropertyContext";
import { TrendingUp, Clock, Minus } from "lucide-react";

export function History() {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalReduction = data.history.priceReductions.reduce(
    (total, reduction) => total + reduction.amount,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price growth since last sale */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Price growth since last sale
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Last known sale</p>
              <p className="text-lg font-semibold">
                {formatPrice(data.history.lastSalePrice)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(data.history.lastSaleDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current listing</p>
              <p className="text-lg font-semibold">{formatPrice(data.price)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth</p>
              <p className="text-lg font-semibold text-green-500">
                +{(data.history.growthSinceLastSale ?? 0).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                +{formatPrice(data.price - data.history.lastSalePrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Time on market */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Time on market
          </h4>
          <Badge variant="secondary" className="text-sm">
            {data.marketTime} days
          </Badge>
        </div>

        {/* Price reductions */}
        {data.history.priceReductions.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Minus className="h-5 w-5 text-red-500" />
              Price reductions
            </h4>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Total reduction:{" "}
                <span className="font-semibold text-red-500">
                  {formatPrice(totalReduction)}
                </span>
              </p>
              <div className="space-y-2">
                {data.history.priceReductions.map((reduction, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(reduction.date)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reduced by {formatPrice(reduction.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatPrice(reduction.newPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">New price</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
