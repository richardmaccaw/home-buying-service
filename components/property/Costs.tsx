"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProperty } from "@/lib/context/PropertyContext";
import { Calculator, PoundSterling, AlertTriangle } from "lucide-react";

export function Costs() {
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

  const formatPercent = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Monthly payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Monthly payments on this property
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on a 2-year fixed rate with a 35-year mortgage term and
            different deposit amounts
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {data.mortgage.monthlyPayments.map((payment, index) => (
              <div key={index} className="space-y-3">
                <div className="text-center">
                  <Badge className="mb-2">
                    {payment.deposit === 18000
                      ? "5%"
                      : payment.deposit === 36000
                        ? "10%"
                        : "20%"}{" "}
                    deposit ({payment.ltv}% LTV)
                  </Badge>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-brand">
                      {formatPrice(payment.monthlyPayment)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercent(payment.rate)} APRC
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top tip banner */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Top tip:</strong> First-time buyers may be eligible for
          mortgage with the Equity Agent to reduce these costs to 5-10%. You'll
          start paying interest only on 5-10% of the home price. To find out
          more about this, fill out the buying budget tool below.
        </AlertDescription>
      </Alert>

      {/* Up-front costs */}
      <Card>
        <CardHeader>
          <CardTitle>Up-front costs for this property</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Stamp duty */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                <h4 className="font-semibold">Stamp duty</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-lg font-bold">{formatPrice(0)}</p>
                  <p className="text-sm text-muted-foreground">
                    for first time buyers
                  </p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-lg font-bold">
                    {formatPrice(data.costs.sdlt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    for home movers
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Assuming you'll live in this property and not own others
              </p>
            </div>

            {/* Other costs */}
            <div className="space-y-4">
              <h4 className="font-semibold">Other estimated costs</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conveyancing</span>
                  <span className="font-medium">
                    {formatPrice(data.costs.conveyancing)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Survey</span>
                  <span className="font-medium">
                    {formatPrice(data.costs.survey)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total additional costs</span>
                    <span className="font-bold">
                      {formatPrice(data.costs.conveyancing + data.costs.survey)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for badge
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ${className}`}
    >
      {children}
    </span>
  );
}
