import { Router } from 'express';
import WorkerResponse from '../../models/WorkerResponse.js';
import WorkerOrder from '../../models/WorkerOrder.js';
import Worker from '../../models/Worker.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { orderId, workerId, message, priceOffer, priceType, estimatedDuration, canStartAt, materialsIncluded } = req.body;

    if (!orderId || !workerId || !message) {
      return res.status(400).json({ error: 'Необходимо указать orderId, workerId и сообщение' });
    }

    const order = await WorkerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (order.status !== 'open') {
      return res.status(400).json({ error: 'Заказ уже закрыт' });
    }

    if (order.responsesCount >= order.maxResponses) {
      return res.status(400).json({ error: 'Достигнуто максимальное количество откликов' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    const existingResponse = await WorkerResponse.findOne({ orderId, workerId });
    if (existingResponse) {
      return res.status(400).json({ error: 'Вы уже откликнулись на этот заказ' });
    }

    const response = new WorkerResponse({
      orderId,
      workerId,
      message,
      priceOffer,
      priceType: priceType || 'fixed',
      estimatedDuration,
      canStartAt: canStartAt ? new Date(canStartAt) : null,
      materialsIncluded: materialsIncluded || false,
    });

    await response.save();

    order.responsesCount = (order.responsesCount || 0) + 1;
    await order.save();

    res.status(201).json({
      success: true,
      response: {
        id: response._id,
        orderId: response.orderId,
        status: response.status,
      },
    });
  } catch (error) {
    console.error('[WorkerResponses] Error creating response:', error);
    res.status(500).json({ error: 'Ошибка создания отклика' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const { workerId, status, page = 1, limit = 20 } = req.query;

    if (!workerId) {
      return res.status(400).json({ error: 'Необходим workerId' });
    }

    const query = { workerId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const responses = await WorkerResponse.find(query)
      .populate('orderId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WorkerResponse.countDocuments(query);

    const result = responses.map(r => ({
      id: r._id,
      message: r.message,
      priceOffer: r.priceOffer,
      priceType: r.priceType,
      status: r.status,
      createdAt: r.createdAt,
      order: r.orderId ? {
        id: r.orderId._id,
        title: r.orderId.title,
        category: r.orderId.category,
        budgetFrom: r.orderId.budgetFrom,
        budgetTo: r.orderId.budgetTo,
        status: r.orderId.status,
        city: r.orderId.location?.city,
      } : null,
    }));

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
    console.error('[WorkerResponses] Error fetching my responses:', error);
    res.status(500).json({ error: 'Ошибка загрузки откликов' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const response = await WorkerResponse.findById(req.params.id)
      .populate('orderId')
      .populate('workerId');

    if (!response) {
      return res.status(404).json({ error: 'Отклик не найден' });
    }

    res.json({ response });
  } catch (error) {
    console.error('[WorkerResponses] Error fetching response:', error);
    res.status(500).json({ error: 'Ошибка загрузки отклика' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { message, priceOffer, priceType, estimatedDuration, canStartAt, materialsIncluded } = req.body;

    const response = await WorkerResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Отклик не найден' });
    }

    if (response.status !== 'pending' && response.status !== 'viewed') {
      return res.status(400).json({ error: 'Нельзя редактировать обработанный отклик' });
    }

    if (message) response.message = message;
    if (priceOffer !== undefined) response.priceOffer = priceOffer;
    if (priceType) response.priceType = priceType;
    if (estimatedDuration !== undefined) response.estimatedDuration = estimatedDuration;
    if (canStartAt) response.canStartAt = new Date(canStartAt);
    if (materialsIncluded !== undefined) response.materialsIncluded = materialsIncluded;

    await response.save();

    res.json({ success: true, response });
  } catch (error) {
    console.error('[WorkerResponses] Error updating response:', error);
    res.status(500).json({ error: 'Ошибка обновления отклика' });
  }
});

router.post('/:id/withdraw', async (req, res) => {
  try {
    const response = await WorkerResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Отклик не найден' });
    }

    if (response.status === 'accepted') {
      return res.status(400).json({ error: 'Нельзя отозвать принятый отклик' });
    }

    response.status = 'withdrawn';
    await response.save();

    const order = await WorkerOrder.findById(response.orderId);
    if (order && order.responsesCount > 0) {
      order.responsesCount -= 1;
      await order.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[WorkerResponses] Error withdrawing response:', error);
    res.status(500).json({ error: 'Ошибка отзыва отклика' });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    const response = await WorkerResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Отклик не найден' });
    }

    await response.markViewed();

    res.json({ success: true });
  } catch (error) {
    console.error('[WorkerResponses] Error marking response viewed:', error);
    res.status(500).json({ error: 'Ошибка просмотра отклика' });
  }
});

router.get('/stats/worker/:workerId', async (req, res) => {
  try {
    const workerId = req.params.workerId;

    const [total, pending, accepted, rejected] = await Promise.all([
      WorkerResponse.countDocuments({ workerId }),
      WorkerResponse.countDocuments({ workerId, status: 'pending' }),
      WorkerResponse.countDocuments({ workerId, status: 'accepted' }),
      WorkerResponse.countDocuments({ workerId, status: 'rejected' }),
    ]);

    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    res.json({
      total,
      pending,
      accepted,
      rejected,
      acceptRate,
    });
  } catch (error) {
    console.error('[WorkerResponses] Error fetching stats:', error);
    res.status(500).json({ error: 'Ошибка загрузки статистики' });
  }
});

export default router;
