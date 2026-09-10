# Audit B — Tipos TypeScript del storefront Vue 3

**Generado:** 2026-09-09 (subagente explore)
**Fuente:** `/home/user/code/codeweb/101tags.com-/storefront/src/types/*.ts` (19 archivos) + `api/client.ts`

> Mobile reutiliza estos tipos como espejo exacto, normalizando a camelCase.

---

## 1. Resumen ejecutivo

- **26 interfaces, 12 unions/strings, 4 generics** definidos en `types/*.ts`.
- 10+ tipos inline en `client.ts` que conviene **nombrar en mobile** porque client.ts no existe allí.
- **5 gaps tipográficos** que mobile debe resolver (ver §4).
- **Inconsistencia de naming** (snake vs camel) existente. Mobile fuerza camelCase en sus DTOs con mapper genérico.

---

## 2. Tipos buyer-side espejables al móvil

### `types/cart.ts`
| Tipo | Uso |
|---|---|
| `CartLine` | Línea local antes de sync con server |
| `ServerCartLine extends CartLine` | `+ line_total: number` |
| `CustomerUser` | Devuelto por `/auth/customer/*` |

### `types/catalog.ts`
| Tipo | Forma |
|---|---|
| `Category` | `{id, name, slug, description, image_url, products_count, children?:Category[]}` |
| `ProductVariant` | `{id, size, color, sku, stock, in_stock, price, price_override:number\|null}` |
| `ProductSummary` | Lista: `{id, name, slug, supplier_id, base_price, min_price, max_price, image, images, category, subcategory, is_featured, is_on_sale, compare_at_price, in_stock, total_stock, available_sizes, available_colors}` |
| `ProductDetail extends ProductSummary` | `+ description, variants` |
| `Paginated<T>` | genérico offset-based: `{data, current_page, last_page, per_page, total}` |
| `FilterOptions` | `{sizes, colors, price_min, price_max, categories?, subcategories?}` |
| `CatalogFilters` | request con q, category, subcategory, sizes, colors, price_min, price_max, sort, etc. |

### `types/payment.ts` (NÚCLEO CRÍTICO)
| Tipo | Forma |
|---|---|
| `PaymentMethod` | `'card' \| 'oxxo' \| 'spei'` |
| `PaymentInstructions` | `{type?, method?, reference?, barcode_url?, paybin_reference?, clabe?, bank?, agreement?, recipient_name?, account_holder?, supplier_name?, oxxo_reference?, instructions?, due_at?, amount?, demo?}` — **todos opcionales/nullables** |
| `CheckoutOrderResult` | `{order_number, total, status, payment_status, payment_method, payment_due_at?, payment_instructions?, coupon_code?, discount_amount?, openpay_charge_id?}` |
| `CheckoutConfig` | Shape de `/checkout/config` (ver §`PaymentMethods: {card,oxxo,spei}` boolean) |

### `types/order.ts`
| Tipo | Forma |
|---|---|
| `TrackingStep` | `{key, label, completed, current}` |
| `OrderSupplierRatingInfo` | `{can_rate, has_rated, rating:{stars,comment,created_at}\|null}` |
| `OrderSummary` | `{id, order_number, status, payment_status, payment_method, segment, total, items_count, created_at, tracking:{carrier, number, timeline}, supplier_rating?}` |
| `OrderItem` | `{product_name, size, color, quantity, unit_price, total_price}` |
| `OrderDetail extends OrderSummary` | `+ subtotal, shipping_cost, discount_amount, coupon_code, payment_due_at, payment_instructions, shipping_address, items[]` |

### `types/conversation.ts`
| Tipo | Forma |
|---|---|
| `ConversationSummary` | `{order_number, order_status, order_total, order_created_at, last_message\|null}` |
| `ConversationAttachment` | `{id, original_name, mime_type, size, download_url}` |
| `ConversationMessage` | `{id, body, sender_role, sender_name, is_mine, created_at, type?, metadata?, attachments?}` |
| `OrderConversationDetail` | Wrapper que incluye `viewer_role`, `can_confirm_payment`, `policy`, `messages[]` |

### `types/returns.ts`
| Tipo | Forma |
|---|---|
| `ReturnType` | `'return' \| 'cancellation'` |
| `ReturnApiStatus` | `'requested' \| 'approved' \| 'rejected' \| 'refunded'` |
| `ReturnRequestDto` | `{id, folio, type, order_number, order_status?, reason, description, status, resolution_notes, created_at, resolved_at}` |

### `types/coupon.ts`
| Tipo | Forma |
|---|---|
| `CouponIssuer` | `'platform' \| 'store'` |
| `CouponDiscountType` | `'percent' \| 'fixed' \| 'shipping'` |
| `CouponSegment` | `'basicos' \| 'industrial'` |
| `CouponDefinition` | `{id:string, code, issuer, title, description, discountType, value, minSubtotal?, segment?, storeSlug?, storeName?, assignedEmails?, expiresAt?, oneTime?, keywords?}` — **camelCase puro** |
| `CouponApplyResult` | `{valid, message, coupon?, discountAmount, shippingDiscount, eligibleSubtotal}` |

