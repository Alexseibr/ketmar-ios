import express from 'express';
import JobSeeker from '../../models/JobSeeker.js';
import ngeohash from 'ngeohash';

const router = express.Router();

const CATEGORY_LABELS = {
  cleaning: 'Уборка',
  repair: 'Ремонт',
  garden: 'Сад и огород',
  driving: 'Водитель',
  childcare: 'Няня',
  eldercare: 'Сиделка',
  cooking: 'Повар',
  tutoring: 'Репетитор',
  construction: 'Строительство',
  moving: 'Грузчик',
  beauty: 'Красота',
  other: 'Другое',
};

const AVAILABILITY_LABELS = {
  fulltime: 'Полный день',
  parttime: 'Частичная занятость',
  weekends: 'Выходные',
  evenings: 'Вечера',
  flexible: 'Гибкий график',
};

router.get('/', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radiusKm = 20, 
      category,
      limit = 20,
      offset = 0,
    } = req.query;

    const filter = {
      isActive: true,
      status: 'active',
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    let seekers;

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radius = parseInt(radiusKm, 10);

      const geoHashPrecision = radius <= 1 ? 6 : radius <= 5 ? 5 : radius <= 20 ? 4 : 3;
      const geoHash = ngeohash.encode(latitude, longitude, geoHashPrecision);
      const geoHashPrefix = geoHash.substring(0, geoHashPrecision - 1);

      filter['location.geoHash'] = { $regex: `^${geoHashPrefix}` };

      seekers = await JobSeeker.find(filter)
        .sort({ lastActiveAt: -1 })
        .skip(parseInt(offset, 10))
        .limit(parseInt(limit, 10))
        .lean();

      seekers = seekers.map(seeker => {
        let distanceKm = null;
        if (seeker.location?.lat && seeker.location?.lng) {
          const R = 6371;
          const dLat = (seeker.location.lat - latitude) * Math.PI / 180;
          const dLon = (seeker.location.lng - longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(seeker.location.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = Math.round(R * c * 10) / 10;
        }

        return {
          id: seeker._id.toString(),
          name: seeker.name,
          photo: seeker.photo,
          age: seeker.age,
          skills: seeker.skills || [],
          category: seeker.category,
          categoryLabel: CATEGORY_LABELS[seeker.category] || seeker.category,
          description: seeker.description,
          experience: seeker.experience,
          hourlyRate: seeker.hourlyRate,
          currency: seeker.currency || 'BYN',
          availability: seeker.availability,
          availabilityLabel: AVAILABILITY_LABELS[seeker.availability] || seeker.availability,
          location: seeker.location?.cityName || null,
          distanceKm,
          viewsCount: seeker.viewsCount || 0,
          lastActiveAt: seeker.lastActiveAt,
          createdAt: seeker.createdAt,
        };
      });

      seekers.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));

    } else {
      seekers = await JobSeeker.find(filter)
        .sort({ lastActiveAt: -1 })
        .skip(parseInt(offset, 10))
        .limit(parseInt(limit, 10))
        .lean();

      seekers = seekers.map(seeker => ({
        id: seeker._id.toString(),
        name: seeker.name,
        photo: seeker.photo,
        age: seeker.age,
        skills: seeker.skills || [],
        category: seeker.category,
        categoryLabel: CATEGORY_LABELS[seeker.category] || seeker.category,
        description: seeker.description,
        experience: seeker.experience,
        hourlyRate: seeker.hourlyRate,
        currency: seeker.currency || 'BYN',
        availability: seeker.availability,
        availabilityLabel: AVAILABILITY_LABELS[seeker.availability] || seeker.availability,
        location: seeker.location?.cityName || null,
        distanceKm: null,
        viewsCount: seeker.viewsCount || 0,
        lastActiveAt: seeker.lastActiveAt,
        createdAt: seeker.createdAt,
      }));
    }

    const total = await JobSeeker.countDocuments(filter);

    res.json({
      items: seekers,
      total,
      categories: Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label })),
    });
  } catch (error) {
    console.error('[JobSeekers] Error:', error);
    res.status(500).json({ error: 'Failed to fetch job seekers' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const seeker = await JobSeeker.findById(req.params.id).lean();
    
    if (!seeker) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }

    await JobSeeker.updateOne(
      { _id: seeker._id },
      { $inc: { viewsCount: 1 } }
    );

    res.json({
      id: seeker._id.toString(),
      name: seeker.name,
      photo: seeker.photo,
      age: seeker.age,
      phone: seeker.phone,
      skills: seeker.skills || [],
      category: seeker.category,
      categoryLabel: CATEGORY_LABELS[seeker.category] || seeker.category,
      description: seeker.description,
      experience: seeker.experience,
      hourlyRate: seeker.hourlyRate,
      currency: seeker.currency || 'BYN',
      availability: seeker.availability,
      availabilityLabel: AVAILABILITY_LABELS[seeker.availability] || seeker.availability,
      location: seeker.location?.cityName || null,
      radiusKm: seeker.radiusKm,
      viewsCount: (seeker.viewsCount || 0) + 1,
      contactsCount: seeker.contactsCount || 0,
      lastActiveAt: seeker.lastActiveAt,
      createdAt: seeker.createdAt,
    });
  } catch (error) {
    console.error('[JobSeekers] Error fetching seeker:', error);
    res.status(500).json({ error: 'Failed to fetch job seeker' });
  }
});

export default router;
