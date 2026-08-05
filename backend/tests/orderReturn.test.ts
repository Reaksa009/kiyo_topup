const getBalanceMock = jest.fn();

jest.mock('../src/models/Order', () => ({
  Order: { findById: jest.fn() },
  Payment: {}
}));
jest.mock('../src/services/audit.service', () => ({
  AuditService: { log: jest.fn() }
}));
jest.mock('../src/services/providers/ProviderFactory', () => ({
  ProviderFactory: {
    getProvider: () => ({
      getBalance: getBalanceMock
    })
  }
}));

import { Order } from '../src/models/Order';
import { AuditService } from '../src/services/audit.service';
import { OrderController } from '../src/controllers/order.controller';

describe('manual order return / refund', () => {
  const findById = Order.findById as jest.Mock;
  const auditLog = AuditService.log as jest.Mock;

  const response = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    return { json, status };
  };

  beforeEach(() => jest.clearAllMocks());

  test('successfully marks an order as refunded and writes an audit log when G2Bulk has balance', async () => {
    const order = {
      _id: { toString: () => 'order-123' },
      paymentStatus: 'paid',
      overallStatus: 'completed',
      save: jest.fn().mockResolvedValue(undefined)
    };
    findById.mockResolvedValue(order);
    getBalanceMock.mockResolvedValue({ balance: 50.0 });
    const res = response();

    await OrderController.returnOrder({ params: { orderId: 'order-123' }, user: { id: 'admin-1' }, headers: {} } as any, res as any);

    expect(order.paymentStatus).toBe('refunded');
    expect(order.overallStatus).toBe('refunded');
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(auditLog).toHaveBeenCalledWith('MANUAL_ORDER_RETURN', 'admin', 'admin-1', undefined, undefined, { orderId: 'order-123' });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Order successfully returned and marked as refunded' });
  });

  test('fails if G2Bulk has no balance', async () => {
    const order = {
      _id: { toString: () => 'order-123' },
      save: jest.fn()
    };
    findById.mockResolvedValue(order);
    getBalanceMock.mockResolvedValue({ balance: 0.0 });
    const res = response();

    await OrderController.returnOrder({ params: { orderId: 'order-123' }, headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Cannot return item. G2Bulk provider has insufficient balance.'
    });
    expect(order.save).not.toHaveBeenCalled();
  });

  test('returns 404 if order does not exist', async () => {
    findById.mockResolvedValue(null);
    const res = response();

    await OrderController.returnOrder({ params: { orderId: 'non-existent' }, headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Order not found' });
  });
});
