# Pendientes y Deuda Técnica

## Stripe webhook — verificación E2E pendiente

- **Relacionado:** F-09
- **Estado:** Pendiente test E2E con cupón fresco.
- **Contexto:** Se aplicó corrección de verificación de firma para el webhook de Stripe en producción.
- **Validar:**
  - Pago web con Stripe como alternativa a PayPal.
  - Recepción de `checkout.session.completed` con firma válida.
  - Alta/actualización correcta de la suscripción.
  - Registro de invoice si corresponde.
  - Preservación de PayPal en web y Google Play Billing exclusivo en Android nativo.
- **Cupón sugerido para QA:** `MHHQA300`.
