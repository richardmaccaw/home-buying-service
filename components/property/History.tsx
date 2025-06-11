"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useProperty } from "@/lib/context/PropertyContext";
import { TrendingUp, Clock, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "2-digit",
      month: "short",
    });
  };

  // Prepare chart data from the property history
  const chartData = React.useMemo(() => {
    const points = [];

    // Add the last sale as the starting point
    if (data.history.lastSaleDate && data.history.lastSalePrice) {
      points.push({
        date: data.history.lastSaleDate,
        price: data.history.lastSalePrice,
        displayDate: formatShortDate(data.history.lastSaleDate),
        type: "Sale",
      });
    }

    // Add price reductions in chronological order
    const sortedReductions = [...data.history.priceReductions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate initial listing price (current price + total reductions)
    const totalReductions = sortedReductions.reduce(
      (sum, r) => sum + r.amount,
      0,
    );
    const initialListingPrice = data.price + totalReductions;

    // Add initial listing point if we have reductions
    if (sortedReductions.length > 0) {
      const firstReductionDate = sortedReductions[0].date;
      const listingDate = new Date(
        new Date(firstReductionDate).getTime() - 30 * 24 * 60 * 60 * 1000,
      ); // 30 days before first reduction
      points.push({
        date: listingDate.toISOString(),
        price: initialListingPrice,
        displayDate: formatShortDate(listingDate.toISOString()),
        type: "Listed",
      });
    }

    // Add reduction points
    sortedReductions.forEach((reduction) => {
      points.push({
        date: reduction.date,
        price: reduction.newPrice,
        displayDate: formatShortDate(reduction.date),
        type: "Reduction",
      });
    });

    // If no reductions, add current listing as a point
    if (sortedReductions.length === 0) {
      const listingDate =
        data.listingDelta?.listingDate || new Date().toISOString();
      points.push({
        date: listingDate,
        price: data.price,
        displayDate: formatShortDate(listingDate),
        type: "Listed",
      });
    }

    // Sort all points by date
    return points.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [data]);

  // Calculate growth percentage
  const growthPercentage = data.history.growthSinceLastSale ?? 0;
  const priceGrowth = data.price - data.history.lastSalePrice;

  const totalReduction = data.history.priceReductions.reduce(
    (total, reduction) => total + reduction.amount,
    0,
  );

  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price History Chart */}
        {chartData.length > 1 && (
          <div>
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Price history
            </h4>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                  domain={["dataMin - 10000", "dataMax + 10000"]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {formatDate(data.date)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {data.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                              <span className="text-sm font-medium">
                                {formatPrice(data.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Price growth since last sale */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Price growth since last sale
          </h4>
          <div className="grid md:grid-cols-4 gap-4">
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
              <p
                className={`text-lg font-semibold ${growthPercentage >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {growthPercentage >= 0 ? "+" : ""}
                {growthPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {priceGrowth >= 0 ? "+" : ""}
                {formatPrice(Math.abs(priceGrowth))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Annual growth rate
              </p>
              <p
                className={`text-lg font-semibold ${growthPercentage >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {/* Calculate annualized growth based on time since last sale */}
                {(() => {
                  const daysSinceLastSale = Math.floor(
                    (new Date().getTime() -
                      new Date(data.history.lastSaleDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  const years = daysSinceLastSale / 365.25;
                  const annualizedGrowth =
                    years > 0 ? growthPercentage / years : 0;
                  return `${annualizedGrowth >= 0 ? "+" : ""}${annualizedGrowth.toFixed(1)}%`;
                })()}
              </p>
              <p className="text-sm text-muted-foreground">per year</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
