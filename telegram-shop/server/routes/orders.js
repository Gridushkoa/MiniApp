import express from 'express';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const db = new Database(join(__dirname, '../../bot/shop.db'));

// GET /api/orders - Получение заказов
router.get('/', (req, res) => {
  try {
    const { status, userId } = req.query;
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const orders = db.prepare(query).all(...params);
    
    // Парсим items для каждого заказа
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    res.json(parsedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Получение заказа по ID
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      ...order,
      items: JSON.parse(order.items)
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Создание нового заказа
router.post('/', (req, res) => {
  try {
    const { items, total, customer } = req.body;
    
    if (!items || !total || !customer) {
      return res.status(400).json({ error: 'Items, total, and customer are required' });
    }
    
    const orderId = uuidv4();
    
    db.prepare(`
      INSERT INTO orders (id, items, total, customer_name, customer_phone, customer_address, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      JSON.stringify(items),
      total,
      customer.name,
      customer.phone,
      customer.address,
      customer.comment || ''
    );
    
    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    res.status(201).json({
      ...newOrder,
      items: JSON.parse(newOrder.items)
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PATCH /api/orders/:id/status - Обновление статуса заказа
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    const validStatuses = ['new', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, orderId);
    
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    res.json({
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items)
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;