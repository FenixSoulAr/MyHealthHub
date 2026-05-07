## Objetivo

Integrar **Mercado Pago Suscripciones (preapproval)** como tercera pasarela web/PWA para los planes Plus y Pro de My Health Hub, en modo **TEST/Sandbox**, sin tocar Stripe, PayPal ni Google Play Billing.

## Alcance

- Solo web/PWA. Android nativo sigue forzado a Google Play Billing.
- Solo planes pagos (Plus, Pro). Free no usa pasarela.
- Reutilizar la tabla `subscriptions` y `plans` existentes (no duplicar). Crear `billing_events` (no existe) para auditoría multi-proveedor.
- Modo TEST primero. Producción queda documentada pero deshabilitada.

## Cambios de base de datos (migración)

### 1. Extender `subscriptions`
La tabla ya tiene: `provider`, `user_id`, `plan_id`, `status`, `current_period_start/end`, `provider_subscription_id`, `raw_*` no existe.

Agregar columnas (todas nullable, sin romper Stripe/PayPal/Google):
- `external_reference text` — identificador `mhh:{user_id}:{plan_id}:{ts}`
- `mercadopago_preapproval_id text` — id del preapproval MP
- `payer_email text`
- `currency text`
- `amount_cents integer`
- `billing_frequency text` — `monthly` / `yearly`
- `started_at timestamptz`
- `next_payment_date timestamptz`
- `cancelled_at timestamptz`
- `raw_payload jsonb`

Índice único parcial sobre `mercadopago_preapproval_id` cuando no es null.

### 2. Crear `billing_events` (nueva)
Auditoría unificada de webhooks de cualquier pasarela.

Columnas: `id uuid PK`, `provider text` (`mercadopago` | `stripe` | `paypal` | `google_play`), `event_type text`, `external_id text` (preapproval_id, payment_id, etc.), `user_id uuid` (nullable), `subscription_id uuid` (nullable, FK a subscriptions), `payload jsonb`, `processed boolean default false`, `error text`, `created_at timestamptz default now()`.

RLS: solo lectura para superadmin; sin acceso cliente directo (insert/update solo desde edge functions con service role).

Índices: `(provider, external_id)`, `(user_id)`, `(created_at desc)`.

## Edge Functions

### 1. `mercadopago-create-subscription`
- `verify_jwt = false` en `config.toml`, validación JWT manual en código (patrón estándar del proyecto).
- Inputs: `{ plan_code: 'plus_monthly' | 'plus_yearly' | 'pro_monthly' | 'pro_yearly' }`.
- Resuelve `plan_id`, `amount`, `currency` desde la tabla `plans`.
- Genera `external_reference = mhh:{user_id}:{plan_id}:{ts}`.
- Llama a `POST https://api.mercadopago.com/preapproval` con `MERCADOPAGO_ACCESS_TOKEN_TEST`.
- Crea fila `pending` en `subscriptions` con provider `mercadopago`.
- Devuelve `{ init_point, preapproval_id }`.

### 2. `mercadopago-webhook`
- `verify_jwt = false`. Endpoint público.
- Inserta el evento crudo en `billing_events` SIEMPRE (antes de procesar).
- Para `topic=preapproval` o `type=subscription_preapproval`: hace GET a `/preapproval/{id}` con el access token para confirmar estado real (no confía en el body).
- Mapea status MP → status interno: `authorized`/`active` → `active`; `paused` → `paused`; `cancelled` → `cancelled`; `pending` → `pending`.
- Actualiza `subscriptions` matched por `mercadopago_preapproval_id` o `external_reference`.
- Marca `billing_events.processed = true` o guarda `error`.
- Responde 200 siempre que el evento se haya guardado (evita reintentos infinitos por errores de lógica).

## Secrets requeridos (el usuario debe cargarlos)

- `MERCADOPAGO_ACCESS_TOKEN_TEST`
- `MERCADOPAGO_PUBLIC_KEY_TEST` (opcional, no se usa en backend)
- `MERCADOPAGO_WEBHOOK_SECRET` (opcional; MP no firma por defecto en preapproval, pero se deja preparado)

Producción (`_PROD`) se cargará en una segunda fase.

## Frontend

### `useMercadoPagoCheckout` hook
- Análogo a `useStripeCheckout` / `usePayPalCheckout`.
- Llama a `supabase.functions.invoke('mercadopago-create-subscription', { body: { plan_code }})`.
- `window.location.href = init_point`.

### `PaymentMethodSelectorModal`
- Activar la card de MercadoPago (quitar "Próximamente").
- Mostrar advertencia: "Disponible para clientes en Argentina y otros países soportados."

### Páginas de retorno
Mercado Pago redirige a 3 URLs (success / pending / failure). Usar query params en `/pricing?mp_status=success|pending|failure` y mostrar toast informativo. La activación real depende del webhook.

## Webhook URL (para configurar en MP)

```
https://kxkofzxfpqvpojyeguie.supabase.co/functions/v1/mercadopago-webhook
```

## Flujo de prueba (TEST)

1. Cargar `MERCADOPAGO_ACCESS_TOKEN_TEST` de la cuenta vendedora de prueba.
2. Crear cuentas de prueba (vendedor y comprador) en https://www.mercadopago.com/developers/panel/test-users.
3. Configurar webhook en el panel del vendedor → URL del webhook → eventos: `subscription_preapproval`.
4. En el sandbox, login con un usuario, ir a Pricing → Plus mensual → "Suscribirme con Mercado Pago".
5. Loguearse con el comprador de prueba, usar tarjeta de prueba MP (APRO 5031 7557 3453 0604, CVV 123, fecha futura).
6. Confirmar redirección a `success`.
7. Verificar en `billing_events` que llegó el webhook y en `subscriptions` que el estado pasó a `active`.

## Lo que NO se toca

- Stripe (`stripe-webhook`, `create-checkout`, `useStripeCheckout`).
- PayPal (`create-paypal-order`, `capture-paypal-order`, `usePayPalCheckout`).
- Google Play Billing (`handle-google-play-billing`, `useGooglePlayCheckout`).
- Planes, precios, price IDs.
- Lógica de entitlements (la activación de Plus/Pro reutiliza el mismo flujo: actualizar `subscriptions.status='active'` con el `plan_id` correcto).

## Entregables al finalizar

1. Tablas modificadas/creadas.
2. Edge functions desplegadas.
3. Lista de secrets a cargar.
4. URL del webhook.
5. Pasos de prueba con usuarios y tarjetas test.
