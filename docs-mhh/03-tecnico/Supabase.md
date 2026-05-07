# Supabase

## Proyectos Supabase — alineación definitiva

- **Supabase productivo actual de My Health Hub:** `kxkofzxfpqvpojyeguie`
  - Dashboard: https://supabase.com/dashboard/project/kxkofzxfpqvpojyeguie
  - Endpoint productivo del webhook Stripe: `https://kxkofzxfpqvpojyeguie.supabase.co/functions/v1/stripe-webhook`
  - Es el proyecto que recibe los eventos reales de Stripe en producción.
  - **Lovable NO tiene acceso directo a este proyecto.** Cualquier verificación de logs, secrets, despliegue de edge functions o queries debe hacerse manualmente desde su Supabase Dashboard o vía Supabase CLI con `--project-ref kxkofzxfpqvpojyeguie`.
- **Proyecto Lovable Cloud vinculado al repo:** `pwwadvtoabvqvnjkcvjr`
  - Corresponde a un entorno viejo / desalineado respecto del Supabase productivo independiente.
  - **No debe usarse para diagnosticar Stripe productivo.**
  - **No debe apuntarse el endpoint de Stripe a este proyecto.**
- **Despliegue del webhook a producción (`kxkofzxfpqvpojyeguie`):** se hace manualmente desde el repo con Supabase CLI:
  ```
  npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref kxkofzxfpqvpojyeguie
  ```
  El flag `--no-verify-jwt` es obligatorio porque Stripe no envía Authorization header.

## Edge Function `stripe-webhook`

- **Incidente relacionado:** F-09 — Stripe webhook devuelve `HTTP 400 Invalid signature` en producción.
- **Estado:** Resuelto. Evento `evt_1TUTaGKDVbPJQ8VfZK1HbBgL` validado con `HTTP 200 OK` el 2026-05-07.
- **Lectura del request:** El webhook debe leer el body raw con `await req.text()` y no usar `req.json()` antes de validar la firma.
- **Header requerido:** `stripe-signature`.
- **Secret:** `STRIPE_WEBHOOK_SECRET` debe obtenerse desde variables de entorno y limpiarse con `.trim()` antes de validar.
- **Validación:** Se prioriza `stripe.webhooks.constructEventAsync(...)` por compatibilidad con Deno / Edge Functions.
- **Logs permitidos:** Solo datos no sensibles como existencia y longitud del header, longitud del body, longitud del secret y mensaje/tipo de error.
- **Logs prohibidos:** No registrar secrets, tokens, claves privadas ni contenido del body.
- **Compatibilidad de negocio preservada:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - Períodos desde `subscription.items.data[0]` con fallback al nivel raíz para compatibilidad con API 2025-02-24.acacia y anteriores.
