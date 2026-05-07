# Flujos de Usuario

## Selección de plan y método de pago (web/PWA)

1. El usuario entra a `/pricing`.
2. Elige ciclo (mensual/anual) con el toggle.
3. Toca **"Elegir Plus"** o **"Elegir Pro"** en una card.
4. Se abre `PaymentMethodSelectorModal` con resumen del plan elegido.
5. El usuario selecciona un método:
   - **PayPal** → `usePayPalCheckout` → redirección a PayPal.
   - **Tarjeta (Stripe)** → `useStripeCheckout` → redirección a Stripe Checkout.
   - **MercadoPago** → deshabilitado, "Próximamente".
6. Al volver de la pasarela, los entitlements se actualizan vía webhook.

## Selección de plan (Android nativo / Google Play)

1. El usuario entra a `/pricing`.
2. Toca el CTA del plan deseado.
3. Se dispara directamente Google Play Billing (`useGooglePlayCheckout`).
4. No se muestra el selector web (compliance).

## Downgrade

- Plus/Pro → Free: AlertDialog de confirmación → `schedulePlanChange("free")`.
- Pro → Plus: AlertDialog de confirmación → `schedulePlanChange(plusPlanCode)`.
- El plan actual continúa activo hasta el vencimiento.
