"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/lib/context/PropertyContext";
import { TrendingUp, Clock, Minus } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo } from "react";

export function History() {
  const { data, loading } = useProperty();

  const chartData = useMemo(() => {
    if (!data?.localArea?.priceHistory) return [];

    return data.localArea.priceHistory.map((entry, index, array) => {
      const currentPrice = entry.price;
      const previousPrice = index > 0 ? array[index - 1].price : currentPrice;
      const growth =
        previousPrice !== 0
          ? ((currentPrice - previousPrice) / previousPrice) * 100
          : 0;

      return {
        date: new Date(entry.date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
        }),
        price: currentPrice,
        growth: growth,
        formattedPrice: new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          maximumFractionDigits: 0,
        }).format(currentPrice),
      };
    });
  }, [data?.localArea?.priceHistory]);

  const totalGrowth = useMemo(() => {
    if (!chartData.length || chartData.length < 2) return 0;
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }, [chartData]);

  const chartConfig = {
    price: {
      label: "Property Price",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

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
        {/* Interactive Price History Chart */}
        {chartData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Local Area Price History
              </h4>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Growth</p>
                <p
                  className={`text-lg font-semibold ${totalGrowth >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {totalGrowth >= 0 ? "+" : ""}
                  {totalGrowth.toFixed(1)}%
                </p>
              </div>
            </div>

            <ChartContainer
              config={chartConfig}
              className="max-h-[300px] w-full"
            >
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: "GBP",
                      notation: "compact",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => `Period: ${value}`}
                      formatter={(value, name) => [
                        new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: "GBP",
                          maximumFractionDigits: 0,
                        }).format(value as number),
                        "Average Price",
                      ]}
                    />
                  }
                />
                <Line
                  dataKey="price"
                  type="monotone"
                  stroke="var(--color-price)"
                  strokeWidth={3}
                  dot={{
                    fill: "var(--color-price)",
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartContainer>

            <p className="text-sm text-muted-foreground mt-2">
              Showing local area average prices over time. Trend shows{" "}
              {totalGrowth >= 0 ? "positive" : "negative"} growth of{" "}
              {Math.abs(totalGrowth).toFixed(1)}%.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
