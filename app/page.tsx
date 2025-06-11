"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, TrendingUp, Calculator } from "lucide-react";
import { usePersistedState } from "@/hooks/usePersistedState";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [, setLastQuery] = usePersistedState("lastQuery", "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLastQuery(query.trim());
      router.push(`/results?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Full Width Hero Image with Blur Effect - completely outside container */}
      <div className="relative w-full -mt-8 -mx-4 mb-8 overflow-hidden">
        <Image
          src="/images/hero-image.png"
          alt="Professional property analysis team"
          fill
          className="w-full h-[60vh] object-cover"
          priority
        />
        {/* Gradient overlay for blur effect at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-16">
          <div className="text-center space-y-4 text-white">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">
              AI Property <span className="text-brand">Police</span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto drop-shadow-md px-4">
              Our crack squad of AI Property Police combs through the photos,
              floorplans and sold-price data, exposing hidden flaws and telling
              you what the place is really worth—no estate-agent waffle, no
              mercy.
            </p>
          </div>
        </div>
      </div>

      {/* Rest of content in normal flow */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Search Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Drop in the Rightmove link. We blow the lid on overpriced bricks."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 h-12 text-lg"
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                disabled={!query.trim()}
                className="w-full h-12 text-lg bg-brand hover:bg-brand/90"
              >
                Search Property
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mx-auto">
                <MapPin className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-lg font-semibold">Local Market Data</h3>
              <p className="text-muted-foreground">
                Comprehensive area analysis with recent sales, price trends, and
                neighborhood insights.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-lg font-semibold">Price Analysis</h3>
              <p className="text-muted-foreground">
                Multi-source valuations from Zoopla, ONS, and Acadata with
                growth tracking since last sale.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mx-auto">
                <Calculator className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-lg font-semibold">Cost Calculator</h3>
              <p className="text-muted-foreground">
                SDLT, conveyancing, and mortgage calculations with multiple LTV
                scenarios.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Example Searches */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Valley View, Bristol, BS39 5",
              "SW1A 1AA",
              "https://rightmove.co.uk/properties/...",
            ].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => setQuery(example)}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
