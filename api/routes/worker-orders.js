import { Router } from 'express';
import WorkerOrder from '../../models/WorkerOrder.js';
import WorkerResponse from '../../models/WorkerResponse.js';
import Worker from '../../models/Worker.js';
import WorkerReview from '../../models/WorkerReview.js';
import User from '../../models/User.js';
import { haversineDistanceKm } from '../../utils/distance.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radiusKm = 30,
      category,
      urgency,
      status = 'open',
      sortBy = 'recent',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status };

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
      query.category = category;
    }

    if (urgency) {
      query.urgency = urgency;
    }

    const sortOptions = {
      recent: { createdAt: -1 },
      urgency: { urgency: -1, createdAt: -1 },
      budget_high: { budgetTo: -1 },
      budget_low: { budgetFrom: 1 },
      deadline: { deadline: 1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await WorkerOrder.find(query)
      .sort(sortOptions[sortBy] || sortOptions.recent)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WorkerOrder.countDocuments(query);

    const result = orders.map(o => {
      const orderData = {
        id: o._id,
        title: o.title,
        description: o.description?.substring(0, 200),
        category: o.category,
        budgetFrom: o.budgetFrom,
        budgetTo: o.budgetTo,
        budgetType: o.budgetType,
        currency: o.currency,
        urgency: o.urgency,
        deadline: o.deadline,
        responsesCount: o.responsesCount,
        maxResponses: o.maxResponses,
        city: o.location?.city,
        photos: o.photos?.slice(0, 1),
        createdAt: o.createdAt,
      };

      if (lat && lng && o.location?.lat && o.location?.lng) {
        orderData.distance = haversineDistanceKm(
          parseFloat(lat),
          parseFloat(lng),
          o.location.lat,
          o.location.lng
        );
      }

      return orderData;
    });

    res.json({
      orders: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[WorkerOrders] Error fetching orders:', error);
    res.status(500).json({ error: 'Ошибка загрузки заказов' });
  }
});

router.get('/recommended', async (req, res) => {
  try {
    const { workerId, limit = 10 } = req.query;

    if (!workerId) {
      return res.status(400).json({ error: 'Необходим workerId' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    const query = {
      status: 'open',
      category: { $in: worker.categories },
    };

    if (worker.location?.geo) {
      query['location.geo'] = {
        $nearSphere: {
          $geometry: worker.location.geo,
          $maxDistance: 50000,
        },
      };
    }

    const respondedOrderIds = await WorkerResponse.find({ workerId })
      .distinct('orderId');

    query._id = { $nin: respondedOrderIds };

    const orders = await WorkerOrder.find(query)
      .sort({ urgency: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ orders });
  } catch (error) {
    console.error('[WorkerOrders] Error fetching recommended orders:', error);
    res.status(500).json({ error: 'Ошибка загрузки рекомендованных заказов' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await WorkerOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    order.viewsCount = (order.viewsCount || 0) + 1;
    await order.save();

    let customer = null;
    if (order.customerId) {
      customer = await User.findById(order.customerId, 'firstName lastName avatar');
    }

    let assignedWorker = null;
    if (order.assignedWorkerId) {
      assignedWorker = await Worker.findById(order.assignedWorkerId, 'name avatar rating reviewsCount');
    }

    res.json({
      order: {
        id: order._id,
        title: order.title,
        description: order.description,
        category: order.category,
        budgetFrom: order.budgetFrom,
        budgetTo: order.budgetTo,
        budgetType: order.budgetType,
        currency: order.currency,
        location: order.location,
        photos: order.photos,
        deadline: order.deadline,
        urgency: order.urgency,
        status: order.status,
        responsesCount: order.responsesCount,
        maxResponses: order.maxResponses,
        viewsCount: order.viewsCount,
        isRemoteOk: order.isRemoteOk,
        materialsIncluded: order.materialsIncluded,
        createdAt: order.createdAt,
        customer: customer ? {
          name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Заказчик',
          avatar: customer.avatar,
        } : { name: order.customerName || 'Заказчик' },
        assignedWorker: assignedWorker ? {
          id: assignedWorker._id,
          name: assignedWorker.name,
          avatar: assignedWorker.avatar,
          rating: assignedWorker.rating,
        } : null,
      },
    });
  } catch (error) {
    console.error('[WorkerOrders] Error fetching order:', error);
    res.status(500).json({ error: 'Ошибка загрузки заказа' });
  }
});

router.get('/:id/responses', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const responses = await WorkerResponse.find({ orderId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WorkerResponse.countDocuments({ orderId: req.params.id });

    const workerIds = responses.map(r => r.workerId);
    const workers = await Worker.find({ _id: { $in: workerIds } });
    const workersMap = new Map(workers.map(w => [w._id.toString(), w]));

    const result = responses.map(r => {
      const worker = workersMap.get(r.workerId.toString());
      return {
        id: r._id,
        message: r.message,
        priceOffer: r.priceOffer,
        priceType: r.priceType,
        currency: r.currency || 'BYN',
        estimatedDuration: r.estimatedDuration,
        canStartAt: r.canStartAt,
        materialsIncluded: r.materialsIncluded,
        status: r.status,
        createdAt: r.createdAt,
        worker: worker ? {
          id: worker._id,
          name: worker.name,
          avatar: worker.avatar,
          rating: worker.rating,
          reviewsCount: worker.reviewsCount,
          completedOrdersCount: worker.completedOrdersCount,
          isVerified: worker.isVerified,
          categories: worker.categories,
        } : null,
      };
    });

    res.json({
      responses: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[WorkerOrders] Error fetching order responses:', error);
    res.status(500).json({ error: 'Ошибка загрузки откликов' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      customerTelegramId,
      customerName,
      customerPhone,
      category,
      title,
      description,
      budgetFrom,
      budgetTo,
      budgetType,
      location,
      photos,
      deadline,
      urgency,
      isRemoteOk,
      materialsIncluded,
    } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ error: 'Необходимо указать категорию, название и описание заказа' });
    }

    const orderData = {
      category,
      title,
      description,
      budgetFrom,
      budgetTo,
      budgetType: budgetType || 'negotiable',
      photos: photos || [],
      deadline: deadline ? new Date(deadline) : null,
      urgency: urgency || 'normal',
      isRemoteOk: isRemoteOk || false,
      materialsIncluded: materialsIncluded || false,
      status: 'open',
    };

    if (customerId) {
      orderData.customerId = customerId;
      const user = await User.findById(customerId);
      if (user) {
        orderData.customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        orderData.customerPhone = user.phone;
        orderData.customerTelegramId = user.telegramId;
      }
    } else {
      orderData.customerTelegramId = customerTelegramId;
      orderData.customerName = customerName;
      orderData.customerPhone = customerPhone;
    }

    if (location) {
      orderData.location = {
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        address: location.address,
      };
      if (location.lat && location.lng) {
        orderData.location.geo = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    orderData.expiresAt = expiresAt;

    const order = new WorkerOrder(orderData);
    await order.save();

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        title: order.title,
        category: order.category,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('[WorkerOrders] Error creating order:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const order = await WorkerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const { title, description, budgetFrom, budgetTo, budgetType, location, photos, deadline, urgency, isRemoteOk, materialsIncluded } = req.body;

    if (title) order.title = title;
    if (description) order.description = description;
    if (budgetFrom !== undefined) order.budgetFrom = budgetFrom;
    if (budgetTo !== undefined) order.budgetTo = budgetTo;
    if (budgetType) order.budgetType = budgetType;
    if (photos) order.photos = photos;
    if (deadline) order.deadline = new Date(deadline);
    if (urgency) order.urgency = urgency;
    if (isRemoteOk !== undefined) order.isRemoteOk = isRemoteOk;
    if (materialsIncluded !== undefined) order.materialsIncluded = materialsIncluded;

    if (location) {
      order.location = {
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        address: location.address,
      };
      if (location.lat && location.lng) {
        order.location.geo = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }
    }

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('[WorkerOrders] Error updating order:', error);
    res.status(500).json({ error: 'Ошибка обновления заказа' });
  }
});

router.post('/:id/assign', async (req, res) => {
  try {
    const { workerId, responseId } = req.body;

    const order = await WorkerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (order.status !== 'open') {
      return res.status(400).json({ error: 'Заказ уже закрыт или в работе' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    if (responseId) {
      const response = await WorkerResponse.findById(responseId);
      if (response) {
        await response.accept();
      }

      await WorkerResponse.updateMany(
        { orderId: order._id, _id: { $ne: responseId } },
        { status: 'rejected', respondedAt: new Date() }
      );
    }

    await order.assignWorker(workerId);

    worker.activeOrdersCount = (worker.activeOrdersCount || 0) + 1;
    await worker.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('[WorkerOrders] Error assigning worker:', error);
    res.status(500).json({ error: 'Ошибка назначения исполнителя' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const { rating, review, reviewDetails } = req.body;

    const order = await WorkerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (order.status !== 'in_progress') {
      return res.status(400).json({ error: 'Заказ не находится в работе' });
    }

    await order.complete(rating, review, reviewDetails);

    if (order.assignedWorkerId && rating) {
      const worker = await Worker.findById(order.assignedWorkerId);
      if (worker) {
        await worker.updateRating(rating, reviewDetails);
        await worker.incrementCompleted();
      }

      const workerReview = new WorkerReview({
        orderId: order._id,
        workerId: order.assignedWorkerId,
        customerId: order.customerId,
        rating,
        quality: reviewDetails?.quality || rating,
        punctuality: reviewDetails?.punctuality || rating,
        communication: reviewDetails?.communication || rating,
        text: review,
        isVerified: true,
      });
      await workerReview.save();
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('[WorkerOrders] Error completing order:', error);
    res.status(500).json({ error: 'Ошибка завершения заказа' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await WorkerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Нельзя отменить завершённый заказ' });
    }

    if (order.assignedWorkerId) {
      const worker = await Worker.findById(order.assignedWorkerId);
      if (worker && worker.activeOrdersCount > 0) {
        worker.activeOrdersCount -= 1;
        await worker.save();
      }
    }

    await order.cancel();

    res.json({ success: true, order });
  } catch (error) {
    console.error('[WorkerOrders] Error cancelling order:', error);
    res.status(500).json({ error: 'Ошибка отмены заказа' });
  }
});

router.get('/my/customer', async (req, res) => {
  try {
    const { customerId, customerTelegramId, status, page = 1, limit = 20 } = req.query;

    if (!customerId && !customerTelegramId) {
      return res.status(400).json({ error: 'Необходим customerId или customerTelegramId' });
    }

    const query = {};
    if (customerId) query.customerId = customerId;
    if (customerTelegramId) query.customerTelegramId = parseInt(customerTelegramId);
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await WorkerOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WorkerOrder.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[WorkerOrders] Error fetching customer orders:', error);
    res.status(500).json({ error: 'Ошибка загрузки заказов' });
  }
});

router.get('/:id/responses', async (req, res) => {
  try {
    const responses = await WorkerResponse.find({ orderId: req.params.id })
      .populate('workerId')
      .sort({ createdAt: -1 });

    const result = responses.map(r => ({
      id: r._id,
      message: r.message,
      priceOffer: r.priceOffer,
      priceType: r.priceType,
      currency: r.currency,
      estimatedDuration: r.estimatedDuration,
      canStartAt: r.canStartAt,
      materialsIncluded: r.materialsIncluded,
      status: r.status,
      createdAt: r.createdAt,
      worker: r.workerId ? {
        id: r.workerId._id,
        name: r.workerId.name,
        avatar: r.workerId.avatar,
        rating: r.workerId.rating,
        reviewsCount: r.workerId.reviewsCount,
        completedOrdersCount: r.workerId.completedOrdersCount,
        isVerified: r.workerId.isVerified,
        categories: r.workerId.categories,
      } : null,
    }));

    res.json({ responses: result });
  } catch (error) {
    console.error('[WorkerOrders] Error fetching responses:', error);
    res.status(500).json({ error: 'Ошибка загрузки откликов' });
  }
});

export default router;
