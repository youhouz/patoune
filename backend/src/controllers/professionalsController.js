const Professional = require('../models/Professional');

// @desc    Rechercher des professionnels (par type + geo)
// @route   GET /api/professionals?type=veterinaire&lat=&lng=&radiusKm=&q=
exports.search = async (req, res, next) => {
  try {
    const { type, q } = req.query;
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = Math.min(200, Math.max(1, parseFloat(req.query.radiusKm) || 15));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    const filter = {};
    if (type) filter.type = type;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    let query;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      };
      query = Professional.find(filter);
    } else {
      // Sans geo, ranker les "featured" en premier
      query = Professional.find(filter).sort({ featuredUntil: -1, rating: -1 });
    }

    const pros = await query.limit(limit).lean();

    // Trier : featured d'abord (peu importe la distance)
    const now = Date.now();
    pros.sort((a, b) => {
      const fa = a.featuredUntil && new Date(a.featuredUntil).getTime() > now ? 1 : 0;
      const fb = b.featuredUntil && new Date(b.featuredUntil).getTime() > now ? 1 : 0;
      return fb - fa;
    });

    res.json({ success: true, count: pros.length, professionals: pros });
  } catch (err) {
    next(err);
  }
};

// @desc    Detail d'un professionnel
// @route   GET /api/professionals/:id
exports.getOne = async (req, res, next) => {
  try {
    const pro = await Professional.findById(req.params.id).lean();
    if (!pro) return res.status(404).json({ success: false, error: 'Professionnel introuvable' });
    Professional.updateOne({ _id: pro._id }, { $inc: { views: 1 } }).catch(() => {});
    res.json({ success: true, professional: pro });
  } catch (err) {
    next(err);
  }
};

// @desc    Tracer un contact (clic sur telephone / email / site)
// @route   POST /api/professionals/:id/contact
exports.trackContact = async (req, res, next) => {
  try {
    await Professional.updateOne({ _id: req.params.id }, { $inc: { contacts: 1 } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc    Creer / soumettre une fiche pro (pour users "pro" qui s'inscrivent)
// @route   POST /api/professionals
exports.create = async (req, res, next) => {
  try {
    const {
      type, name, description, phone, email, website, address,
      lat, lng, services, acceptedAnimals, hours, emergency, priceRange, photos, logo,
    } = req.body;

    if (!type || !name) return res.status(400).json({ success: false, error: 'Type et nom requis' });

    const data = {
      user: req.user.id,
      type, name, description, phone, email, website,
      address: address || {},
      services: services || [],
      acceptedAnimals: acceptedAnimals || [],
      hours: hours || {},
      emergency: Boolean(emergency),
      priceRange: priceRange || {},
      photos: photos || [],
      logo: logo || '',
    };
    if (typeof lat === 'number' && typeof lng === 'number') {
      data.location = { type: 'Point', coordinates: [lng, lat] };
    }

    const pro = await Professional.create(data);
    res.status(201).json({ success: true, professional: pro });
  } catch (err) {
    next(err);
  }
};

// @desc    Mettre a jour sa fiche
// @route   PATCH /api/professionals/:id
exports.update = async (req, res, next) => {
  try {
    const pro = await Professional.findById(req.params.id);
    if (!pro) return res.status(404).json({ success: false, error: 'Fiche introuvable' });
    if (!pro.user || pro.user.toString() !== req.user.id) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Non autorise' });
      }
    }

    const editable = [
      'name', 'description', 'phone', 'email', 'website', 'address',
      'services', 'acceptedAnimals', 'hours', 'emergency', 'priceRange', 'photos', 'logo',
    ];
    editable.forEach(k => {
      if (req.body[k] !== undefined) pro[k] = req.body[k];
    });
    if (typeof req.body.lat === 'number' && typeof req.body.lng === 'number') {
      pro.location = { type: 'Point', coordinates: [req.body.lng, req.body.lat] };
    }

    await pro.save();
    res.json({ success: true, professional: pro });
  } catch (err) {
    next(err);
  }
};
