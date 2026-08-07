import { connectDatabase } from '../config/database';
import { Order } from '../models/Order';
import { ProviderLog } from '../models/Provider';

async function check() {
  await connectDatabase();
  console.log('Connected to MongoDB. Fetching logs...');

  // Fetch last 10 orders
  const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
  console.log('\n--- LAST 10 ORDERS ---');
  if (orders.length === 0) {
    console.log('No orders found.');
  }
  for (const o of orders) {
    console.log(`Order: ${o.orderNumber} | Game: "${o.gameTitle}" | Price: $${o.amount} | Paid: ${o.paymentStatus} | Status: ${o.overallStatus} | ProviderStatus: ${o.providerStatus} | Reason: "${o.failureReason}" | Created: ${o.createdAt}`);
  }

  // Fetch last 10 provider logs
  const logs = await ProviderLog.find().sort({ createdAt: -1 }).limit(10);
  console.log('\n--- LAST 10 PROVIDER LOGS ---');
  if (logs.length === 0) {
    console.log('No provider logs found.');
  }
  for (const l of logs) {
    console.log(`Log: ${l.endpoint} | Status: ${l.statusCode} | Time: ${l.executionTimeMs}ms | Created: ${l.createdAt}`);
    console.log('Request payload:', JSON.stringify(l.requestPayload));
    console.log('Response payload:', JSON.stringify(l.responsePayload));
    console.log('----------------------------------------------------');
  }

  process.exit(0);
}

check();
