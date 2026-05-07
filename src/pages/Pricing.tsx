import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEntitlementsContext } from "@/contexts/EntitlementsContext";
import { getLanguage } from "@/i18n";
import { useGooglePlayCheckout } from "@/hooks/useGooglePlayCheckout";
import { useDowngradePlan } from "@/hooks/useDowngradePlan";
import { getIsAndroidNative } from "@/utils/platform";
import { BillingIntervalToggle, type BillingInterval } from "@/components/billing/BillingIntervalToggle";
import { useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PricingPlanCard } from "@/components/billing/PricingPlanCard";
import { PricingComparison } from "@/components/billing/PricingComparison";
import { PaymentMethodSelectorModal } from "@/components/billing/PaymentMethodSelectorModal";

type PlanTier = "free" | "plus" | "pro";

export default function Pricing() {
  const { isPlus, isPro } = useEntitlementsContext();
  const { startGooglePlayPurchase, loading: gplayLoading } = useGooglePlayCheckout();
  const { schedulePlanChange, loading: downgradeLoading } = useDowngradePlan();
  const lang = getLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAndroidNative, setIsAndroidNative] = useState(false);
  useEffect(() => setIsAndroidNative(getIsAndroidNative()), []);

  const billingParam = searchParams.get("billing");
  const [interval, setInterval] = useState<BillingInterval>(
    billingParam === "yearly" ? "yearly" : "monthly"
  );
  const highlight = searchParams.get("highlight") as "plus" | "pro" | null;

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  function handleIntervalChange(val: BillingInterval) {
    setInterval(val);
    const next = new URLSearchParams(searchParams);
    next.set("billing", val);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    if (billingParam === "yearly" || billingParam === "monthly") setInterval(billingParam);
  }, [billingParam]);

  // Mercado Pago return status
  useEffect(() => {
    const mp = searchParams.get("mp_status");
    if (!mp) return;
    if (mp === "success") {
      toast.success(lang === "es"
        ? "Pago iniciado. Activaremos tu plan en cuanto Mercado Pago lo confirme."
        : "Payment started. Your plan will be activated once Mercado Pago confirms it.");
    } else if (mp === "pending") {
      toast.info(lang === "es"
        ? "Tu pago está pendiente de confirmación por Mercado Pago."
        : "Your payment is pending Mercado Pago confirmation.");
    } else if (mp === "failure") {
      toast.error(lang === "es"
        ? "El pago no se completó. Podés intentarlo nuevamente."
        : "The payment was not completed. You can try again.");
    }
    const next = new URLSearchParams(searchParams);
    next.delete("mp_status");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isYearly = interval === "yearly";
  const isFree = !isPlus && !isPro;

  const t = {
    headerTitle: lang === "es" ? "Planes y Precios" : "Plans & Pricing",
    headerDesc: lang === "es"
      ? "Elegí el plan que mejor se adapte a vos. Cancelá cuando quieras."
      : "Choose the plan that best fits you. Cancel anytime.",
    perMonth: lang === "es" ? "/mes" : "/month",
    perYear: lang === "es" ? "/año" : "/year",
    forever: lang === "es" ? "/siempre" : "/forever",
    popular: lang === "es" ? "Más popular" : "Most popular",
    current: lang === "es" ? "Plan actual" : "Current plan",
    youAreOn: lang === "es" ? "Estás en este plan" : "You're on this plan",
    chooseFree: lang === "es" ? "Bajar a Free" : "Downgrade to Free",
    choosePlus: lang === "es" ? "Elegir Plus" : "Choose Plus",
    choosePro: lang === "es" ? "Elegir Pro" : "Choose Pro",
    switchPlan: lang === "es" ? "Cambiar a este plan" : "Switch to this plan",
    saveLabel: lang === "es" ? "Ahorrá 2 meses" : "Save 2 months",
    confirmTitle: lang === "es" ? "¿Confirmar cambio de plan?" : "Confirm plan change?",
    confirmDesc: (n: string) => lang === "es"
      ? `Tu plan actual continuará activo hasta su vencimiento. Luego cambiará automáticamente a ${n}.`
      : `Your current plan stays active until it expires. Then it will automatically switch to ${n}.`,
    confirmBtn: lang === "es" ? "Confirmar" : "Confirm",
    cancelBtn: lang === "es" ? "Cancelar" : "Cancel",
    seeComparison: lang === "es" ? "Ver comparación completa" : "See full comparison",
    hideComparison: lang === "es" ? "Ocultar comparación" : "Hide comparison",
    footerWeb: lang === "es"
      ? "Pagos web disponibles con PayPal o tarjeta. MercadoPago se incorporará próximamente. En Android nativo, las suscripciones se procesan con Google Play."
      : "Web payments available with PayPal or card. MercadoPago coming soon. On Android native, subscriptions are processed via Google Play.",
    descFree: lang === "es" ? "Para empezar a organizar tu salud personal." : "Start organizing your personal health.",
    descPlus: lang === "es" ? "Tu salud, compartida con quien necesitás." : "Your health, shared with those you need.",
    descPro: lang === "es" ? "Gestioná la salud de toda tu familia." : "Manage your whole family's health.",
  };

  // Highlights of each plan (resumed)
  const featuresFree = [
    lang === "es" ? "1 perfil personal" : "1 personal profile",
    lang === "es" ? "Hasta 10 archivos adjuntos" : "Up to 10 attachments",
    lang === "es" ? "Citas, medicación, estudios, diagnósticos" : "Appointments, meds, tests, diagnoses",
    lang === "es" ? "Profesionales e instituciones" : "Professionals & institutions",
    lang === "es" ? "Recordatorios ilimitados" : "Unlimited reminders",
  ];
  const featuresPlus = [
    lang === "es" ? "Todo lo de Free" : "Everything in Free",
    lang === "es" ? "Hasta 100 archivos adjuntos" : "Up to 100 attachments",
    lang === "es" ? "Cirugías, hospitalizaciones, vacunas" : "Surgeries, hospitalizations, vaccines",
    lang === "es" ? "Exportar resumen clínico en PDF" : "Export clinical summary PDF",
    lang === "es" ? "Compartir tu perfil con hasta 2 personas" : "Share your profile with up to 2 people",
  ];
  const featuresPro = [
    lang === "es" ? "Todo lo de Plus" : "Everything in Plus",
    lang === "es" ? "Hasta 5 perfiles familiares" : "Up to 5 family profiles",
    lang === "es" ? "Hasta 200 archivos adjuntos" : "Up to 200 attachments",
    lang === "es" ? "Backup completo de datos" : "Full data backup",
    lang === "es" ? "Recordatorios y calendario (próximamente)" : "Reminders & calendar (coming soon)",
  ];

  const plusPlanCode = isYearly ? "plus_yearly" : "plus_monthly";
  const proPlanCode = isYearly ? "pro_yearly" : "pro_monthly";
  const plusPrice = isYearly ? "$70" : "$7";
  const proPrice = isYearly ? "$120" : "$12";
  const periodSuffix = isYearly ? t.perYear : t.perMonth;

  // Open payment selector (web/PWA)
  function openPaymentSelector(tier: PlanTier, planCode: string) {
    setSelectedPlanTier(tier);
    setSelectedPlanCode(planCode);
    setPaymentModalOpen(true);
  }

  // Handle plan CTA — branches per platform
  function handleChoosePlus() {
    if (isAndroidNative) {
      startGooglePlayPurchase(plusPlanCode, !isYearly && isFree ? "plus-50off-3meses" : undefined);
    } else {
      openPaymentSelector("plus", plusPlanCode);
    }
  }
  function handleChoosePro() {
    if (isAndroidNative) {
      startGooglePlayPurchase(proPlanCode);
    } else {
      openPaymentSelector("pro", proPlanCode);
    }
  }

  // ── Compute CTA props per plan based on user state ──
  // FREE card
  const freeIsCurrent = isFree;
  const freeCtaLabel = freeIsCurrent ? t.youAreOn : t.chooseFree;
  const freeCtaDisabled = freeIsCurrent;

  // PLUS card
  const plusIsCurrent = isPlus && !isPro;
  let plusCtaLabel = t.choosePlus;
  if (plusIsCurrent) plusCtaLabel = t.youAreOn;
  else if (isPro) plusCtaLabel = t.switchPlan;
  const plusCtaDisabled = plusIsCurrent;

  // PRO card
  const proIsCurrent = isPro;
  const proCtaLabel = proIsCurrent ? t.youAreOn : t.choosePro;
  const proCtaDisabled = proIsCurrent;

  return (
    <div className="animate-fade-in">
      <PageHeader
        variant="gradient"
        title={t.headerTitle}
        description={t.headerDesc}
      />

      {/* Toggle */}
      <div className="flex justify-center mb-6">
        <BillingIntervalToggle value={interval} onChange={handleIntervalChange} />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
        {/* FREE */}
        <PricingPlanCard
          name="Free"
          price="$0"
          periodLabel={t.forever}
          description={t.descFree}
          features={featuresFree}
          ctaLabel={t.youAreOn}
          ctaVariant="outline"
          ctaDisabled
          current={freeIsCurrent}
          currentLabel={t.current}
          hidePrimaryCta={!freeIsCurrent}
          secondaryCta={
            !freeIsCurrent ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full" disabled={downgradeLoading}>
                    {t.chooseFree}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.confirmDesc("Free")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancelBtn}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => schedulePlanChange("free")}>{t.confirmBtn}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : undefined
          }
        />

        {/* PLUS */}
        <PricingPlanCard
          name="Plus"
          price={plusPrice}
          periodLabel={periodSuffix}
          description={t.descPlus}
          features={featuresPlus}
          ctaLabel={plusCtaLabel}
          ctaDisabled={plusCtaDisabled}
          ctaLoading={gplayLoading && selectedPlanTier === "plus"}
          onCtaClick={() => {
            if (plusCtaDisabled) return;
            if (isPro) {
              // schedule downgrade Pro→Plus via confirm dialog handled below
              return;
            }
            handleChoosePlus();
          }}
          popular
          popularLabel={t.popular}
          current={plusIsCurrent}
          currentLabel={t.current}
          highlighted={highlight === "plus"}
          savingsLabel={isYearly ? t.saveLabel : undefined}
          secondaryCta={
            isPro ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    {t.switchPlan}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.confirmDesc("Plus")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancelBtn}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => schedulePlanChange(plusPlanCode)}>{t.confirmBtn}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : undefined
          }
        />

        {/* PRO */}
        <PricingPlanCard
          name="Pro"
          price={proPrice}
          periodLabel={periodSuffix}
          description={t.descPro}
          features={featuresPro}
          ctaLabel={proCtaLabel}
          ctaVariant="outline"
          ctaDisabled={proCtaDisabled}
          ctaLoading={gplayLoading && selectedPlanTier === "pro"}
          onCtaClick={() => {
            if (proCtaDisabled) return;
            handleChoosePro();
          }}
          current={proIsCurrent}
          currentLabel={t.current}
          highlighted={highlight === "pro"}
          savingsLabel={isYearly ? t.saveLabel : undefined}
        />
      </div>

      {/* Comparison (collapsible) */}
      <div className="max-w-5xl mx-auto mt-8">
        <Collapsible open={comparisonOpen} onOpenChange={setComparisonOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto mx-auto flex items-center gap-2">
              {comparisonOpen ? t.hideComparison : t.seeComparison}
              <ChevronDown className={`h-4 w-4 transition-transform ${comparisonOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-6">
            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6">
              <PricingComparison />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Footer note */}
      <div className="mt-8 max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {isAndroidNative
            ? (lang === "es"
                ? "🛒 Compras procesadas de forma segura por Google Play. Cancelá cuando quieras."
                : "🛒 Purchases processed securely by Google Play. Cancel anytime.")
            : t.footerWeb}
        </p>
      </div>

      {/* Payment selector modal (web/PWA only) */}
      <PaymentMethodSelectorModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        planCode={selectedPlanCode}
        planName={selectedPlanTier === "pro" ? "Pro" : "Plus"}
        price={selectedPlanTier === "pro" ? proPrice : plusPrice}
        periodLabel={periodSuffix}
      />
    </div>
  );
}
