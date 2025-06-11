"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProperty } from "@/lib/context/PropertyContext";
import { TrendingUp, MapPin } from "lucide-react";

export function LocalArea() {
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
      month: "short",
    });
  };

  const propertyTypes = [
    { type: "Detached", price: data.localArea.postcodeAverage.detached },
    {
      type: "Semi-detached",
      price: data.localArea.postcodeAverage.semiDetached,
    },
    { type: "Terraced", price: data.localArea.postcodeAverage.terraced },
    { type: "Flat", price: data.localArea.postcodeAverage.flat },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          The local area
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ONS Area Change */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h4 className="font-semibold">Bath and North East Somerset</h4>
          </div>
          <Badge variant="default" className="text-sm">
            +{(data.localArea.onsAreaChange ?? 0).toFixed(1)}%
          </Badge>
          <p className="text-sm text-muted-foreground mt-1">
            Across the whole of the South West
          </p>
        </div>

        {/* Recent Sales */}
        <div>
          <h4 className="font-semibold mb-4">Recent sales in this area</h4>
          <div className="grid gap-4">
            {data.localArea.recentSales.map((sale, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{sale.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {sale.distance} away
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(sale.price)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sale.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Postcode Price Chart */}
        <div>
          <h4 className="font-semibold mb-4">All sales on this road</h4>
          <div className="space-y-4">
            {/* Simple price history visualization */}
            <div className="h-32 border rounded-lg p-4 bg-muted/20 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Price trend visualization would go here
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Price history from{" "}
              {formatDate(data.localArea.priceHistory[0]?.date)} to{" "}
              {formatDate(
                data.localArea.priceHistory[
                  data.localArea.priceHistory.length - 1
                ]?.date,
              )}
            </p>
          </div>
        </div>

        {/* Average Sale Prices */}
        <div>
          <h4 className="font-semibold mb-4">
            Average sale prices in this postcode
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Type</TableHead>
                <TableHead className="text-right">Average Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertyTypes.map((property) => (
                <TableRow key={property.type}>
                  <TableCell className="font-medium">{property.type}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(property.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
