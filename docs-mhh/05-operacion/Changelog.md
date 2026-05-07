# Changelog

## 2026-05-07 — UX Pricing

### UX/UI

- Rediseño completo de `src/pages/Pricing.tsx` con look premium minimal.
- Nuevos componentes: `PricingPlanCard`, `PricingComparison`, `PaymentMethodSelectorModal`.
- Flujo en dos pasos: el usuario primero elige el plan y luego selecciona el medio de pago.
- En web/PWA, el modal de pago ofrece PayPal, Tarjeta (Stripe) y MercadoPago como "Próximamente" (placeholder, sin lógica).
- En Android nativo se conserva Google Play Billing exclusivo (sin selector web).
- La tabla comparativa pasó a un `Collapsible` secundario ("Ver comparación completa").
- Bilingüe ES/EN. Sin cambios en planes, precios ni price IDs.
- Sin cambios en hooks de checkout: `useStripeCheckout`, `usePayPalCheckout`, `useGooglePlayCheckout` intactos.

## 2026-05-07

### Fix

- Fix Stripe webhook productivo (F-09).
- Webhook validado con `HTTP 200 OK`; evento `evt_1TUTaGKDVbPJQ8VfZK1HbBgL` procesado correctamente.
- Subscription Stripe creada/actualizada en Supabase:
  - id: `9d7e490c-c4c0-4aa8-877e-5ef02e98e179`
  - stripe_subscription_id: `sub_1TUTaBKDVbPJQ8Vf9AJrIp8X`
  - status: `active`
- Stripe LLC queda reconectado como alternativa web para pago con tarjeta.
- PayPal LLC sigue como método web principal.
- Google Play Billing sigue exclusivo en Android nativo.
- Se corrigió la verificación de firma del webhook de Stripe para el incidente F-09 (`HTTP 400 Invalid signature`).
- El webhook ahora limpia `STRIPE_WEBHOOK_SECRET` con `.trim()`, mantiene lectura raw con `await req.text()` y valida con `constructEventAsync(...)`.
- Se agregaron logs diagnósticos temporales sin exposición de secrets ni body.
- Se preservó la lógica de negocio existente: altas, actualizaciones, cancelaciones/downgrade, idempotencia, grace period y compatibilidad con períodos en `subscription.items.data[0]` con fallback al nivel raíz.
