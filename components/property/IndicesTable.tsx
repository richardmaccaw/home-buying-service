"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProperty } from "@/lib/context/PropertyContext";

export function IndicesTable() {
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

  const indices = [
    {
      source: "Zoopla Index",
      price: data.indices.zoopla,
      description: "Automated valuation model",
    },
    {
      source: "Office for National Statistics",
      price: data.indices.ons,
      description: "Land Registry house prices",
    },
    {
      source: "Acadata Index",
      price: data.indices.acadata,
      description: "Mix-adjusted house prices",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>House price from indices</CardTitle>
        <p className="text-sm text-muted-foreground">
          Multiple data sources provide different valuations for this property
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Valuation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indices.map((index) => (
              <TableRow key={index.source}>
                <TableCell className="font-medium">{index.source}</TableCell>
                <TableCell className="text-muted-foreground">
                  {index.description}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(index.price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
