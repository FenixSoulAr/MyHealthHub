# Changelog

## 2026-05-07

### Fix

- Se corrigió la verificación de firma del webhook de Stripe para el incidente F-09 (`HTTP 400 Invalid signature`).
- El webhook ahora limpia `STRIPE_WEBHOOK_SECRET` con `.trim()`, mantiene lectura raw con `await req.text()` y valida con `constructEventAsync(...)`.
- Se agregaron logs diagnósticos temporales sin exposición de secrets ni body.
- Se preservó la lógica de negocio existente: altas, actualizaciones, cancelaciones/downgrade, idempotencia, grace period y compatibilidad con períodos en `subscription.items.data[0]` con fallback al nivel raíz.
