import express from 'express';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const db = new Database(join(__dirname, '../../bot/shop.db'));

// GET /api/products - Получение всех товаров
router.get('/', (req, res) => {
  try {
    const { category, active } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (active === 'true') {
      query += ' AND is_active = 1';
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY id DESC';
    
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Получение товара по ID
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Создание нового товара
router.post('/', (req, res) => {
  try {
    const { name, description, price, image, category, is_active } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const result = db.prepare(`
      INSERT INTO products (name, description, price, image, category, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || '',
      price,
      image || '',
      category || '',
      is_active !== undefined ? is_active : 1
    );
    
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Обновление товара
router.put('/:id', (req, res) => {
  try {
    const { name, description, price, image, category, is_active } = req.body;
    const productId = req.params.id;
    
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, image = ?, category = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      price !== undefined ? price : existing.price,
      image !== undefined ? image : existing.image,
      category !== undefined ? category : existing.category,
      is_active !== undefined ? is_active : existing.is_active,
      productId
    );
    
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Удаление товара
router.delete('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    res.json({ message: 'Product deleted successfully', id: productId });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// PATCH /api/products/:id/toggle - Переключение активности товара
router.patch('/:id/toggle', (req, res) => {
  try {
    const productId = req.params.id;
    const product = db.prepare('SELECT is_active FROM products WHERE id = ?').get(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const newStatus = product.is_active ? 0 : 1;
    db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, productId);
    
    res.json({ id: productId, is_active: newStatus });
  } catch (error) {
    console.error('Error toggling product:', error);
    res.status(500).json({ error: 'Failed to toggle product' });
  }
});

export default router;