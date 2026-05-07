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
