import { Router } from 'express';
import Worker from '../../models/Worker.js';
import WorkerCategory from '../../models/WorkerCategory.js';
import WorkerPortfolio from '../../models/WorkerPortfolio.js';
import WorkerReview from '../../models/WorkerReview.js';
import User from '../../models/User.js';
import { haversineDistanceKm } from '../../utils/distance.js';

const router = Router();

router.get('/categories', async (req, res) => {
  try {
    let categories = await WorkerCategory.find({ isActive: true }).sort({ order: 1 });
    
    if (categories.length === 0) {
      await WorkerCategory.seedCategories();
      categories = await WorkerCategory.find({ isActive: true }).sort({ order: 1 });
    }

    const parentCategories = categories.filter(c => !c.parentSlug);
    const result = parentCategories.map(parent => ({
      slug: parent.slug,
      name: parent.name,
      icon: parent.icon,
      subcategories: categories
        .filter(c => c.parentSlug === parent.slug)
        .map(sub => ({
          slug: sub.slug,
          name: sub.name,
          icon: sub.icon,
          keywords: sub.keywords,
        })),
    }));

    res.json({ categories: result });
  } catch (error) {
    console.error('[Workers] Error fetching categories:', error);
    res.status(500).json({ error: 'Ошибка загрузки категорий' });
  }
});

