"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useProperty } from "@/lib/context/PropertyContext";

export function TimeOnMarket() {
  const { data } = useProperty();
  
  if (!data) {
    return null;
  }

  const marketTime = data.marketTime || 30;
  const listingDate = data.listingDate;
  const priceReductionDate = data.priceReductionDate;
  const hasReductions = !!priceReductionDate;

  const getMarketTimeCategory = (days: number) => {
    // Green = good (just listed), Red = bad (long time on market)
    if (days <= 7) return { label: "Just listed", color: "bg-green-500", position: 10 };
    if (days <= 14) return { label: "Recent", color: "bg-lime-500", position: 20 };
    if (days <= 30) return { label: "Recent", color: "bg-yellow-500", position: 35 };
    if (days <= 60) return { label: "Available", color: "bg-orange-500", position: 55 };
    if (days <= 90) return { label: "Some time", color: "bg-orange-600", position: 75 };
    if (days <= 180) return { label: "Long time", color: "bg-red-500", position: 85 };
    return { label: "On for a while", color: "bg-red-600", position: 90 };
  };

  const getTimeDescription = (days: number) => {
    if (days <= 7) return "Properties that have been on the market a long time might have more wiggle room for negotiation.";
    if (days <= 30) return "This is a recently listed property. Standard negotiation rules apply.";
    if (days <= 60) return "This property has been available for a moderate time. There may be some room for negotiation.";
    if (days <= 90) return "This property has been on the market for some time. There may be room for negotiation.";
    return "Properties that have been on the market a long time might have more wiggle room for negotiation.";
  };

  const getMarketTimeLabel = (days: number) => {
    if (days <= 7) return "1 week";
    if (days <= 14) return "2 weeks";
    if (days <= 21) return "3 weeks";
    if (days <= 35) return "1 month";
    if (days <= 60) return "2 months";
    if (days <= 90) return "3 months";
    if (days <= 120) return "4 months";
    if (days <= 150) return "5 months";
    if (days <= 180) return "6 months";
    if (days <= 270) return `${Math.ceil(days / 30)} months`;
    return `${Math.ceil(days / 30)} months`;
  };

  const category = getMarketTimeCategory(marketTime);
  const timeLabel = getMarketTimeLabel(marketTime);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Clock className="h-6 w-6" />
          Time on the market
        </CardTitle>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getTimeDescription(marketTime)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline visualization */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Just listed</span>
          
          {/* Timeline bar with badge */}
          <div className="relative flex-1 py-4">
            <div className="h-3 bg-gradient-to-r from-green-500 via-lime-400 via-yellow-400 via-orange-400 to-red-500 rounded-full"></div>
            
            {/* Time badge positioned centered on timeline */}
            <div 
              className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${category.position}%` }}
            >
              <div className={`${category.color} text-white px-3 py-2 rounded-lg font-semibold text-sm shadow-lg`}>
                {timeLabel}
              </div>
            </div>
          </div>
          
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">On for a while</span>
        </div>

        {/* Price reduction section matching the image */}
        <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
              <span className="font-semibold">Price reduction:</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {hasReductions ? `Reduced on ${priceReductionDate}` : "No price reduction yet."}
                </Badge>
                <div className="text-red-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Additional info matching the styling */}
          {listingDate && (
            <div className="bg-white/80 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Listed on:</strong> {listingDate}
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
} 