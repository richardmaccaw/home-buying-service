"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProperty } from "@/lib/context/PropertyContext";
import { ChevronLeft, ChevronRight, Expand, Grid3X3, Camera } from "lucide-react";
import Image from "next/image";

export function ImageGallery() {
  const { data, loading } = useProperty();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'hero' | 'grid'>('hero');

  if (loading || !data || !data.images || data.images.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60">
        <div className="p-8">
          <div className="flex items-center justify-center h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-200/40">
            <div className="text-center">
              <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No images available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === data.images!.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? data.images!.length - 1 : prev - 1
    );
  };

  if (viewMode === 'grid') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-xl shadow-slate-900/5">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Property Gallery
              </h3>
              <p className="text-sm text-slate-500 mt-1">{data.images.length} photos</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('hero')}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              <Expand className="h-4 w-4" />
              Featured View
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.images.map((imageUrl, index) => (
              <div
                key={index}
                className="relative aspect-square cursor-pointer group overflow-hidden rounded-xl border border-slate-200/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => {
                  setSelectedImageIndex(index);
                  setViewMode('hero');
                }}
              >
                <Image
                  src={imageUrl}
                  alt={`Property image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-slate-700">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-xl shadow-slate-900/5">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Property Gallery
            </h3>
            <p className="text-sm text-slate-500 mt-1">{data.images.length} photos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg shadow-blue-500/20">
              {selectedImageIndex + 1} of {data.images.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              <Grid3X3 className="h-4 w-4" />
              Grid View
            </Button>
          </div>
        </div>

        {/* Main hero image - larger and more prominent */}
        <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl shadow-slate-900/10 border border-slate-200/40">
          <Image
            src={data.images[selectedImageIndex]}
            alt={`Property image ${selectedImageIndex + 1}`}
            fill
            className="object-cover transition-all duration-700 hover:scale-105"
            priority={selectedImageIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          
          {/* Gradient overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          
          {/* Navigation arrows with modern styling */}
          {data.images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white shadow-2xl shadow-black/20 border-0 hover:scale-105 transition-all duration-200"
                onClick={prevImage}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white shadow-2xl shadow-black/20 border-0 hover:scale-105 transition-all duration-200"
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Modern image counter */}
          <div className="absolute bottom-4 right-4 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-2xl shadow-black/30">
            {selectedImageIndex + 1} / {data.images.length}
          </div>
        </div>

        {/* Smaller, more subtle thumbnail strip */}
        {data.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {data.images.map((imageUrl, index) => (
              <button
                key={index}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
                  selectedImageIndex === index
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg shadow-blue-500/20 scale-105'
                    : 'opacity-70 hover:opacity-100 shadow-md hover:shadow-lg'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <Image
                  src={imageUrl}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {selectedImageIndex !== index && (
                  <div className="absolute inset-0 bg-slate-400/20 backdrop-blur-[1px]" />
                )}
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-transparent to-transparent" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 