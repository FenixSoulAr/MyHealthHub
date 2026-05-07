# Pricing y Planes

## Arquitectura de cobro por canal

- **Web:** PayPal LLC se mantiene como método principal. Stripe LLC se ofrece como alternativa para pago con tarjeta sin cuenta de PayPal.
- **Argentina:** MercadoPago AR queda previsto como integración futura.
- **Android nativo / Google Play:** Google Play Billing debe mantenerse como canal exclusivo por compliance.
- **Planes y price IDs:** No se modificaron planes ni price IDs en la corrección F-09.

## Incidente F-09

- La corrección se limitó al webhook de Stripe y no cambia la arquitectura comercial vigente.
- Estado: diagnóstico/corrección aplicada, pendiente test E2E con cupón fresco.
