import {
  canCancelOrder,
  canReturnOrder,
  hasTracking,
  isValidSupplierRating,
  returnStatusLabel,
  returnTypeLabel,
  type OrderDetail,
  type OrderSummary,
  type ReturnRequest,
  type SupplierRatingResult,
} from '@/core/models/order.model';
import { toCamel } from '@/core/utils/snake-camel';

const rawSummary = {
  id: 10,
  order_number: 'ORD-0001',
  status: 'shipped',
  payment_status: 'paid',
  payment_method: 'card',
  segment: 'basicos',
  total: '1250.50',
  items_count: 2,
  created_at: '2026-09-10T18:00:00Z',
  tracking: {
    carrier: 'DHL',
    number: 'TRK-123',
    timeline: [
      { key: 'requested', label: 'Solicitado', completed: true, current: false },
      { key: 'shipped', label: 'Enviado', completed: true, current: true },
    ],
  },
  supplier_rating: {
    can_rate: true,
    has_rated: false,
    rating: null,
  },
};

const rawDetail = {
  ...rawSummary,
  subtotal: '1100.00',
  shipping_cost: '99.00',
  discount_amount: '50.00',
  coupon_code: 'TAGS50',
  payment_due_at: null,
  payment_instructions: { method: 'card', amount: 1250.5 },
  shipping_address: {
    street: 'Av. Juárez 123',
    city: 'Ciudad de México',
    state: 'Ciudad de México',
    zip: '06600',
    neighborhood: 'Juárez',
  },
  items: [
    {
      product_name: 'Playera Negra',
      size: 'M',
      color: 'Negro',
      quantity: 2,
      unit_price: '550.00',
      total_price: '1100.00',
    },
  ],
};

describe('order.model', () => {
  it('OrderSummary expone claves camelCase del paginator (snake → toCamel)', () => {
    const summary = toCamel<OrderSummary>(rawSummary);

    expect(summary.id).toBe(10);
    expect(summary.orderNumber).toBe('ORD-0001');
    expect(summary.status).toBe('shipped');
    expect(summary.paymentStatus).toBe('paid');
    expect(summary.paymentMethod).toBe('card');
    expect(summary.segment).toBe('basicos');
    expect(summary.total).toBe('1250.50');
    expect(summary.itemsCount).toBe(2);
    expect(summary.createdAt).toBe('2026-09-10T18:00:00Z');
    expect(summary.tracking.carrier).toBe('DHL');
    expect(summary.tracking.number).toBe('TRK-123');
    expect(summary.tracking.timeline).toHaveLength(2);
    expect(summary.supplierRating.canRate).toBe(true);
    expect(summary.supplierRating.hasRated).toBe(false);
    expect(summary.supplierRating.rating).toBeNull();
  });

  it('OrderDetail mapea totales, dirección e items', () => {
    const detail = toCamel<OrderDetail>(rawDetail);

    expect(detail.subtotal).toBe('1100.00');
    expect(detail.shippingCost).toBe('99.00');
    expect(detail.discountAmount).toBe('50.00');
    expect(detail.couponCode).toBe('TAGS50');
    expect(detail.paymentDueAt).toBeNull();
    expect(detail.shippingAddress?.zip).toBe('06600');
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0]).toMatchObject({
      productName: 'Playera Negra',
      size: 'M',
      color: 'Negro',
      quantity: 2,
      unitPrice: '550.00',
      totalPrice: '1100.00',
    });
  });

  it('tracking.timeline tolera null sin romper', () => {
    const summary = toCamel<OrderSummary>({
      ...rawSummary,
      tracking: { carrier: null, number: null, timeline: null },
    });

    expect(summary.tracking.timeline).toBeNull();
    expect(hasTracking(summary.tracking)).toBe(false);
  });

  it('supplierRating.rating expone stars/comment/createdAt cuando existe', () => {
    const summary = toCamel<OrderSummary>({
      ...rawSummary,
      supplier_rating: {
        can_rate: false,
        has_rated: true,
        rating: { stars: 5, comment: 'Excelente', created_at: '2026-09-11T00:00:00Z' },
      },
    });

    expect(summary.supplierRating.rating).toEqual({
      stars: 5,
      comment: 'Excelente',
      createdAt: '2026-09-11T00:00:00Z',
    });
  });

  it('hasTracking es true cuando hay carrier, number o timeline con pasos', () => {
    expect(hasTracking(null)).toBe(false);
    expect(hasTracking(undefined)).toBe(false);
    expect(hasTracking({ carrier: null, number: null, timeline: [] })).toBe(false);
    expect(hasTracking({ carrier: 'DHL', number: null, timeline: null })).toBe(true);
    expect(hasTracking({ carrier: null, number: 'TRK', timeline: null })).toBe(true);
    expect(
      hasTracking({
        carrier: null,
        number: null,
        timeline: [{ key: 'shipped', label: 'Enviado', completed: true, current: true }],
      }),
    ).toBe(true);
  });
});

