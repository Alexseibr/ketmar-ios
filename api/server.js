import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS для локальной разработки
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// === CATEGORIES ===

// GET все категории
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать категорию
app.post('/api/categories', async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT обновить категорию
app.put('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE удалить категорию
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === PRODUCTS ===

// GET все товары
app.get('/api/products', async (req, res) => {
  try {
    const { categoryId, status, limit = 50 } = req.query;
    const filter = {};
    
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET товар по ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать товар
app.post('/api/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT обновить товар
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE удалить товар
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST поиск товаров
app.post('/api/products/search', async (req, res) => {
  try {
    const { query } = req.body;
    const products = await Product.find(
      { $text: { $search: query }, status: 'active' }
    ).populate('categoryId').limit(20);
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === ORDERS ===

// GET заказы пользователя
app.get('/api/orders/:telegramId', async (req, res) => {
  try {
    const orders = await Order.find({ telegramId: req.params.telegramId })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать заказ
app.post('/api/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT обновить статус заказа
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === STATS ===

// GET статистика
app.get('/api/stats', async (req, res) => {
  try {
    const [totalProducts, activeListings, totalOrders] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
    ]);

    const orders = await Order.find({ status: { $in: ['confirmed', 'completed'] } });
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      totalProducts,
      activeListings,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === USERS ===

// POST создать или найти пользователя
app.post('/api/users', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body;
    
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      user = await User.create({
        telegramId,
        username,
        firstName,
        lastName,
      });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
