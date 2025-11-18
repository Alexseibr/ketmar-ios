const { Router } = require('express');
const Ad = require('../../models/Ad.js');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { limit, categoryId, subcategoryId, seasonCode } = req.query;
    
    const query = { status: 'active' };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      query.subcategoryId = subcategoryId;
    }
    
    if (seasonCode) {
      query.seasonCode = seasonCode;
    }
    
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    
    const items = await Ad.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit);
    
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id);
    
    if (!ad) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }
    
    // Увеличиваем счетчик просмотров
    ad.views += 1;
    await ad.save();
    
    res.json(ad);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      description,
      categoryId,
      subcategoryId,
      price,
      currency,
      photos,
      attributes,
      sellerTelegramId,
      seasonCode,
      deliveryOptions,
      lifetimeDays,
      isLiveSpot,
    } = req.body;

    if (!title || !categoryId || !subcategoryId || price == null || !sellerTelegramId) {
      return res.status(400).json({
        message: 'Необходимо указать: title, categoryId, subcategoryId, price, sellerTelegramId',
      });
    }

    const ad = await Ad.create({
      title,
      description,
      categoryId,
      subcategoryId,
      price,
      currency,
      photos,
      attributes,
      sellerTelegramId,
      seasonCode,
      deliveryOptions,
      lifetimeDays,
      isLiveSpot,
      status: 'active',
    });

    res.status(201).json(ad);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'title',
      'description',
      'price',
      'currency',
      'photos',
      'attributes',
      'seasonCode',
      'status',
      'deliveryOptions',
      'isLiveSpot',
    ];

    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const ad = await Ad.findByIdAndUpdate(id, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!ad) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }

    res.json(ad);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }

    res.json({ message: 'Объявление архивировано', ad });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
