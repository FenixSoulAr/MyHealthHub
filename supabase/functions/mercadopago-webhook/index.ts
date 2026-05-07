import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_API = "https://api.mercadopago.com";

function mapStatus(mpStatus: string): string {
  switch ((mpStatus || "").toLowerCase()) {
    case "authorized":
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "pending":
      return "pending";
    default:
      return mpStatus || "unknown";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN_TEST");
  const admin = createClient(supabaseUrl, serviceKey);

  let bodyJson: any = {};
  let rawText = "";
  try {
    rawText = await req.text();
    bodyJson = rawText ? JSON.parse(rawText) : {};
  } catch {
    bodyJson = { raw: rawText };
  }

  const url = new URL(req.url);
  const qpType = url.searchParams.get("type") || url.searchParams.get("topic");
  const qpId = url.searchParams.get("id") || url.searchParams.get("data.id");

  const eventType = bodyJson.type || bodyJson.action || qpType || "unknown";
  const dataId = bodyJson?.data?.id || qpId || null;

  // Always log the event first
  const { data: eventRow } = await admin
    .from("billing_events")
    .insert({
      provider: "mercadopago",
      event_type: String(eventType),
      external_id: dataId ? String(dataId) : null,
      payload: { body: bodyJson, query: Object.fromEntries(url.searchParams) },
      processed: false,
    })
    .select("id")
    .single();

  const eventId = eventRow?.id;

  // Only process preapproval-related events
  const isPreapproval =
    String(eventType).includes("preapproval") ||
    String(eventType).includes("subscription");

  if (!isPreapproval || !dataId || !mpToken) {
    if (eventId) {
      await admin
        .from("billing_events")
        .update({ processed: true, error: !mpToken ? "MP token missing" : "Not a preapproval event" })
        .eq("id", eventId);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch the real preapproval state from MP
    const mpRes = await fetch(`${MP_API}/preapproval/${dataId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    const mp = await mpRes.json();

    if (!mpRes.ok) {
      await admin
        .from("billing_events")
        .update({ processed: true, error: `MP fetch failed: ${mpRes.status}`, payload: { body: bodyJson, mp_response: mp } })
        .eq("id", eventId);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = mapStatus(mp.status);
    const externalRef = mp.external_reference as string | undefined;

    // Find subscription
    let subQuery = admin.from("subscriptions").select("id, user_id, plan_id").eq("mercadopago_preapproval_id", String(dataId)).maybeSingle();
    let { data: sub } = await subQuery;
    if (!sub && externalRef) {
      const r = await admin.from("subscriptions").select("id, user_id, plan_id").eq("external_reference", externalRef).maybeSingle();
      sub = r.data;
    }

    const updateFields: Record<string, unknown> = {
      status: newStatus,
      mercadopago_preapproval_id: String(dataId),
      payer_email: mp.payer_email,
      next_payment_date: mp.next_payment_date || null,
      raw_payload: mp,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "active") {
      updateFields.started_at = mp.date_created || new Date().toISOString();
      updateFields.current_period_start = mp.date_created || new Date().toISOString();
    }
    if (newStatus === "cancelled") {
      updateFields.cancelled_at = new Date().toISOString();
      updateFields.cancel_at_period_end = true;
    }

    if (sub) {
      await admin.from("subscriptions").update(updateFields).eq("id", sub.id);
      await admin
        .from("billing_events")
        .update({ processed: true, subscription_id: sub.id, user_id: sub.user_id, payload: { body: bodyJson, mp_response: mp } })
        .eq("id", eventId);
    } else {
      await admin
        .from("billing_events")
        .update({ processed: true, error: "Subscription not found for preapproval", payload: { body: bodyJson, mp_response: mp } })
        .eq("id", eventId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[mp-webhook] error:", err);
    if (eventId) {
      await admin.from("billing_events").update({ processed: true, error: String(err) }).eq("id", eventId);
    }
    // Always 200 so MP doesn't retry forever on internal bugs
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
