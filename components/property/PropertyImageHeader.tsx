"use client";

import { useProperty } from "@/lib/context/PropertyContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bed, Bath, Home, Clock, Camera } from "lucide-react";
import Image from "next/image";

export function PropertyImageHeader() {
  const { data, loading } = useProperty();

  if (loading || !data) {
    return (
      <div className="relative w-full -mt-8 -mx-4 mb-8 overflow-hidden">
        <div className="w-full h-[60vh] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading property...</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  // Get the first image from the property data
  const heroImage =
    data.images && data.images.length > 0 ? data.images[0] : null;

  return (
    <div className="relative w-full -mt-8 -mx-4 mb-8 overflow-hidden">
      {/* Background Image */}
      {heroImage ? (
        <div className="relative w-full h-[60vh]">
          <Image
            src={heroImage}
            alt={`${data.address} - Property Photo`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      ) : (
        <div className="w-full h-[60vh] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No image available</p>
          </div>
        </div>
      )}

      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background"></div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-end justify-center pb-16">
        <div className="text-center space-y-6 text-white max-w-4xl mx-auto px-4">
          {/* Property Address */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
            {data.address}
          </h1>

          {/* Property facts */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white border-white/20"
            >
              <Bed className="h-3 w-3" />
              {data.bedrooms} bed{data.bedrooms !== 1 ? "s" : ""}
            </Badge>
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white border-white/20"
            >
              <Bath className="h-3 w-3" />
              {data.bathrooms} bath{data.bathrooms !== 1 ? "s" : ""}
            </Badge>
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white border-white/20"
            >
              <Home className="h-3 w-3" />
              {data.tenure}
            </Badge>
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white border-white/20"
            >
              <Clock className="h-3 w-3" />
              {data.marketTime} days on market
            </Badge>
          </div>

          {/* Price and value information */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-2">On the market for</p>
              <p className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                {formatPrice(data.price)}
              </p>
              <p className="text-white/80 text-sm">
                {formatPrice(data.pricePerSqM)} per m²
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-white/80 mb-2">Value for money</p>
              <div className="flex items-center justify-center gap-3">
                <span
                  className={`text-3xl md:text-4xl font-bold drop-shadow-lg ${getScoreColor(data.valueForMoney)}`}
                >
                  {(data.valueForMoney ?? 0).toFixed(1)}
                </span>
                <span className="text-white/80">/ 10</span>
              </div>
              <div className="mt-3 max-w-32 mx-auto">
                <Progress
                  value={data.valueForMoney * 10}
                  className="h-2 bg-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