### `types/postal.ts`
| Tipo | Forma |
|---|---|
| `PostalSettlement` | `{name, type:string\|null}` |
| `PostalCodeLookup` | `{postal_code, state, state_code, municipality, city, settlements}` |

### `types/footer.ts`
| Tipo | Forma |
|---|---|
| `FooterLink` | `{label, url}` |
| `FooterGroup` | `{title, links[]}` |
| `FooterContent` | `{groups[], legal[]}` |

### `types/homeContent.ts` (PÚBLICA buyer-side)
| Tipo | Forma |
|---|---|
| `HomeContentPlacement` | `'hero' \| 'featured_category' \| 'featured_media' \| 'ribbon'` |
| `HomeContentType` | `'image' \| 'video' \| 'animation'` |
| `HomeContentItem` | `{id, placement, type, image, video, poster, alt, link, size, category, title, subtitle, sort_order, starts_at?, ends_at?}` |
| `HomeContentByPlacement` | `{hero[], featured_category[], featured_media[], ribbon[]}` |

`AdminHomeContentRow extends HomeContentItem` (NO espejar: admin-only).

### `types/supplierAds.ts` (buyer-side subset)
| Tipo | Forma |
|---|---|
| `SponsoredAdItem` | `{ad_id, title, placement?:SupplierAdPlacement\|null, product:ProductSummary}` |

### `types/supplierStore.ts` (buyer-side subset)
| Tipo | Forma |
|---|---|
| `SupplierStore` | Mezcla camelCase (heroImage, reviewCount) + snake_case (is_published, store_access). Mobile fuerza todo a camelCase. |
| `SupplierStoreSegment` | `'basicos' \| 'industrial'` |

### `types/service.ts` (segmento servicios, opcional MVP)
Lista completa de `ServiceSummary`, `ServiceDetail`, `ServiceProviderDetail`, `ServiceArea`, `ServiceModality`, `ServicePricingModel`, etc. **MVP mobile se enfoca en `segment=basicos`**, por lo que puede diferirse a v2.

---

## 3. Tipos inline en `client.ts` que mobile debe nombrar

| Endpoint | Tipo actual | Mobile debe crear |
|---|---|---|
| `requestCheckoutOrders` | anónimo grande | `RequestOrdersRequest`, `RequestOrdersResponse` (con `purchase_number`, `access_token`, `idempotent_replay?`, `orders[]`, `house_payment\|null`) |
| `getGuestPurchase` | anónimo | `GuestPurchaseView` |
| `getPaymentInstructions` | anónimo | `PaymentInstructionsView` |
| `uploadPaymentProof` | anónimo | `PaymentProofResponse` |
| `getNotifications` | anónimo con `unread_count` | `NotificationsResponse` |
| `suppliers/maquila-contact` | anónimo `{email\|null, whatsapp\|null, phone\|null, schedule\|null}` | `MaquilaContact` |
| `simulateCheckoutPayment`, `checkoutDemoOrder` | anónimos | `CheckoutSimulationResult` (envuelve `CheckoutOrderResult`) |
| `claimGuestPurchase` | `{message, data:{purchase_number, claimed}}` | `ClaimGuestResponse` |
| `getMaquilaContact` | anónimo | (NO buyer-side; admin) |

---

## 4. Gaps tipográficos — mobile crea sus propios DTOs

Estos no existen en storefront pero los necesita mobile:

1. **`LaravelErrorPayload`**:
   ```ts
   {message?: string; errors?: Record<string, string[] | string>}
   ```
   Para interceptar 422 / extraer `errors[field][0]`.

2. **`Address`**:
   ```ts
   interface Address {
     street: string;
     city: string;
     state: string;
     zip: string;
     neighborhood?: string | null;
   }
   ```
   Reemplaza el `Record<string, string>` actual.

3. **`Banner`** = `HomeContentItem` (endpoint `/api/banners` devuelve la misma forma que `/api/home-content` items).

4. **`CheckoutPolicies`**:
   ```ts
   {manual_payment_disclaimer: string; mediation_window_hours: number; whatsapp_enabled: boolean}
   ```

5. **`SupplierRatingListPage`**:
   ```ts
   Paginated<{
     id: number;
     rating: 1 | 2 | 3 | 4 | 5;
     comment: string | null;
     created_at: string;
     verified_purchase: true;
     customer_label: string;
   }>
   ```

6. **`HealthResponse`** (opcional pero útil para splash):
   ```ts
   {status:"ok"; app:"101tags"; version:string; demo_mode:boolean; payment_mode:"openpay"|"demo"; mail:{enabled,mailer,from,queue,production_ready}}
   ```

---

## 5. Patrones observados (decisiones mobile)

