"use client";

import { Button } from "@/components/ui/button";
import { Star, Navigation, Clock, ExternalLink } from "lucide-react";
import type { StoreMarkerPopupConfig } from "./types";

export function StoreMarkerPopupCard({
  image,
  category,
  name,
  rating,
  reviews,
  hours,
  onDirectionsClick,
  onExternalLinkClick,
}: StoreMarkerPopupConfig) {
  return (
    <>
      {image && (
        <div className="relative h-32 w-full overflow-hidden rounded-t-md">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2 p-3">
        <div>
          {category && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
              {category}
            </span>
          )}
          <h3 className="font-semibold text-foreground leading-tight">
            {name}
          </h3>
        </div>
        
        {rating !== undefined && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{rating}</span>
              {reviews !== undefined && (
                <span className="text-muted-foreground">
                  ({reviews.toLocaleString()})
                </span>
              )}
            </div>
          </div>
        )}
        
        {hours && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{hours}</span>
          </div>
        )}
        
        {(onDirectionsClick || onExternalLinkClick) && (
          <div className="flex gap-2 pt-1 mt-2">
            {onDirectionsClick && (
              <Button size="sm" className="flex-1 h-8" onClick={onDirectionsClick}>
                <Navigation className="size-3.5 mr-1.5" />
                Directions
              </Button>
            )}
            {onExternalLinkClick && (
              <Button size="sm" variant="outline" className="h-8 px-2" onClick={onExternalLinkClick}>
                <ExternalLink className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
