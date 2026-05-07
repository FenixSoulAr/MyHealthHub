# Pricing y Planes

## Arquitectura de cobro por canal

- **Web — PayPal LLC:** Método principal de pago en web.
- **Web — Stripe LLC:** Alternativa web operativa para pago con tarjeta sin cuenta de PayPal.
- **Argentina:** MercadoPago AR queda previsto como integración futura.
- **Android nativo / Google Play:** Google Play Billing como canal exclusivo por compliance.
- **Planes y price IDs:** No se modificaron planes ni price IDs en la corrección F-09.

## Incidente F-09

- La corrección se limitó al webhook de Stripe y no cambia la arquitectura comercial vigente.
- Estado: Resuelto. Webhook validado con `HTTP 200 OK` el 2026-05-07; Stripe LLC queda operativo como alternativa web.

## UX de selección de plan y medio de pago (2026-05-07)

- La pantalla `Pricing` separa la decisión en dos pasos: (1) elegir plan, (2) elegir medio de pago.
- Web/PWA: el modal `PaymentMethodSelectorModal` ofrece PayPal, Stripe (tarjeta) y MercadoPago como "Próximamente" (sin funcionalidad activa).
- Android nativo: el CTA del plan dispara directamente Google Play Billing; no se muestra el selector web.
- Sin cambios en planes, precios ni price IDs. Sin cambios en lógica comercial ni en hooks de checkout.
