import Worker from '../../models/Worker.js';
import WorkerOrder from '../../models/WorkerOrder.js';
import WorkerResponse from '../../models/WorkerResponse.js';
import { haversineDistanceKm } from '../../utils/distance.js';

class WorkerMatchingService {
  constructor() {
    this.weights = {
      distance: 0.25,
      rating: 0.25,
      experience: 0.15,
      responseRate: 0.15,
      completedOrders: 0.10,
      availability: 0.10,
    };
  }

  async findMatchingWorkers(order, options = {}) {
    const {
      limit = 20,
      maxDistanceKm = 50,
      minRating = 0,
    } = options;

    const query = {
      status: 'active',
      categories: order.category,
    };

    if (order.location?.geo) {
      query['location.geo'] = {
        $nearSphere: {
          $geometry: order.location.geo,
          $maxDistance: maxDistanceKm * 1000,
        },
      };
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    const workers = await Worker.find(query).limit(limit * 2);

    const respondedWorkerIds = await WorkerResponse.find({ orderId: order._id })
      .distinct('workerId');

    const availableWorkers = workers.filter(w => 
      !respondedWorkerIds.some(id => id.equals(w._id))
    );

    const scoredWorkers = availableWorkers.map(worker => {
      const score = this.calculateMatchScore(worker, order);
      return { worker, score };
    });

    scoredWorkers.sort((a, b) => b.score - a.score);

    return scoredWorkers.slice(0, limit).map(item => ({
      ...item.worker.toObject(),
      matchScore: item.score,
      distance: order.location?.lat && worker.location?.lat
        ? haversineDistanceKm(
            order.location.lat,
            order.location.lng,
            item.worker.location.lat,
            item.worker.location.lng
          )
        : null,
    }));
  }

  calculateMatchScore(worker, order) {
    let score = 0;

    const distanceScore = this.calculateDistanceScore(worker, order);
    score += distanceScore * this.weights.distance;

    const ratingScore = worker.rating / 5;
    score += ratingScore * this.weights.rating;

    const expScore = Math.min(worker.experienceYears / 10, 1);
    score += expScore * this.weights.experience;

    const responseScore = (worker.responseRate || 100) / 100;
    score += responseScore * this.weights.responseRate;

    const ordersScore = Math.min(worker.completedOrdersCount / 50, 1);
    score += ordersScore * this.weights.completedOrders;

    const now = Date.now();
    const lastActive = worker.lastActiveAt?.getTime() || 0;
    const hoursAgo = (now - lastActive) / (1000 * 60 * 60);
    const availabilityScore = hoursAgo < 1 ? 1 : hoursAgo < 24 ? 0.8 : hoursAgo < 72 ? 0.5 : 0.2;
    score += availabilityScore * this.weights.availability;

    if (worker.isVerified) score *= 1.1;
    if (worker.isPro) score *= 1.05;

    return Math.min(score, 1);
  }

  calculateDistanceScore(worker, order) {
    if (!order.location?.lat || !worker.location?.lat) {
      return 0.5;
    }

    const distance = haversineDistanceKm(
      order.location.lat,
      order.location.lng,
      worker.location.lat,
      worker.location.lng
    );

    if (distance <= 5) return 1;
    if (distance <= 10) return 0.9;
    if (distance <= 20) return 0.7;
    if (distance <= 30) return 0.5;
    if (distance <= 50) return 0.3;
    return 0.1;
  }

  async getRecommendedOrders(workerId, options = {}) {
    const { limit = 10, maxDistanceKm = 50 } = options;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const query = {
      status: 'open',
      category: { $in: worker.categories },
    };

    if (worker.location?.geo) {
      query['location.geo'] = {
        $nearSphere: {
          $geometry: worker.location.geo,
          $maxDistance: maxDistanceKm * 1000,
        },
      };
    }

    const respondedOrderIds = await WorkerResponse.find({ workerId })
      .distinct('orderId');

    query._id = { $nin: respondedOrderIds };

    const orders = await WorkerOrder.find(query)
      .sort({ urgency: -1, createdAt: -1 })
      .limit(limit);

    return orders.map(order => ({
      ...order.toObject(),
      distance: worker.location?.lat && order.location?.lat
        ? haversineDistanceKm(
            worker.location.lat,
            worker.location.lng,
            order.location.lat,
            order.location.lng
          )
        : null,
    }));
  }

  async getTopWorkersForCategory(category, options = {}) {
    const { limit = 5, lat, lng, radiusKm = 30 } = options;

    const query = {
      status: 'active',
      categories: category,
    };

    if (lat && lng) {
      query['location.geo'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusKm * 1000,
        },
      };
    }

    const workers = await Worker.find(query)
      .sort({ rating: -1, completedOrdersCount: -1 })
      .limit(limit);

    return workers;
  }

  async getSimilarWorkers(workerId, options = {}) {
    const { limit = 5 } = options;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return [];
    }

    const query = {
      _id: { $ne: workerId },
      status: 'active',
      categories: { $in: worker.categories },
    };

    if (worker.location?.geo) {
      query['location.geo'] = {
        $nearSphere: {
          $geometry: worker.location.geo,
          $maxDistance: 30000,
        },
      };
    }

    const similar = await Worker.find(query)
      .sort({ rating: -1 })
      .limit(limit);

    return similar;
  }
}

export default new WorkerMatchingService();
