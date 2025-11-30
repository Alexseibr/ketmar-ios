import Worker from '../../models/Worker.js';
import WorkerReview from '../../models/WorkerReview.js';
import WorkerOrder from '../../models/WorkerOrder.js';
import WorkerResponse from '../../models/WorkerResponse.js';

class WorkerRankingService {
  constructor() {
    this.rankingWeights = {
      rating: 0.30,
      completedOrders: 0.20,
      responseRate: 0.15,
      responseTime: 0.10,
      experience: 0.10,
      verified: 0.10,
      pro: 0.05,
    };
  }

  async updateWorkerRanking(workerId) {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const reviewStats = await WorkerReview.getStats(workerId);
    
    if (reviewStats.count > 0) {
      worker.rating = Math.round(reviewStats.avgRating * 100) / 100;
      worker.reviewsCount = reviewStats.count;
      worker.reviewSummary = {
        quality: Math.round(reviewStats.avgQuality * 100) / 100,
        punctuality: Math.round(reviewStats.avgPunctuality * 100) / 100,
        communication: Math.round(reviewStats.avgCommunication * 100) / 100,
      };
    }

    const [acceptedCount, totalResponses] = await Promise.all([
      WorkerResponse.countDocuments({ workerId, status: 'accepted' }),
      WorkerResponse.countDocuments({ workerId }),
    ]);

    if (totalResponses > 0) {
      worker.responseRate = Math.round((acceptedCount / totalResponses) * 100);
    }

    const completedOrders = await WorkerOrder.countDocuments({
      assignedWorkerId: workerId,
      status: 'completed',
    });
    worker.completedOrdersCount = completedOrders;

    const activeOrders = await WorkerOrder.countDocuments({
      assignedWorkerId: workerId,
      status: 'in_progress',
    });
    worker.activeOrdersCount = activeOrders;

    await worker.save();

    return worker;
  }

  calculateOverallScore(worker) {
    let score = 0;

    const ratingScore = worker.rating / 5;
    score += ratingScore * this.rankingWeights.rating;

    const ordersScore = Math.min(worker.completedOrdersCount / 100, 1);
    score += ordersScore * this.rankingWeights.completedOrders;

    const responseRateScore = (worker.responseRate || 0) / 100;
    score += responseRateScore * this.rankingWeights.responseRate;

    let responseTimeScore = 0;
    if (worker.avgResponseTimeMinutes) {
      if (worker.avgResponseTimeMinutes <= 5) responseTimeScore = 1;
      else if (worker.avgResponseTimeMinutes <= 15) responseTimeScore = 0.9;
      else if (worker.avgResponseTimeMinutes <= 30) responseTimeScore = 0.7;
      else if (worker.avgResponseTimeMinutes <= 60) responseTimeScore = 0.5;
      else responseTimeScore = 0.3;
    } else {
      responseTimeScore = 0.5;
    }
    score += responseTimeScore * this.rankingWeights.responseTime;

    const expScore = Math.min(worker.experienceYears / 15, 1);
    score += expScore * this.rankingWeights.experience;

    if (worker.isVerified) {
      score += this.rankingWeights.verified;
    }

    if (worker.isPro) {
      score += this.rankingWeights.pro;
    }

    return Math.round(score * 100) / 100;
  }

  async getLeaderboard(category = null, options = {}) {
    const { limit = 20, city = null } = options;

    const query = { status: 'active' };
    if (category) {
      query.categories = category;
    }
    if (city) {
      query['location.city'] = city;
    }

    const workers = await Worker.find(query)
      .sort({ rating: -1, completedOrdersCount: -1 })
      .limit(limit * 2);

    const scoredWorkers = workers.map(worker => ({
      worker,
      overallScore: this.calculateOverallScore(worker),
    }));

    scoredWorkers.sort((a, b) => b.overallScore - a.overallScore);

    return scoredWorkers.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      id: item.worker._id,
      name: item.worker.name,
      avatar: item.worker.avatar,
      categories: item.worker.categories,
      rating: item.worker.rating,
      reviewsCount: item.worker.reviewsCount,
      completedOrdersCount: item.worker.completedOrdersCount,
      isVerified: item.worker.isVerified,
      isPro: item.worker.isPro,
      overallScore: item.overallScore,
      city: item.worker.location?.city,
    }));
  }

  async recalculateAllRankings() {
    const workers = await Worker.find({ status: { $ne: 'banned' } });
    
    let updated = 0;
    for (const worker of workers) {
      try {
        await this.updateWorkerRanking(worker._id);
        updated++;
      } catch (error) {
        console.error(`[WorkerRanking] Error updating worker ${worker._id}:`, error.message);
      }
    }

    console.log(`[WorkerRanking] Updated ${updated} worker rankings`);
    return updated;
  }

  getBadges(worker) {
    const badges = [];

    if (worker.isVerified) {
      badges.push({ type: 'verified', label: 'Проверен', icon: '✓' });
    }

    if (worker.isPro) {
      badges.push({ type: 'pro', label: 'PRO', icon: '⭐' });
    }

    if (worker.completedOrdersCount >= 100) {
      badges.push({ type: 'expert', label: 'Эксперт', icon: '🏆' });
    } else if (worker.completedOrdersCount >= 50) {
      badges.push({ type: 'experienced', label: 'Опытный', icon: '🔥' });
    } else if (worker.completedOrdersCount >= 10) {
      badges.push({ type: 'active', label: 'Активный', icon: '💪' });
    }

    if (worker.rating >= 4.8 && worker.reviewsCount >= 10) {
      badges.push({ type: 'top_rated', label: 'Топ рейтинг', icon: '⭐' });
    }

    if (worker.responseRate >= 90) {
      badges.push({ type: 'responsive', label: 'Быстрый отклик', icon: '⚡' });
    }

    if (worker.isTeam) {
      badges.push({ type: 'team', label: `Бригада ${worker.teamSize} чел.`, icon: '👥' });
    }

    return badges;
  }

  getLevel(worker) {
    const score = this.calculateOverallScore(worker);
    
    if (score >= 0.9) return { level: 5, name: 'Мастер', color: '#FFD700' };
    if (score >= 0.75) return { level: 4, name: 'Эксперт', color: '#9B59B6' };
    if (score >= 0.55) return { level: 3, name: 'Профессионал', color: '#3498DB' };
    if (score >= 0.35) return { level: 2, name: 'Специалист', color: '#27AE60' };
    return { level: 1, name: 'Новичок', color: '#95A5A6' };
  }
}

export default new WorkerRankingService();