router.get('/categories/flat', async (req, res) => {
  try {
    let categories = await WorkerCategory.find({ isActive: true, parentSlug: { $ne: null } }).sort({ order: 1 });
    
    if (categories.length === 0) {
      await WorkerCategory.seedCategories();
      categories = await WorkerCategory.find({ isActive: true, parentSlug: { $ne: null } }).sort({ order: 1 });
    }

    res.json({ categories: categories.map(c => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      parentSlug: c.parentSlug,
    })) });
  } catch (error) {
    console.error('[Workers] Error fetching flat categories:', error);
    res.status(500).json({ error: 'Ошибка загрузки категорий' });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radiusKm = 30,
      category,
      minRating,
      isVerified,
      isTeam,
      sortBy = 'rating',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status: 'active' };

    if (lat && lng) {
      query['location.geo'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radiusKm) * 1000,
        },
      };
    }

    if (category) {
      query.categories = category;
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (isVerified === 'true') {
      query.isVerified = true;
    }

    if (isTeam === 'true') {
      query.isTeam = true;
    }

    const sortOptions = {
      rating: { rating: -1, completedOrdersCount: -1 },
      reviews: { reviewsCount: -1, rating: -1 },
      price_asc: { priceFrom: 1 },
      price_desc: { priceTo: -1 },
      recent: { lastActiveAt: -1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const workers = await Worker.find(query)
      .sort(sortOptions[sortBy] || sortOptions.rating)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Worker.countDocuments(query);

    const result = workers.map(w => {
      const workerData = {
        id: w._id,
        name: w.name,
        avatar: w.avatar,
        categories: w.categories,
        experienceYears: w.experienceYears,
        priceFrom: w.priceFrom,
        priceTo: w.priceTo,
        priceUnit: w.priceUnit,
        currency: w.currency,
        rating: w.rating,
        reviewsCount: w.reviewsCount,
        completedOrdersCount: w.completedOrdersCount,
        isVerified: w.isVerified,
        isPro: w.isPro,
        isTeam: w.isTeam,
        teamSize: w.teamSize,
        tags: w.tags,
        city: w.location?.city,
      };

      if (lat && lng && w.location?.lat && w.location?.lng) {
        workerData.distance = haversineDistanceKm(
          parseFloat(lat),
          parseFloat(lng),
          w.location.lat,
          w.location.lng
        );
      }

      return workerData;
    });

    res.json({
      workers: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Workers] Error fetching workers:', error);
    res.status(500).json({ error: 'Ошибка загрузки исполнителей' });
  }
});

router.get('/top', async (req, res) => {
  try {
    const { category, limit = 5 } = req.query;

    const query = { status: 'active' };
    if (category) {
      query.categories = category;
    }

    const workers = await Worker.find(query)
      .sort({ rating: -1, completedOrdersCount: -1 })
      .limit(parseInt(limit));

    res.json({ workers: workers.map(w => ({
      id: w._id,
      name: w.name,
      avatar: w.avatar,
      categories: w.categories,
      rating: w.rating,
      reviewsCount: w.reviewsCount,
      completedOrdersCount: w.completedOrdersCount,
      isVerified: w.isVerified,
      priceFrom: w.priceFrom,
      city: w.location?.city,
    })) });
  } catch (error) {
    console.error('[Workers] Error fetching top workers:', error);
    res.status(500).json({ error: 'Ошибка загрузки топ исполнителей' });
  }
});

router.get('/my/profile', async (req, res) => {
  try {
    const { userId, telegramId } = req.query;

    if (!userId && !telegramId) {
      return res.json({ registered: false });
    }

    const query = {
      $or: [
        userId ? { userId } : null,
        telegramId ? { telegramId: parseInt(telegramId) } : null,
      ].filter(Boolean),
    };

    const worker = await Worker.findOne(query);

    if (!worker) {
      return res.json({ registered: false });
    }

    res.json({
      registered: true,
      worker: {
        id: worker._id,
        name: worker.name,
        avatar: worker.avatar,
        categories: worker.categories,
        rating: worker.rating,
        reviewsCount: worker.reviewsCount,
        completedOrdersCount: worker.completedOrdersCount,
        isVerified: worker.isVerified,
        isPro: worker.isPro,
        status: worker.status,
      },
    });
  } catch (error) {
    console.error('[Workers] Error fetching my profile:', error);
    res.status(500).json({ error: 'Ошибка загрузки профиля' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    worker.viewsCount = (worker.viewsCount || 0) + 1;
    await worker.save();

    const portfolio = await WorkerPortfolio.find({ workerId: worker._id, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(10);

    const reviews = await WorkerReview.getForWorker(worker._id, { limit: 5 });
    const reviewStats = await WorkerReview.getStats(worker._id);

    const allCategories = await WorkerCategory.find({ 
      slug: { $in: worker.categories },
      isActive: true,
    });

    res.json({
      worker: {
        id: worker._id,
        name: worker.name,
        avatar: worker.avatar,
        phone: worker.phone,
        categories: worker.categories,
        categoryNames: allCategories.map(c => ({ slug: c.slug, name: c.name, icon: c.icon })),
        experienceYears: worker.experienceYears,
        description: worker.description,
        priceFrom: worker.priceFrom,
        priceTo: worker.priceTo,
        priceUnit: worker.priceUnit,
        currency: worker.currency,
        location: worker.location,
        rating: worker.rating,
        reviewsCount: worker.reviewsCount,
        reviewSummary: worker.reviewSummary,
        completedOrdersCount: worker.completedOrdersCount,
        responseRate: worker.responseRate,
        avgResponseTimeMinutes: worker.avgResponseTimeMinutes,
        tags: worker.tags,
        isVerified: worker.isVerified,
        isPro: worker.isPro,
        isTeam: worker.isTeam,
        teamSize: worker.teamSize,
        status: worker.status,
        lastActiveAt: worker.lastActiveAt,
        viewsCount: worker.viewsCount,
      },
      portfolio,
      reviews,
      reviewStats,
    });
  } catch (error) {
    console.error('[Workers] Error fetching worker:', error);
    res.status(500).json({ error: 'Ошибка загрузки профиля исполнителя' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { userId, telegramId, name, phone, categories, description, priceFrom, priceTo, priceUnit, location, experienceYears, isTeam, teamSize, tags } = req.body;

    if (!userId && !telegramId) {
      return res.status(400).json({ error: 'Необходим userId или telegramId' });
    }

    if (!name || !categories || categories.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать имя и категории работ' });
    }

    const existingWorker = await Worker.findOne({
      $or: [
        userId ? { userId } : null,
        telegramId ? { telegramId } : null,
      ].filter(Boolean),
    });

    if (existingWorker) {
      return res.status(400).json({ error: 'Вы уже зарегистрированы как исполнитель' });
    }

    const workerData = {
      name,
      phone,
      categories,
      description,
      priceFrom,
      priceTo,
      priceUnit: priceUnit || 'hour',
      experienceYears: experienceYears || 0,
      isTeam: isTeam || false,
      teamSize: teamSize || 1,
      tags: tags || [],
    };

    if (userId) {
      workerData.userId = userId;
      const user = await User.findById(userId);
      if (user) {
        workerData.avatar = user.avatar;
        workerData.telegramId = user.telegramId;
      }
    }

    if (telegramId) {
      workerData.telegramId = telegramId;
    }

    if (location) {
      workerData.location = {
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        address: location.address,
      };
      if (location.lat && location.lng) {
        workerData.location.geo = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }
    }

    const worker = new Worker(workerData);
    await worker.save();

    res.status(201).json({ 
      success: true,
      worker: {
        id: worker._id,
        name: worker.name,
        categories: worker.categories,
        status: worker.status,
      },
    });
  } catch (error) {
    console.error('[Workers] Error registering worker:', error);
    res.status(500).json({ error: 'Ошибка регистрации исполнителя' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, categories, description, priceFrom, priceTo, priceUnit, location, experienceYears, isTeam, teamSize, tags, status } = req.body;

    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    if (name) worker.name = name;
    if (phone) worker.phone = phone;
    if (categories) worker.categories = categories;
    if (description !== undefined) worker.description = description;
    if (priceFrom !== undefined) worker.priceFrom = priceFrom;
    if (priceTo !== undefined) worker.priceTo = priceTo;
    if (priceUnit) worker.priceUnit = priceUnit;
    if (experienceYears !== undefined) worker.experienceYears = experienceYears;
    if (isTeam !== undefined) worker.isTeam = isTeam;
    if (teamSize !== undefined) worker.teamSize = teamSize;
    if (tags) worker.tags = tags;
    if (status) worker.status = status;

    if (location) {
      worker.location = {
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        address: location.address,
      };
      if (location.lat && location.lng) {
        worker.location.geo = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }
    }

    worker.lastActiveAt = new Date();
    await worker.save();

    res.json({ success: true, worker });
  } catch (error) {
    console.error('[Workers] Error updating worker:', error);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

router.post('/:id/portfolio', async (req, res) => {
  try {
    const { title, description, category, photos, beforePhoto, afterPhoto, duration, cost, completedAt } = req.body;

    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    const portfolioItem = new WorkerPortfolio({
      workerId: worker._id,
      title,
      description,
      category,
      photos: photos || [],
      beforePhoto,
      afterPhoto,
      duration,
      cost,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    });

    await portfolioItem.save();

    res.status(201).json({ success: true, portfolio: portfolioItem });
  } catch (error) {
    console.error('[Workers] Error adding portfolio:', error);
    res.status(500).json({ error: 'Ошибка добавления работы в портфолио' });
  }
});

router.get('/:id/portfolio', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const portfolio = await WorkerPortfolio.find({ 
      workerId: req.params.id,
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WorkerPortfolio.countDocuments({ 
      workerId: req.params.id,
      isPublic: true,
    });

    res.json({
      portfolio,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Workers] Error fetching portfolio:', error);
    res.status(500).json({ error: 'Ошибка загрузки портфолио' });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await WorkerReview.getForWorker(req.params.id, {
      limit: parseInt(limit),
      skip,
    });

    const stats = await WorkerReview.getStats(req.params.id);
    const total = stats.count;

    res.json({
      reviews,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Workers] Error fetching reviews:', error);
    res.status(500).json({ error: 'Ошибка загрузки отзывов' });
  }
});

router.get('/my/profile', async (req, res) => {
  try {
    const { userId, telegramId } = req.query;

    if (!userId && !telegramId) {
      return res.status(400).json({ error: 'Необходим userId или telegramId' });
    }

    const query = {};
    if (userId) query.userId = userId;
    if (telegramId) query.telegramId = parseInt(telegramId);

    const worker = await Worker.findOne(query);

    if (!worker) {
      return res.json({ registered: false });
    }

    const portfolio = await WorkerPortfolio.find({ workerId: worker._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      registered: true,
      worker: {
        id: worker._id,
        name: worker.name,
        avatar: worker.avatar,
        phone: worker.phone,
        categories: worker.categories,
        experienceYears: worker.experienceYears,
        description: worker.description,
        priceFrom: worker.priceFrom,
        priceTo: worker.priceTo,
        priceUnit: worker.priceUnit,
        currency: worker.currency,
        location: worker.location,
        rating: worker.rating,
        reviewsCount: worker.reviewsCount,
        completedOrdersCount: worker.completedOrdersCount,
        activeOrdersCount: worker.activeOrdersCount,
        responseRate: worker.responseRate,
        tags: worker.tags,
        isVerified: worker.isVerified,
        isPro: worker.isPro,
        isTeam: worker.isTeam,
        teamSize: worker.teamSize,
        status: worker.status,
        viewsCount: worker.viewsCount,
        contactsCount: worker.contactsCount,
      },
      portfolio,
    });
  } catch (error) {
    console.error('[Workers] Error fetching my profile:', error);
    res.status(500).json({ error: 'Ошибка загрузки профиля' });
  }
});

export default router;
