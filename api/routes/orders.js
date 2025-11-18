const { Router } = require('express');
const Order = require('../../models/Order.js');
const Ad = require('../../models/Ad.js');

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const {
      buyerTelegramId,
      buyerName,
      buyerUsername,
      buyerPhone,
      items,
      seasonCode,
      comment,
    } = req.body;

    if (!buyerTelegramId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Необходимо указать buyerTelegramId и массив items',
      });
    }

    // Валидация и обогащение данных из объявлений
    const validatedItems = [];
    
    for (const item of items) {
      if (!item.adId) {
        return res.status(400).json({
          message: 'Каждый item должен содержать adId',
        });
      }

      // Получаем актуальные данные из объявления
      const ad = await Ad.findById(item.adId);
      
      if (!ad) {
        return res.status(404).json({
          message: `Объявление с ID ${item.adId} не найдено`,
        });
      }

      if (ad.status !== 'active') {
        return res.status(400).json({
          message: `Объявление "${ad.title}" недоступно для заказа (статус: ${ad.status})`,
        });
      }

      // Валидация quantity
      const quantity = parseInt(item.quantity, 10);
      if (!quantity || quantity < 1 || quantity > 1000) {
        return res.status(400).json({
          message: `Некорректное количество для "${ad.title}". Должно быть от 1 до 1000`,
        });
      }

      // Используем актуальные данные из объявления
      validatedItems.push({
        adId: ad._id,
        title: ad.title,
        quantity: quantity,
        price: ad.price, // Используем актуальную цену из БД
        currency: ad.currency,
        sellerTelegramId: ad.sellerTelegramId, // Используем актуального продавца
      });
    }

    // Автоматический расчет totalPrice
    const totalPrice = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      buyerTelegramId,
      buyerName,
      buyerUsername,
      buyerPhone,
      items: validatedItems,
      totalPrice,
      seasonCode,
      comment,
      status: 'pending',
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/:buyerTelegramId', async (req, res, next) => {
  try {
    const { buyerTelegramId } = req.params;
    const orders = await Order.find({ buyerTelegramId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Статус должен быть одним из: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
