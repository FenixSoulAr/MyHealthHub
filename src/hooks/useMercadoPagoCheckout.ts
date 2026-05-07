import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getLanguage } from "@/i18n";
import { useAdmin } from "@/hooks/useAdmin";

export function useMercadoPagoCheckout() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const lang = getLanguage();

  const messages = {
    notLoggedIn: lang === "es" ? "Debes iniciar sesión para continuar" : "You must be logged in to continue",
    error: lang === "es" ? "Ocurrió un error al iniciar Mercado Pago. Intentá nuevamente." : "Could not start Mercado Pago. Please try again.",
    redirecting: lang === "es" ? "Redirigiendo a Mercado Pago..." : "Redirecting to Mercado Pago...",
    adminNoCheckout: lang === "es" ? "Los administradores tienen acceso completo sin suscripción" : "Admins have full access without subscription",
  };

  async function startCheckout(planCode: string) {
    if (!user) {
      toast.error(messages.notLoggedIn);
      navigate("/auth/sign-in");
      return;
    }
    if (isAdmin) {
      toast.info(messages.adminNoCheckout);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-create-subscription", {
        body: { plan_code: planCode },
      });
      if (error) {
        console.error("[useMercadoPagoCheckout] invoke error:", error, "context:", (error as any)?.context);
        try {
          const ctx = (error as any)?.context;
          if (ctx?.json) console.error("[useMercadoPagoCheckout] MP details:", await ctx.json());
        } catch (_) {}
        toast.error(messages.error);
        return;
      }
      if ((data as any)?.error) {
        console.error("[useMercadoPagoCheckout] MP error payload:", data);
        toast.error(messages.error);
        return;
      }
      const initPoint = (data as any)?.init_point;
      if (!initPoint) {
        console.error("[useMercadoPagoCheckout] missing init_point:", data);
        toast.error(messages.error);
        return;
      }
      toast.info(messages.redirecting);
      window.location.href = initPoint;
    } catch (e) {
      console.error("[useMercadoPagoCheckout] unexpected:", e);
      toast.error(messages.error);
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, loading };
}
