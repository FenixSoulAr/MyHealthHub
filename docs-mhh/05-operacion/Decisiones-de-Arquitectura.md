# Decisiones de Arquitectura

## 2026-05-07 — UX selección de plan + medio de pago

**Decisión:** La selección del plan y la selección del medio de pago se separan en dos pasos para mejorar claridad, escalabilidad y preparación para múltiples gateways (PayPal, Stripe y futuro MercadoPago), manteniendo Google Play Billing exclusivo en Android nativo.

**Implementación:**
- `src/pages/Pricing.tsx` muestra cards de planes (Free / Plus / Pro) sin disparar pasarela al hacer clic.
- En web/PWA, el CTA abre `PaymentMethodSelectorModal` (Dialog en desktop, Drawer en mobile) con PayPal, Stripe y MercadoPago (placeholder "Próximamente").
- En Android nativo, el CTA dispara directamente `useGooglePlayCheckout` por compliance.
- Tabla comparativa movida a un `Collapsible` secundario.

## Validación del rediseño (2026-05-07)

- El rediseño de Pricing fue validado visualmente en producción.
- La pantalla ahora presenta cards limpias de planes, estado de plan actual, flujo en dos pasos y selector de método de pago con PayPal, Stripe/tarjeta y MercadoPago como próximo gateway.
- Stripe Checkout fue probado abriendo correctamente Pro Monthly USD 12.
- No se realizaron cambios en planes, precios, price IDs ni lógica de billing.

**Compatibilidad preservada:** PayPal LLC, Stripe LLC, Google Play Billing. Planes y price IDs sin cambios.
