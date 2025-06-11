"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, BookOpen, Phone } from "lucide-react";

export function NextSteps() {
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Next steps</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Budget Tool */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
              <Calculator className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold">
              Find out your buying budget
            </h3>
            <p className="text-sm text-muted-foreground">
              Calculate how much you can afford and explore mortgage options
              tailored to your situation.
            </p>
            <Button className="w-full bg-brand hover:bg-brand/90">
              Calculate Budget
            </Button>
          </div>

          {/* Mortgage Guide */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold">
              Get a mortgage in principle
            </h3>
            <p className="text-sm text-muted-foreground">
              Get pre-approved for a mortgage to strengthen your position when
              making an offer.
            </p>
            <Button variant="outline" className="w-full">
              Get Pre-approved
            </Button>
          </div>

          {/* Price Negotiation */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
              <Phone className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold">
              Guide: How to negotiate price with seller
            </h3>
            <p className="text-sm text-muted-foreground">
              Learn proven strategies to negotiate the best price based on
              market data and property insights.
            </p>
            <Button variant="outline" className="w-full">
              View Guide
            </Button>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Our property experts are available to answer your
            questions and guide you through the buying process.
          </p>
          <Button variant="link" className="mt-2">
            Contact an Expert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
