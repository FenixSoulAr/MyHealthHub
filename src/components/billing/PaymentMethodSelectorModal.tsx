import { CreditCard, Loader2 } from "lucide-react";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLanguage } from "@/i18n";
import { usePayPalCheckout } from "@/hooks/usePayPalCheckout";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface PaymentMethodSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planCode: string | null;
  planName: string;
  price: string;
  periodLabel: string;
}

interface MethodCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  ctaLabel: string;
  onClick?: () => void;
  loading?: boolean;
  comingSoon?: boolean;
}

function MethodCard({ name, description, icon, ctaLabel, onClick, loading, comingSoon }: MethodCardProps) {
  const lang = getLanguage();
  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        comingSoon
          ? "border-border/40 bg-muted/30 opacity-70"
          : "border-border/60 bg-card hover:border-primary/60 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{name}</p>
            {comingSoon && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {lang === "es" ? "Próximamente" : "Coming soon"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full mt-3"
        variant={comingSoon ? "outline" : "default"}
        disabled={comingSoon || loading}
        onClick={onClick}
      >
        {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
        {ctaLabel}
      </Button>
    </div>
  );
}

export function PaymentMethodSelectorModal({
  open,
  onOpenChange,
  planCode,
  planName,
  price,
  periodLabel,
}: PaymentMethodSelectorModalProps) {
  const lang = getLanguage();
  const { startCheckout: startPayPal, loading: paypalLoading } = usePayPalCheckout();
  const { startCheckout: startStripe, loading: stripeLoading } = useStripeCheckout();

  const t = {
    title: lang === "es" ? "Elegí tu método de pago" : "Choose your payment method",
    summary: lang === "es" ? "Tu selección" : "Your selection",
    paypal: "PayPal",
    paypalDesc: lang === "es"
      ? "Pagá con tu cuenta PayPal o las opciones disponibles dentro de PayPal."
      : "Pay with your PayPal account or options available inside PayPal.",
    paypalCta: lang === "es" ? "Continuar con PayPal" : "Continue with PayPal",
    card: lang === "es" ? "Tarjeta de crédito o débito" : "Credit or debit card",
    cardDesc: lang === "es"
      ? "Pagá con tarjeta de crédito o débito de forma segura vía Stripe."
      : "Pay securely with credit or debit card via Stripe.",
    cardCta: lang === "es" ? "Continuar con tarjeta" : "Continue with card",
    mp: "MercadoPago",
    mpDesc: lang === "es"
      ? "Disponible próximamente para clientes en Argentina."
      : "Coming soon for customers in Argentina.",
    mpCta: lang === "es" ? "Próximamente" : "Coming soon",
    footer: lang === "es"
      ? "Pagos web procesados por PayPal o Stripe. Cancelá en cualquier momento."
      : "Web payments processed by PayPal or Stripe. Cancel anytime.",
  };

  const handlePayPal = () => {
    if (!planCode) return;
    startPayPal(planCode);
  };
  const handleStripe = () => {
    if (!planCode) return;
    startStripe(planCode);
  };

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t.title}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Plan summary */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{t.summary}</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-semibold text-foreground">{planName}</p>
            <p className="text-sm">
              <span className="font-bold text-foreground">{price}</span>
              <span className="text-muted-foreground"> {periodLabel}</span>
            </p>
          </div>
        </div>

        {/* Methods */}
        <div className="space-y-3">
          <MethodCard
            name={t.paypal}
            description={t.paypalDesc}
            icon={<span className="font-bold text-sm">PP</span>}
            ctaLabel={t.paypalCta}
            onClick={handlePayPal}
            loading={paypalLoading}
          />
          <MethodCard
            name={t.card}
            description={t.cardDesc}
            icon={<CreditCard className="h-5 w-5" />}
            ctaLabel={t.cardCta}
            onClick={handleStripe}
            loading={stripeLoading}
          />
          <MethodCard
            name={t.mp}
            description={t.mpDesc}
            icon={<span className="font-bold text-sm">MP</span>}
            ctaLabel={t.mpCta}
            comingSoon
          />
        </div>

        <p className="text-xs text-muted-foreground text-center pt-1">{t.footer}</p>
      </div>
    </ResponsiveFormModal>
  );
}
