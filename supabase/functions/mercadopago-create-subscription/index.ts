import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_API = "https://api.mercadopago.com";

// Frequency map per plan_code
function billingFor(planCode: string): { type: "months"; value: number; freq: "monthly" | "yearly" } | null {
  if (planCode.endsWith("_monthly")) return { type: "months", value: 1, freq: "monthly" };
  if (planCode.endsWith("_yearly")) return { type: "months", value: 12, freq: "yearly" };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN_TEST");

    if (!mpToken) {
      return new Response(JSON.stringify({ error: "MercadoPago not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims as any).email as string | undefined;

    const body = await req.json().catch(() => ({}));
    const planCode = String(body.plan_code || body.planCode || "");
    const allowed = ["plus_monthly", "plus_yearly", "pro_monthly", "pro_yearly"];
    if (!allowed.includes(planCode)) {
      return new Response(JSON.stringify({ error: "Invalid plan_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const freq = billingFor(planCode)!;

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve plan
    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("id, code, name, price_cents, currency")
      .eq("code", planCode)
      .eq("is_active", true)
      .maybeSingle();

    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ts = Date.now();
    const externalReference = `mhh:${userId}:${plan.id}:${ts}`;

    // Resolve localized price for Mercado Pago (provider/country/currency-specific).
    // Default country = AR (only market currently supported via MP). Overridable via env.
    const countryCode = (Deno.env.get("MERCADOPAGO_COUNTRY") || "AR").toUpperCase();
    const mpCurrency = (Deno.env.get("MERCADOPAGO_CURRENCY") || "ARS").toUpperCase();

    const { data: localized, error: localizedErr } = await admin
      .from("localized_plan_prices")
      .select("amount, currency_id, country_code, billing_period")
      .eq("provider", "mercadopago")
      .eq("country_code", countryCode)
      .eq("currency_id", mpCurrency)
      .eq("plan_id", plan.id)
      .eq("billing_period", freq.freq)
      .eq("is_active", true)
      .maybeSingle();

    if (localizedErr || !localized) {
      console.error("[mp-create-subscription] No localized price for", {
        provider: "mercadopago", countryCode, mpCurrency, plan_code: planCode, billing_period: freq.freq,
      }, localizedErr);
      return new Response(
        JSON.stringify({
          error: "Localized price not configured",
          message: `No price for ${planCode} in ${countryCode}/${mpCurrency} via mercadopago`,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transactionAmount = Number(Number(localized.amount).toFixed(2));

    // Allow forcing a MP test buyer email (sandbox) when configured.
    const testPayerEmail = Deno.env.get("MERCADOPAGO_TEST_PAYER_EMAIL") || undefined;
    const payerEmail = testPayerEmail || userEmail;

    const origin = req.headers.get("origin") || "https://myhealthhub.fenixsoular.com.ar";
    const backUrl = `${origin}/pricing?mp_status=success`;

    const mpPayload: Record<string, unknown> = {
      reason: `My Health Hub — ${plan.name}`,
      external_reference: externalReference,
      payer_email: payerEmail,
      back_url: backUrl,
      auto_recurring: {
        frequency: freq.value,
        frequency_type: freq.type,
        transaction_amount: transactionAmount,
        currency_id: mpCurrency,
      },
      status: "pending",
    };

    console.log("[mp-create-subscription] payload:", JSON.stringify({
      ...mpPayload,
      payer_email: payerEmail ? "***" : null,
    }));

    const mpRes = await fetch(`${MP_API}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mpPayload),
    });

    const mpJson = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      console.error("[mp-create-subscription] MP error:", mpRes.status, JSON.stringify(mpJson));
      // Audit failure
      try {
        await admin.from("billing_events").insert({
          provider: "mercadopago",
          event_type: "preapproval.create_failed",
          user_id: userId,
          payload: { request: mpPayload, response: mpJson, http_status: mpRes.status },
          processed: true,
          error: mpJson?.message || `HTTP ${mpRes.status}`,
        });
      } catch (_) { /* ignore */ }

      return new Response(
        JSON.stringify({
          error: "MercadoPago error",
          status: mpRes.status,
          message: mpJson?.message || "unknown",
          cause: mpJson?.cause || mpJson?.error || null,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const preapprovalId = mpJson.id as string;
    const initPoint = (mpJson.init_point || mpJson.sandbox_init_point) as string;

    // Upsert subscription as pending (provider=mercadopago)
    await admin.from("subscriptions").insert({
      user_id: userId,
      plan_id: plan.id,
      provider: "mercadopago",
      status: "pending",
      external_reference: externalReference,
      mercadopago_preapproval_id: preapprovalId,
      payer_email: payerEmail,
      currency: mpCurrency.toLowerCase(),
      amount_cents: plan.price_cents,
      billing_frequency: freq.freq,
      raw_payload: mpJson,
    });

    await admin.from("billing_events").insert({
      provider: "mercadopago",
      event_type: "preapproval.created",
      external_id: preapprovalId,
      user_id: userId,
      payload: mpJson,
      processed: true,
    });

    return new Response(JSON.stringify({ init_point: initPoint, preapproval_id: preapprovalId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[mp-create-subscription] Unexpected:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
