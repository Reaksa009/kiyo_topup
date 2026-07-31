jest.mock('../src/models/Order', () => ({
  Order: { findById: jest.fn() },
  Payment: {}
}));
jest.mock('../src/queues/orderQueue', () => ({
  orderQueue: { add: jest.fn() }
}));
jest.mock('../src/services/audit.service', () => ({
  AuditService: { log: jest.fn() }
}));

import { Order } from '../src/models/Order';
import { orderQueue } from '../src/queues/orderQueue';
import { AuditService } from '../src/services/audit.service';
import { OrderController } from '../src/controllers/order.controller';

describe('safe manual order retry', () => {
  const findById = Order.findById as jest.Mock;
  const queueAdd = orderQueue.add as jest.Mock;
  const auditLog = AuditService.log as jest.Mock;

  const response = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    return { json, status };
  };

  beforeEach(() => jest.clearAllMocks());

  test('never changes an unpaid order into a paid order', async () => {
    const order = {
      paymentStatus: 'pending',
      providerStatus: 'failed',
      overallStatus: 'failed',
      save: jest.fn()
    };
    findById.mockResolvedValue(order);
    const res = response();

    await OrderController.retryOrder({ params: { orderId: 'order-1' }, headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(order.paymentStatus).toBe('pending');
    expect(order.save).not.toHaveBeenCalled();
    expect(queueAdd).not.toHaveBeenCalled();
  });

  test('does not re-send a completed paid order', async () => {
    const order = {
      paymentStatus: 'paid',
      providerStatus: 'success',
      overallStatus: 'completed',
      save: jest.fn()
    };
    findById.mockResolvedValue(order);
    const res = response();

    await OrderController.retryOrder({ params: { orderId: 'order-2' }, headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(order.save).not.toHaveBeenCalled();
    expect(queueAdd).not.toHaveBeenCalled();
  });

  test('re-queues only a verified paid, incomplete order and writes an audit log', async () => {
    const order = {
      _id: { toString: () => 'order-3' },
      paymentStatus: 'paid',
      providerStatus: 'failed',
      overallStatus: 'failed',
      save: jest.fn().mockResolvedValue(undefined)
    };
    findById.mockResolvedValue(order);
    queueAdd.mockResolvedValue(undefined);
    const res = response();

    await OrderController.retryOrder({ params: { orderId: 'order-3' }, user: { id: 'admin-1' }, headers: {} } as any, res as any);

    expect(order.paymentStatus).toBe('paid');
    expect(order.providerStatus).toBe('processing');
    expect(order.overallStatus).toBe('processing');
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(queueAdd).toHaveBeenCalledWith('fulfill', { orderId: 'order-3' });
    expect(auditLog).toHaveBeenCalledWith('MANUAL_ORDER_RETRY', 'admin', 'admin-1', undefined, undefined, { orderId: 'order-3' });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Order re-queued for provider fulfillment' });
  });
});