### Naming
- **Snake_case** predomina (Laravel raw).
- **Excepciones camelCase** intencionales: `CouponDefinition` (wrapper cliente), `SupplierStore` (parcial), `HomeContentItem` (parcial).
- **Decisión mobile: forzar todo camelCase en DTOs.** Mapper genérico `snakeToCamel(obj)` con `{ deep: true, exclude: ['payment_instructions'] }`.

### Optionalidad
- `: T | null` = campo viene siempre, pero nullable.
- `?` = campo puede no llegar.
- `?: T | null` = ambos casos.

### Paginación
- **Offset-based** (`?page=N&per_page=K`).
- **Endoints paginados buyer:** `/catalog/products` (12), `/services` (12), `/orders` (10 hardcoded), `/suppliers/{id}/ratings` (10), `/return-requests` (20).
- **No paginados:** `/conversations` (límite fijo 50), `/orders/{n}/messages`, `/notifications` (30 hardcoded), `/cart`, `/catalog/categories`, `/orders/{n}`.

### Tipos de dinero
- **Buyer-side todo `number`.**
- Supplier billing mezcla `string | number`. Mobile normaliza con `parseFloat`.

### Tipos de imagen
- Single: `string | null`.
- Gallery: `Array<{path: string; url: string | string | null}>` (variabilidad entre archivos, pero estructural).
- Adjuntos descargables: `ConversationAttachment.download_url`.

### Fechas
- **Siempre `string` ISO 8601.** Sin `Date`. Mobile puede parsear con `new Date(iso)` cuando lo necesite mostrar.

---

## 6. Tipos NO espejables (supplier-only o admin)

Estos NO entran en la app del comprador:

- `types/csf.ts` (sólo registro de proveedor)
- `types/quote.ts` (sólo admin)
- `types/commission.ts` (supplier)
- `types/supplier.ts` (completo, supplier)
- `types/supplierBilling.ts` (supplier)
- `types/supplierPayment.ts` (supplier)
- `AdminHomeContentRow` (admin)
- `SupplierPublication`, `SupplierAdsDashboard` admin (supplier/admin)
- Datos estáticos en `src/data/*` (UI state, no HTTP)
- Tipos inline en `<script setup>` (Vue state, no contrato)

---

## 7. Lista de DTOs a crear en M0.4 (mobile)

| Path | Contenido |
|---|---|
| `core/models/common.model.ts` | `Paginated<T>`, `ISODateString`, `ApiError`, `LaravelErrorPayload` |
| `core/models/address.model.ts` | `Address` |
| `core/models/auth.model.ts` | `CustomerUser`, `LoginRequest`, `RegisterRequest`, `AuthResponse`, `ForgotPasswordRequest`, `ResetPasswordRequest` |
| `core/models/cart.model.ts` | `CartLine`, `ServerCartLine`, `Cart` |
| `core/models/catalog.model.ts` | `Category`, `ProductVariant`, `ProductSummary`, `ProductDetail`, `FilterOptions`, `CatalogFilters`, `SponsoredAdItem`, `SupplierStore`, `SupplierStoreSegment`, `SupplierRatingListPage`, `Banner` (= `HomeContentItem`) |
| `core/models/home-content.model.ts` | `HomeContentPlacement`, `HomeContentType`, `HomeContentItem`, `HomeContentByPlacement`, `HomeContentResponse` (discriminado) |
| `core/models/order.model.ts` | `TrackingStep`, `OrderSupplierRatingInfo`, `OrderSummary`, `OrderItem`, `OrderDetail`, `OrdersPage`, `RatingRequest` |
| `core/models/payment.model.ts` | `PaymentMethod`, `PaymentInstructions`, `CheckoutOrderResult`, `CheckoutConfig`, `CheckoutPolicies`, `PaymentProofResponse`, `PaymentInstructionsView`, `HealthResponse` |
| `core/models/checkout.model.ts` | `RequestOrdersRequest`, `RequestOrdersResponse`, `GuestPurchaseView`, `ClaimGuestRequest`, `ClaimGuestResponse`, `CheckoutSimulationResult`, `IdempotencyKey` (helper) |
| `core/models/conversation.model.ts` | `ConversationSummary`, `ConversationAttachment`, `ConversationMessage`, `OrderConversationDetail` |
| `core/models/returns.model.ts` | `ReturnType`, `ReturnApiStatus`, `ReturnRequestDto`, `ReturnRequestForm` |
| `core/models/coupon.model.ts` | `CouponIssuer`, `CouponDiscountType`, `CouponSegment`, `CouponDefinition`, `CouponApplyResult`, `AppliedCoupon`, `CouponValidateRequest` |
| `core/models/notification.model.ts` | `Notification`, `NotificationsResponse` |
| `core/models/postal-code.model.ts` | `PostalSettlement`, `PostalCodeLookup` |
| `core/models/footer.model.ts` | `FooterLink`, `FooterGroup`, `FooterContent` |
| `core/models/quote.model.ts` | `QuoteRequest`, `QuoteResponse` (`{folio, status:"nueva"}`) |

Total ~17 archivos, ~50 interfaces.
