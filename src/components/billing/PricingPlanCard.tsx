import { Check, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingPlanCardProps {
  name: string;
  price: string;
  periodLabel: string;
  description: string;
  features: string[];
  ctaLabel: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  ctaVariant?: "default" | "outline";
  popular?: boolean;
  current?: boolean;
  currentLabel?: string;
  popularLabel?: string;
  savingsLabel?: string;
  highlighted?: boolean;
  secondaryCta?: React.ReactNode;
}

export function PricingPlanCard({
  name,
  price,
  periodLabel,
  description,
  features,
  ctaLabel,
  onCtaClick,
  ctaDisabled,
  ctaLoading,
  ctaVariant = "default",
  popular,
  current,
  currentLabel = "Current plan",
  popularLabel = "Most popular",
  savingsLabel,
  highlighted,
  secondaryCta,
}: PricingPlanCardProps) {
  const isFeatured = popular || highlighted;
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-all",
        isFeatured
          ? "border-primary/60 shadow-lg shadow-primary/5 ring-1 ring-primary/30"
          : "border-border/60 hover:border-border",
        current && "ring-2 ring-primary"
      )}
    >
      {/* Top badges */}
      {(popular || current) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
          {current ? (
            <Badge className="bg-primary text-primary-foreground gap-1 px-2.5 py-0.5 text-[11px]">
              <Crown className="h-3 w-3" />
              {currentLabel}
            </Badge>
          ) : popular ? (
            <Badge className="bg-primary text-primary-foreground px-2.5 py-0.5 text-[11px]">
              {popularLabel}
            </Badge>
          ) : null}
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem]">{description}</p>
      </div>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">{periodLabel}</span>
      </div>
      {savingsLabel && (
        <p className="text-xs text-primary font-medium mt-1">{savingsLabel}</p>
      )}

      {/* Features */}
      <ul className="mt-5 space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10">
              <Check className="h-2.5 w-2.5 text-primary" />
            </span>
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-6 space-y-2">
        <Button
          className="w-full"
          variant={ctaVariant}
          disabled={ctaDisabled || ctaLoading}
          onClick={onCtaClick}
        >
          {ctaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {ctaLabel}
        </Button>
        {secondaryCta}
      </div>
    </div>
  );
}
