const Product = require('../models/Product');
const Pet = require('../models/Pet');
const PetSitter = require('../models/PetSitter');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, products: [], pets: [], petsitters: [] });
    }

    const escaped = escapeRegex(q.trim());
    const regex = { $regex: escaped, $options: 'i' };

    const [products, pets, petsitters] = await Promise.all([
      // Produits : chercher par nom et marque
      Product.find({
        $or: [{ name: regex }, { brand: regex }]
      })
        .sort({ nutritionScore: -1 })
        .limit(10)
        .select('name brand nutritionScore category targetAnimal image'),

      // Animaux de l'utilisateur
      Pet.find({
        owner: req.user.id,
        $or: [{ name: regex }, { species: regex }, { breed: regex }]
      })
        .limit(10)
        .select('name species breed gender photo'),

      // Pet-sitters : chercher par bio + peupler le nom
      PetSitter.find({
        $or: [{ bio: regex }]
      })
        .populate('user', 'name avatar')
        .limit(10)
        .select('bio acceptedAnimals services pricePerDay rating user'),
    ]);

    // Aussi chercher les pet-sitters par nom d'utilisateur
    let petsittersByName = [];
    if (petsitters.length < 10) {
      const User = require('../models/User');
      const matchingUsers = await User.find({
        name: regex,
        isPetSitter: true
      }).select('_id').limit(10);

      if (matchingUsers.length > 0) {
        const existingIds = new Set(petsitters.map(ps => ps.user?._id?.toString()));
        const additionalSitters = await PetSitter.find({
          user: { $in: matchingUsers.map(u => u._id) },
          _id: { $nin: petsitters.map(ps => ps._id) }
        })
          .populate('user', 'name avatar')
          .limit(10 - petsitters.length)
          .select('bio acceptedAnimals services pricePerDay rating user');
        petsittersByName = additionalSitters;
      }
    }

    res.json({
      success: true,
      products,
      pets,
      petsitters: [...petsitters, ...petsittersByName],
    });
  } catch (error) {
    next(error);
  }
};