const rawReturn = {
  id: 7,
  folio: 'RET-7',
  type: 'return',
  order_number: 'ORD-0001',
  order_status: 'delivered',
  reason: 'Producto dañado',
  description: 'Llegó roto',
  status: 'requested',
  resolution_notes: null,
  created_at: '2026-09-11T10:00:00Z',
  resolved_at: null,
};

describe('order.model — ReturnRequest (M4.2)', () => {
  it('ReturnRequest mapea el contrato camelCase de ReturnRequestService::format', () => {
    const request = toCamel<ReturnRequest>(rawReturn);

    expect(request.id).toBe(7);
    expect(request.folio).toBe('RET-7');
    expect(request.type).toBe('return');
    expect(request.orderNumber).toBe('ORD-0001');
    expect(request.orderStatus).toBe('delivered');
    expect(request.reason).toBe('Producto dañado');
    expect(request.description).toBe('Llegó roto');
    expect(request.status).toBe('requested');
    expect(request.resolutionNotes).toBeNull();
    expect(request.createdAt).toBe('2026-09-11T10:00:00Z');
    expect(request.resolvedAt).toBeNull();
  });

  it('ReturnRequest tolera order/description/resolutionNotes nulos', () => {
    const request = toCamel<ReturnRequest>({
      ...rawReturn,
      order_number: null,
      order_status: null,
      description: null,
      resolution_notes: 'Cancelación automática',
    });

    expect(request.orderNumber).toBeNull();
    expect(request.orderStatus).toBeNull();
    expect(request.description).toBeNull();
    expect(request.resolutionNotes).toBe('Cancelación automática');
  });

  it('canCancelOrder permite cualquier estado distinto de cancelled', () => {
    expect(canCancelOrder('paid')).toBe(true);
    expect(canCancelOrder('pending')).toBe(true);
    expect(canCancelOrder('shipped')).toBe(true);
    expect(canCancelOrder('cancelled')).toBe(false);
    expect(canCancelOrder(null)).toBe(true);
  });

  it('canReturnOrder oculta la devolución en cancelled y pending', () => {
    expect(canReturnOrder('paid')).toBe(true);
    expect(canReturnOrder('shipped')).toBe(true);
    expect(canReturnOrder('delivered')).toBe(true);
    expect(canReturnOrder('pending')).toBe(false);
    expect(canReturnOrder('cancelled')).toBe(false);
  });

  it('returnTypeLabel y returnStatusLabel traducen y caen al valor crudo', () => {
    expect(returnTypeLabel('return')).toBe('Devolución');
    expect(returnTypeLabel('cancellation')).toBe('Cancelación');
    expect(returnStatusLabel('requested')).toBe('Solicitada');
    expect(returnStatusLabel('approved')).toBe('Aprobada');
    expect(returnStatusLabel('rejected')).toBe('Rechazada');
    expect(returnStatusLabel('refunded')).toBe('Reembolsada');
    expect(returnStatusLabel('otro')).toBe('otro');
  });
});

const rawRatingResponse = {
  message: 'Gracias por calificar al proveedor',
  rating: {
    id: 3,
    rating: 4,
    comment: 'Buen servicio',
    created_at: '2026-09-11T12:00:00Z',
    verified_purchase: true,
    customer_label: 'Cliente verificado',
  },
  supplier_rating: {
    can_rate: true,
    has_rated: true,
    rating: { stars: 4, comment: 'Buen servicio', created_at: '2026-09-11T12:00:00Z' },
  },
};

describe('order.model — SupplierRating (M4.3)', () => {
  it('AC6: SupplierRatingResult mapea el 201 con rating público y supplier_rating', () => {
    const result = toCamel<SupplierRatingResult>(rawRatingResponse);

    expect(result.message).toBe('Gracias por calificar al proveedor');
    expect(result.rating.id).toBe(3);
    expect(result.rating.rating).toBe(4);
    expect(result.rating.comment).toBe('Buen servicio');
    expect(result.rating.createdAt).toBe('2026-09-11T12:00:00Z');
    expect(result.rating.verifiedPurchase).toBe(true);
    expect(result.rating.customerLabel).toBe('Cliente verificado');
    expect(result.supplierRating.hasRated).toBe(true);
    expect(result.supplierRating.rating?.stars).toBe(4);
  });

  it('AC3: isValidSupplierRating acepta enteros 1..5 y rechaza fuera de rango/no enteros', () => {
    expect(isValidSupplierRating(1)).toBe(true);
    expect(isValidSupplierRating(3)).toBe(true);
    expect(isValidSupplierRating(5)).toBe(true);

    expect(isValidSupplierRating(0)).toBe(false);
    expect(isValidSupplierRating(6)).toBe(false);
    expect(isValidSupplierRating(-1)).toBe(false);
    expect(isValidSupplierRating(4.5)).toBe(false);
    expect(isValidSupplierRating(Number.NaN)).toBe(false);
  });
});
