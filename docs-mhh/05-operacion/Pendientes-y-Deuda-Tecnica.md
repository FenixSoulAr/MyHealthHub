# Pendientes y Deuda Técnica

## Cleanup QA post-F-09

- **Relacionado:** F-09 (resuelto)
- **Estado:** Cleanup de entorno de prueba pendiente a conveniencia.
- **Items:**
  - Revisar/cancelar subscriptions de prueba que pudieran renovar con cargo real.
  - Revisar customer de prueba `cus_UTQRNDrhFAEyh3` si corresponde limpiar.
  - Limpiar usuarios QA solo si se decide hacerlo.

## Alineación de entornos Supabase (Lovable vs producción Stripe)

- **Supabase productivo actual:** `kxkofzxfpqvpojyeguie` (independiente, fuera de Lovable Cloud).
- **Lovable Cloud vinculado al repo:** `pwwadvtoabvqvnjkcvjr` (entorno viejo/desalineado, NO productivo para Stripe).
- **Acción pendiente:**
  - Decidir a futuro si se unifica el entorno productivo a Lovable Cloud o se mantiene Supabase independiente, para evitar la desalineación actual.

## MercadoPago AR (placeholder UI)

- **Contexto:** UX de pricing rediseñada el 2026-05-07 deja MercadoPago visible como "Próximamente" en `PaymentMethodSelectorModal`.
- **Pendiente:**
  - Integrar MercadoPago AR como tercer gateway web (hook + edge function + webhook).
  - Activar la opción en el modal cuando el flujo esté listo.
  - Mantener Google Play Billing exclusivo en Android nativo.
