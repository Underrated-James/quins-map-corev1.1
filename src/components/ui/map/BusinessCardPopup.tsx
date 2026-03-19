"use client";

import { type ReactNode } from "react";
import { MapPin, Star, Clock, Phone, Navigation, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── BusinessCardPopup ─────────────────────────────────────────────

type BusinessCardPopupProps = {
  /** Business/location name */
  name: string;
  /** Address or description */
  address?: string;
  /** Rating out of 5 */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Category/type (e.g., "Restaurant", "Café") */
  category?: string;
  /** Opening hours text */
  hours?: string;
  /** Whether currently open */
  isOpen?: boolean;
  /** Phone number */
  phone?: string;
  /** Image URL */
  imageUrl?: string;
  /** Callback for directions button */
  onDirections?: () => void;
  /** Callback for call button */
  onCall?: () => void;
  /** Callback for share button */
  onShare?: () => void;
  /** Additional content */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
};

function BusinessCardPopup({
  name,
  address,
  rating,
  reviewCount,
  category,
  hours,
  isOpen,
  phone,
  imageUrl,
  onDirections,
  onCall,
  onShare,
  children,
  className,
}: BusinessCardPopupProps) {
  return (
    <div className={cn("w-64 overflow-hidden", className)}>
      {/* Image */}
      {imageUrl && (
        <div className="-m-3 mb-3">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        {category && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80">
            {category}
          </span>
        )}
        <h3 className="font-semibold text-sm leading-tight">{name}</h3>

        {/* Rating */}
        {rating !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3",
                    i < Math.floor(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {rating.toFixed(1)}
              {reviewCount !== undefined && ` (${reviewCount})`}
            </span>
          </div>
        )}

        {/* Status + Hours */}
        {(isOpen !== undefined || hours) && (
          <div className="flex items-center gap-1.5 text-xs">
            {isOpen !== undefined && (
              <span
                className={cn(
                  "font-medium",
                  isOpen ? "text-emerald-500" : "text-red-500"
                )}
              >
                {isOpen ? "Open" : "Closed"}
              </span>
            )}
            {hours && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3" />
                {hours}
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {address && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3 mt-0.5 shrink-0" />
            {address}
          </p>
        )}
      </div>

      {/* Actions */}
      {(onDirections || onCall || onShare) && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
          {onDirections && (
            <ActionButton onClick={onDirections} icon={<Navigation className="size-3.5" />} label="Directions" />
          )}
          {onCall && phone && (
            <ActionButton onClick={onCall} icon={<Phone className="size-3.5" />} label="Call" />
          )}
          {onShare && (
            <ActionButton onClick={onShare} icon={<Share2 className="size-3.5" />} label="Share" />
          )}
        </div>
      )}

      {/* Custom content */}
      {children}
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
        "text-xs font-medium",
        "bg-accent/60 hover:bg-accent",
        "dark:bg-accent/30 dark:hover:bg-accent/50",
        "transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      )}
      aria-label={label}
    >
      {icon}
      {label}
    </button>
  );
}

export { BusinessCardPopup };
export type { BusinessCardPopupProps };
