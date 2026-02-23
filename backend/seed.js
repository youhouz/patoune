/**
 * Patoune - Seed Premium
 * Donnees realistes et riches pour demo
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');

const User = require('./src/models/User');
const Pet = require('./src/models/Pet');
const Product = require('./src/models/Product');
const PetSitter = require('./src/models/PetSitter');
const Review = require('./src/models/Review');
const Booking = require('./src/models/Booking');
const ScanHistory = require('./src/models/ScanHistory');
const Message = require('./src/models/Message');

const seed = async () => {
  await connectDB();

  console.log('Nettoyage de la base...');
  await Promise.all([
    User.deleteMany({}), Pet.deleteMany({}), Product.deleteMany({}),
    PetSitter.deleteMany({}), Review.deleteMany({}),
    Booking.deleteMany({}), ScanHistory.deleteMany({}), Message.deleteMany({}),
  ]);

  // ═══════════════════════════════════════
  // UTILISATEURS (8 profils realistes)
  // ═══════════════════════════════════════
  console.log('Creation des utilisateurs...');
  const users = await User.create([
    {
      name: 'Marie Dupont', email: 'marie@test.com', password: 'password123',
      phone: '06 12 34 56 78',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
      role: 'user',
      address: { street: '15 rue de Rivoli', city: 'Paris', postalCode: '75004', country: 'France' },
      location: { type: 'Point', coordinates: [2.3522, 48.8566] },
      isPetSitter: false,
    },
    {
      name: 'Thomas Martin', email: 'thomas@test.com', password: 'password123',
      phone: '06 98 76 54 32',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      role: 'guardian',
      address: { street: '8 avenue du Chateau', city: 'Vincennes', postalCode: '94300', country: 'France' },
      location: { type: 'Point', coordinates: [2.4350, 48.8477] },
      isPetSitter: true,
    },
    {
      name: 'Sophie Bernard', email: 'sophie@test.com', password: 'password123',
      phone: '07 11 22 33 44',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      role: 'both',
      address: { street: '42 rue de Sevres', city: 'Boulogne-Billancourt', postalCode: '92100', country: 'France' },
      location: { type: 'Point', coordinates: [2.2400, 48.8396] },
      isPetSitter: true,
    },
    {
      name: 'Lucas Petit', email: 'lucas@test.com', password: 'password123',
      phone: '06 55 66 77 88',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face',
      role: 'guardian',
      address: { street: '3 rue Laferriere', city: 'Maisons-Alfort', postalCode: '94700', country: 'France' },
      location: { type: 'Point', coordinates: [2.4380, 48.8080] },
      isPetSitter: true,
    },
    {
      name: 'Camille Leroy', email: 'camille@test.com', password: 'password123',
      phone: '06 23 45 67 89',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
      role: 'guardian',
      address: { street: '17 rue Louis Blanc', city: 'Levallois-Perret', postalCode: '92300', country: 'France' },
      location: { type: 'Point', coordinates: [2.2870, 48.8935] },
      isPetSitter: true,
    },
    {
      name: 'Julie Moreau', email: 'julie@test.com', password: 'password123',
      phone: '07 34 56 78 90',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      role: 'guardian',
      address: { street: '56 avenue du Maine', city: 'Paris', postalCode: '75014', country: 'France' },
      location: { type: 'Point', coordinates: [2.3167, 48.8322] },
      isPetSitter: true,
    },
    {
      name: 'Antoine Girard', email: 'antoine@test.com', password: 'password123',
      phone: '06 45 67 89 01',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
      role: 'guardian',
      address: { street: '12 rue de Paris', city: 'Montreuil', postalCode: '93100', country: 'France' },
      location: { type: 'Point', coordinates: [2.4430, 48.8640] },
      isPetSitter: true,
    },
    {
      name: 'Emma Rousseau', email: 'emma@test.com', password: 'password123',
      phone: '07 56 78 90 12',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      role: 'user',
      address: { street: '29 rue de la Convention', city: 'Paris', postalCode: '75015', country: 'France' },
      location: { type: 'Point', coordinates: [2.2920, 48.8420] },
      isPetSitter: false,
    },
  ]);

  // ═══════════════════════════════════════
  // ANIMAUX (10 animaux varies)
  // ═══════════════════════════════════════
  console.log('Creation des animaux...');
  const pets = await Pet.create([
    {
      owner: users[0]._id, name: 'Rex', species: 'chien', breed: 'Labrador Retriever',
      age: 4, weight: 30, gender: 'male', vaccinated: true,
      photos: [
        'https://images.unsplash.com/photo-1579213838058-4a30e2344bd8?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1605897472198-242be42d1a71?w=600&h=600&fit=crop',
      ],
      description: 'Chien tres joueur et affectueux. Adore les promenades au parc et jouer a la balle. Tres sociable avec les autres chiens.',
    },
    {
      owner: users[0]._id, name: 'Luna', species: 'chat', breed: 'British Shorthair',
      age: 2, weight: 4.5, gender: 'femelle', vaccinated: true,
      specialNeeds: 'Regime sans cereales',
      photos: [
        'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600&h=600&fit=crop',
      ],
      description: 'Chatte calme et caline. Adore se blottir sur le canape. Habituee aux enfants.',
    },
    {
      owner: users[0]._id, name: 'Coco', species: 'oiseau', breed: 'Perruche ondulee',
      age: 1, weight: 0.035, gender: 'male', vaccinated: false,
      photos: [
        'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=600&fit=crop',
      ],
      description: 'Perruche vive et bavarde. Commence a repeter quelques mots.',
    },
    {
      owner: users[1]._id, name: 'Buddy', species: 'chien', breed: 'Golden Retriever',
      age: 6, weight: 35, gender: 'male', vaccinated: true,
      photos: [
        'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1625316708582-7c38734be31d?w=600&h=600&fit=crop',
      ],
      description: 'Le meilleur ami de tout le monde. Tres doux avec les enfants et les personnes agees.',
    },
    {
      owner: users[2]._id, name: 'Noisette', species: 'rongeur', breed: 'Hamster dore',
      age: 1, weight: 0.15, gender: 'femelle', vaccinated: false,
      photos: [
        'https://images.unsplash.com/photo-1425082661507-d6d2f85d15be?w=600&h=600&fit=crop',
      ],
      description: 'Petit hamster energique qui adore sa roue. Mange bien et est en pleine forme.',
    },
    {
      owner: users[4]._id, name: 'Oscar', species: 'chat', breed: 'Maine Coon',
      age: 3, weight: 7, gender: 'male', vaccinated: true,
      photos: [
        'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=600&h=600&fit=crop',
      ],
      description: 'Grand chat majestueux et tres doux. Sociable mais independant.',
    },
    {
      owner: users[5]._id, name: 'Bella', species: 'chien', breed: 'Cavalier King Charles',
      age: 5, weight: 8, gender: 'femelle', vaccinated: true,
      specialNeeds: 'Traitement cardiaque quotidien',
      photos: [
        'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop',
      ],
      description: 'Petite chienne adorable et tres douce. Besoin de promenades calmes.',
    },
    {
      owner: users[7]._id, name: 'Simba', species: 'chat', breed: 'Abyssin',
      age: 4, weight: 5, gender: 'male', vaccinated: true,
      photos: [
        'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600&h=600&fit=crop',
      ],
      description: 'Chat actif et curieux. Adore explorer et grimper partout.',
    },
    {
      owner: users[7]._id, name: 'Speedy', species: 'reptile', breed: 'Tortue Hermann',
      age: 12, weight: 1.2, gender: 'femelle', vaccinated: false,
      specialNeeds: 'Lampe UV obligatoire, temperature 25-30C',
      photos: [
        'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&h=600&fit=crop',
      ],
      description: 'Tortue en bonne sante, mange principalement des herbes et legumes frais.',
    },
    {
      owner: users[3]._id, name: 'Rocky', species: 'chien', breed: 'Berger Australien',
      age: 2, weight: 25, gender: 'male', vaccinated: true,
      photos: [
        'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&h=600&fit=crop',
      ],
      description: 'Chien tres energique et intelligent. A besoin de beaucoup d\'exercice et de stimulation mentale.',
    },
  ]);

  // ═══════════════════════════════════════
  // PRODUITS (15 produits realistes)
  // ═══════════════════════════════════════
  console.log('Creation des produits...');
  const products = await Product.create([
    // --- ALIMENTATION CHIEN ---
    {
      barcode: '3017620422003', name: 'Royal Canin Maxi Adult', brand: 'Royal Canin',
      category: 'alimentation', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Viande de poulet deshydratee', isControversial: false, risk: 'safe' },
        { name: 'Riz', isControversial: false, risk: 'safe' },
        { name: 'Graisses animales', isControversial: false, risk: 'safe' },
        { name: 'Mais', isControversial: true, risk: 'moderate' },
        { name: 'Proteines de volaille hydrolysees', isControversial: false, risk: 'safe' },
        { name: 'Pulpe de betterave', isControversial: false, risk: 'safe' },
        { name: 'Huile de poisson', isControversial: false, risk: 'safe' },
      ],
      additives: [
        { code: 'E321', name: 'BHT (antioxydant)', risk: 'dangerous' },
        { code: 'E330', name: 'Acide citrique', risk: 'moderate' },
      ],
      nutritionScore: 62,
      scoreDetails: { protein: 3, fat: 0, fiber: 1, additivesPenalty: 14, qualityBonus: 5 },
    },
    {
      barcode: '4008429073860', name: 'Acana Wild Prairie', brand: 'Acana',
      category: 'alimentation', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Viande fraiche de poulet (16%)', isControversial: false, risk: 'safe' },
        { name: 'Viande fraiche de dinde (10%)', isControversial: false, risk: 'safe' },
        { name: 'Oeufs entiers (10%)', isControversial: false, risk: 'safe' },
        { name: 'Poulet deshydrate (10%)', isControversial: false, risk: 'safe' },
        { name: 'Lentilles rouges', isControversial: false, risk: 'safe' },
        { name: 'Pois chiches', isControversial: false, risk: 'safe' },
        { name: 'Foie de poulet lyophilise', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 91,
      scoreDetails: { protein: 5, fat: 3, fiber: 3, additivesPenalty: 0, qualityBonus: 15 },
    },
    {
      barcode: '8710255130002', name: 'Orijen Original Dog', brand: 'Orijen',
      category: 'alimentation', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Poulet frais desossee (25%)', isControversial: false, risk: 'safe' },
        { name: 'Dinde fraiche (8%)', isControversial: false, risk: 'safe' },
        { name: 'Oeufs entiers frais (8%)', isControversial: false, risk: 'safe' },
        { name: 'Foie de poulet frais (5%)', isControversial: false, risk: 'safe' },
        { name: 'Hareng frais (4%)', isControversial: false, risk: 'safe' },
        { name: 'Patates douces', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 95,
      scoreDetails: { protein: 5, fat: 4, fiber: 3, additivesPenalty: 0, qualityBonus: 18 },
    },
    {
      barcode: '3564700266236', name: 'Pedigree Vital Protection Adult', brand: 'Pedigree',
      category: 'alimentation', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1589924749163-2e2f7b490e2e?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Cereales', isControversial: true, risk: 'moderate' },
        { name: 'Viandes et sous-produits animaux (dont 4% poulet)', isControversial: true, risk: 'moderate' },
        { name: 'Huiles et graisses', isControversial: false, risk: 'safe' },
        { name: 'Sous-produits d\'origine vegetale', isControversial: true, risk: 'moderate' },
        { name: 'Sucres', isControversial: true, risk: 'dangerous' },
        { name: 'Mineraux', isControversial: false, risk: 'safe' },
      ],
      additives: [
        { code: 'E150c', name: 'Caramel ammoniacal', risk: 'dangerous' },
        { code: 'E321', name: 'BHT', risk: 'dangerous' },
        { code: 'E310', name: 'Gallate de propyle', risk: 'moderate' },
      ],
      nutritionScore: 31,
      scoreDetails: { protein: 0, fat: -2, fiber: 0, additivesPenalty: 24, qualityBonus: 0 },
    },
    // --- ALIMENTATION CHAT ---
    {
      barcode: '3182550702225', name: 'Pro Plan Adult Chat Poulet', brand: 'Purina Pro Plan',
      category: 'alimentation', targetAnimal: ['chat'],
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Poulet frais (20%)', isControversial: false, risk: 'safe' },
        { name: 'Proteine de poulet deshydratee', isControversial: false, risk: 'safe' },
        { name: 'Riz', isControversial: false, risk: 'safe' },
        { name: 'Gluten de mais', isControversial: true, risk: 'moderate' },
        { name: 'Graisse animale', isControversial: false, risk: 'safe' },
      ],
      additives: [{ code: 'E202', name: 'Sorbate de potassium', risk: 'moderate' }],
      nutritionScore: 71,
      scoreDetails: { protein: 5, fat: 0, fiber: 1, additivesPenalty: 4, qualityBonus: 10 },
    },
    {
      barcode: '5410340620007', name: 'Whiskas Sachets fraicheur Poisson', brand: 'Whiskas',
      category: 'alimentation', targetAnimal: ['chat'],
      image: 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Sous-produits animaux', isControversial: true, risk: 'moderate' },
        { name: 'Poisson et sous-produits (4%)', isControversial: false, risk: 'safe' },
        { name: 'Cereales', isControversial: true, risk: 'moderate' },
        { name: 'Sucre', isControversial: true, risk: 'dangerous' },
        { name: 'Colorants artificiels', isControversial: true, risk: 'dangerous' },
      ],
      additives: [
        { code: 'E129', name: 'Rouge allura AC', risk: 'dangerous' },
        { code: 'E250', name: 'Nitrite de sodium', risk: 'dangerous' },
        { code: 'E621', name: 'Glutamate monosodique', risk: 'moderate' },
      ],
      nutritionScore: 22,
      scoreDetails: { protein: 0, fat: -3, fiber: 0, additivesPenalty: 28, qualityBonus: 0 },
    },
    {
      barcode: '4260215761024', name: 'Applaws Chat Poulet & Saumon', brand: 'Applaws',
      category: 'alimentation', targetAnimal: ['chat'],
      image: 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Filet de poulet (55%)', isControversial: false, risk: 'safe' },
        { name: 'Saumon (25%)', isControversial: false, risk: 'safe' },
        { name: 'Bouillon de cuisson naturel', isControversial: false, risk: 'safe' },
        { name: 'Riz (1%)', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 93,
      scoreDetails: { protein: 5, fat: 4, fiber: 2, additivesPenalty: 0, qualityBonus: 17 },
    },
    // --- FRIANDISES ---
    {
      barcode: '4007817602270', name: 'Dreamies Mix Poulet & Canard', brand: 'Dreamies',
      category: 'alimentation', targetAnimal: ['chat'],
      image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Cereales', isControversial: true, risk: 'moderate' },
        { name: 'Viande et sous-produits animaux (8%)', isControversial: true, risk: 'moderate' },
        { name: 'Huiles et graisses', isControversial: false, risk: 'safe' },
        { name: 'Sous-produits vegetaux', isControversial: true, risk: 'moderate' },
      ],
      additives: [{ code: 'E150', name: 'Caramel', risk: 'moderate' }],
      nutritionScore: 38,
      scoreDetails: { protein: 1, fat: -1, fiber: 0, additivesPenalty: 10, qualityBonus: 0 },
    },
    {
      barcode: '4011905836407', name: 'Trixie Os a macher boeuf', brand: 'Trixie',
      category: 'alimentation', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Cuir de boeuf (100%)', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 82,
      scoreDetails: { protein: 4, fat: 1, fiber: 0, additivesPenalty: 0, qualityBonus: 12 },
    },
    // --- SOINS ---
    {
      barcode: '3228857000166', name: 'Frontline Combo Chat', brand: 'Frontline',
      category: 'soin', targetAnimal: ['chat'],
      image: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Fipronil (9.8%)', isControversial: false, risk: 'safe' },
        { name: 'S-methoprene (11.8%)', isControversial: false, risk: 'safe' },
        { name: 'Butylhydroxyanisole (BHA)', isControversial: true, risk: 'moderate' },
      ],
      additives: [],
      nutritionScore: 79,
      scoreDetails: { protein: 0, fat: 0, fiber: 0, additivesPenalty: 5, qualityBonus: 0 },
    },
    {
      barcode: '3661168002439', name: 'Advantix Chien Moyen', brand: 'Advantix',
      category: 'soin', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Imidaclopride (100mg)', isControversial: false, risk: 'safe' },
        { name: 'Permethrine (500mg)', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 85,
      scoreDetails: { protein: 0, fat: 0, fiber: 0, additivesPenalty: 0, qualityBonus: 0 },
    },
    // --- HYGIENE ---
    {
      barcode: '8710255140001', name: 'Beaphar Shampooing Doux Universel', brand: 'Beaphar',
      category: 'hygiene', targetAnimal: ['chien', 'chat'],
      image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Eau purifiee', isControversial: false, risk: 'safe' },
        { name: 'Aloe vera bio', isControversial: false, risk: 'safe' },
        { name: 'Tensioactifs doux vegetaux', isControversial: false, risk: 'safe' },
        { name: 'Huile de macadamia', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 90,
      scoreDetails: { protein: 0, fat: 0, fiber: 0, additivesPenalty: 0, qualityBonus: 5 },
    },
    {
      barcode: '3595471023456', name: 'Francodex Spray Anti-Stress', brand: 'Francodex',
      category: 'soin', targetAnimal: ['chat', 'chien'],
      image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Valeriane', isControversial: false, risk: 'safe' },
        { name: 'Camomille', isControversial: false, risk: 'safe' },
        { name: 'Pheromones apaisantes', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 87,
      scoreDetails: { protein: 0, fat: 0, fiber: 0, additivesPenalty: 0, qualityBonus: 2 },
    },
    // --- ACCESSOIRES ---
    {
      barcode: '4047059414422', name: 'Kong Classic Rouge Taille M', brand: 'Kong',
      category: 'jouet', targetAnimal: ['chien'],
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Caoutchouc naturel non toxique', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 92,
      scoreDetails: { protein: 0, fat: 0, fiber: 0, additivesPenalty: 0, qualityBonus: 7 },
    },
    {
      barcode: '3281011487500', name: 'Catit Fontaine a eau 3L', brand: 'Catit',
      category: 'accessoire', targetAnimal: ['chat'],
      image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Plastique BPA-free', isControversial: false, risk: 'safe' },
        { name: 'Filtre charbon actif', isControversial: false, risk: 'safe' },
      ],
      additives: [],
      nutritionScore: 94,
      scoreDetails: { protein: 0, fat: 0, fiber: 0, additivesPenalty: 0, qualityBonus: 9 },
    },
  ]);

  // ═══════════════════════════════════════
  // PET SITTERS (6 gardiens)
  // ═══════════════════════════════════════
  console.log('Creation des gardiens...');
  const sitters = await PetSitter.create([
    {
      user: users[1]._id,
      bio: 'Passione par les animaux depuis toujours ! Ancien eleveur canin, je m\'occupe de vos compagnons comme des miens. Grande maison avec jardin clos de 200m2. References disponibles sur demande.',
      experience: 5,
      acceptedAnimals: ['chien', 'chat'],
      services: ['garde_domicile', 'promenade', 'visite', 'garde_chez_sitter'],
      pricePerDay: 25, pricePerHour: 12,
      photos: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop',
      ],
      availability: [
        { day: 'lundi', startTime: '07:00', endTime: '20:00' },
        { day: 'mardi', startTime: '07:00', endTime: '20:00' },
        { day: 'mercredi', startTime: '07:00', endTime: '20:00' },
        { day: 'jeudi', startTime: '07:00', endTime: '20:00' },
        { day: 'vendredi', startTime: '07:00', endTime: '20:00' },
        { day: 'samedi', startTime: '08:00', endTime: '18:00' },
      ],
      location: { type: 'Point', coordinates: [2.4350, 48.8477] },
      radius: 15, rating: 4.8, reviewCount: 47, verified: true,
    },
    {
      user: users[2]._id,
      bio: 'Veterinaire diplomee, je propose des gardes premium avec suivi medical inclus. Specialisee en NAC (rongeurs, oiseaux, reptiles). Votre animal sera entre les meilleures mains possibles !',
      experience: 8,
      acceptedAnimals: ['chien', 'chat', 'rongeur', 'oiseau', 'reptile'],
      services: ['garde_domicile', 'garde_chez_sitter', 'visite', 'toilettage'],
      pricePerDay: 38, pricePerHour: 20,
      photos: [
        'https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
      ],
      availability: [
        { day: 'lundi', startTime: '07:00', endTime: '20:00' },
        { day: 'mercredi', startTime: '07:00', endTime: '20:00' },
        { day: 'vendredi', startTime: '07:00', endTime: '20:00' },
        { day: 'samedi', startTime: '08:00', endTime: '18:00' },
        { day: 'dimanche', startTime: '08:00', endTime: '18:00' },
      ],
      location: { type: 'Point', coordinates: [2.2400, 48.8396] },
      radius: 10, rating: 4.9, reviewCount: 82, verified: true,
    },
    {
      user: users[3]._id,
      bio: 'Etudiant en comportement animal a Maisons-Alfort. Promenades dynamiques avec jeux et stimulation mentale. Ideal pour chiens energiques qui ont besoin de se depenser !',
      experience: 2,
      acceptedAnimals: ['chien'],
      services: ['promenade', 'visite'],
      pricePerDay: 18, pricePerHour: 10,
      photos: [
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=400&fit=crop',
      ],
      availability: [
        { day: 'lundi', startTime: '14:00', endTime: '20:00' },
        { day: 'mardi', startTime: '14:00', endTime: '20:00' },
        { day: 'mercredi', startTime: '08:00', endTime: '20:00' },
        { day: 'samedi', startTime: '08:00', endTime: '20:00' },
        { day: 'dimanche', startTime: '08:00', endTime: '20:00' },
      ],
      location: { type: 'Point', coordinates: [2.4380, 48.8080] },
      radius: 20, rating: 4.5, reviewCount: 15, verified: false,
    },
    {
      user: users[4]._id,
      bio: 'Educatrice canine certifiee. Je combine garde et education positive pour votre chien. Chaque garde est l\'occasion d\'apprendre et de progresser ensemble !',
      experience: 6,
      acceptedAnimals: ['chien', 'chat'],
      services: ['garde_domicile', 'promenade', 'garde_chez_sitter', 'toilettage'],
      pricePerDay: 32, pricePerHour: 15,
      photos: [
        'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1587764379990-bcc0c1e15c46?w=600&h=400&fit=crop',
      ],
      availability: [
        { day: 'lundi', startTime: '08:00', endTime: '19:00' },
        { day: 'mardi', startTime: '08:00', endTime: '19:00' },
        { day: 'mercredi', startTime: '08:00', endTime: '19:00' },
        { day: 'jeudi', startTime: '08:00', endTime: '19:00' },
        { day: 'vendredi', startTime: '08:00', endTime: '19:00' },
      ],
      location: { type: 'Point', coordinates: [2.2870, 48.8935] },
      radius: 12, rating: 4.7, reviewCount: 34, verified: true,
    },
    {
      user: users[5]._id,
      bio: 'Retraitee amoureuse des animaux. Je vis dans un appartement calme avec balcon, ideal pour les chats et petits chiens. Disponible 7j/7 et tres flexible sur les horaires.',
      experience: 10,
      acceptedAnimals: ['chat', 'rongeur', 'oiseau'],
      services: ['garde_domicile', 'garde_chez_sitter', 'visite'],
      pricePerDay: 20, pricePerHour: 8,
      photos: [
        'https://images.unsplash.com/photo-1545529468-42764ef8c85f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=600&h=400&fit=crop',
      ],
      availability: [
        { day: 'lundi', startTime: '06:00', endTime: '22:00' },
        { day: 'mardi', startTime: '06:00', endTime: '22:00' },
        { day: 'mercredi', startTime: '06:00', endTime: '22:00' },
        { day: 'jeudi', startTime: '06:00', endTime: '22:00' },
        { day: 'vendredi', startTime: '06:00', endTime: '22:00' },
        { day: 'samedi', startTime: '06:00', endTime: '22:00' },
        { day: 'dimanche', startTime: '06:00', endTime: '22:00' },
      ],
      location: { type: 'Point', coordinates: [2.3167, 48.8322] },
      radius: 8, rating: 4.6, reviewCount: 56, verified: true,
    },
    {
      user: users[6]._id,
      bio: 'Photographe animalier et pet-sitter. Je vous envoie des photos et videos de votre animal tout au long de la garde. Chaque moment est capture !',
      experience: 3,
      acceptedAnimals: ['chien', 'chat'],
      services: ['promenade', 'visite', 'garde_domicile'],
      pricePerDay: 28, pricePerHour: 14,
      photos: [
        'https://images.unsplash.com/photo-1477884213360-7e9d7dcc8f9a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600&h=400&fit=crop',
      ],
      availability: [
        { day: 'mardi', startTime: '09:00', endTime: '18:00' },
        { day: 'jeudi', startTime: '09:00', endTime: '18:00' },
        { day: 'samedi', startTime: '08:00', endTime: '20:00' },
        { day: 'dimanche', startTime: '08:00', endTime: '20:00' },
      ],
      location: { type: 'Point', coordinates: [2.4430, 48.8640] },
      radius: 15, rating: 4.4, reviewCount: 12, verified: false,
    },
  ]);

  // ═══════════════════════════════════════
  // HISTORIQUE DE SCANS pour Marie
  // ═══════════════════════════════════════
  console.log('Creation de l\'historique de scans...');
  const now = new Date();
  await ScanHistory.create([
    { user: users[0]._id, product: products[0]._id, scannedAt: new Date(now - 1000 * 60 * 30) },
    { user: users[0]._id, product: products[1]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 2) },
    { user: users[0]._id, product: products[4]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 24) },
    { user: users[0]._id, product: products[5]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 24) },
    { user: users[0]._id, product: products[6]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 48) },
    { user: users[0]._id, product: products[11]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 72) },
    { user: users[0]._id, product: products[3]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 96) },
    { user: users[0]._id, product: products[13]._id, scannedAt: new Date(now - 1000 * 60 * 60 * 120) },
  ]);

  // ═══════════════════════════════════════
  // RESERVATIONS (12 completed + 3 active)
  // ═══════════════════════════════════════
  console.log('Creation des reservations...');
  const DAY = 1000 * 60 * 60 * 24;
  const bookings = await Booking.create([
    // --- Active bookings pour Marie ---
    {
      owner: users[0]._id, sitter: sitters[0]._id, pet: pets[0]._id,
      service: 'garde_domicile',
      startDate: new Date(now.getTime() + DAY * 3), endDate: new Date(now.getTime() + DAY * 5),
      totalPrice: 50, status: 'confirmed',
      notes: 'Rex mange 2 fois par jour. Croquettes dans le placard de la cuisine.',
    },
    {
      owner: users[0]._id, sitter: sitters[1]._id, pet: pets[1]._id,
      service: 'visite',
      startDate: new Date(now.getTime() + DAY * 10), endDate: new Date(now.getTime() + DAY * 12),
      totalPrice: 76, status: 'pending',
      notes: 'Luna a un regime special sans cereales. Sachets dans le frigo.',
    },
    // --- Completed bookings (pour rattacher aux reviews) ---
    // Thomas (sitters[0])
    { owner: users[0]._id, sitter: sitters[0]._id, pet: pets[0]._id, service: 'garde_domicile',
      startDate: new Date(now.getTime() - DAY * 30), endDate: new Date(now.getTime() - DAY * 28),
      totalPrice: 50, status: 'completed' },
    { owner: users[7]._id, sitter: sitters[0]._id, pet: pets[7]._id, service: 'garde_domicile',
      startDate: new Date(now.getTime() - DAY * 25), endDate: new Date(now.getTime() - DAY * 23),
      totalPrice: 50, status: 'completed' },
    { owner: users[4]._id, sitter: sitters[0]._id, pet: pets[5]._id, service: 'garde_chez_sitter',
      startDate: new Date(now.getTime() - DAY * 20), endDate: new Date(now.getTime() - DAY * 18),
      totalPrice: 50, status: 'completed' },
    // Sophie (sitters[1])
    { owner: users[0]._id, sitter: sitters[1]._id, pet: pets[1]._id, service: 'visite',
      startDate: new Date(now.getTime() - DAY * 40), endDate: new Date(now.getTime() - DAY * 38),
      totalPrice: 76, status: 'completed' },
    { owner: users[7]._id, sitter: sitters[1]._id, pet: pets[8]._id, service: 'garde_domicile',
      startDate: new Date(now.getTime() - DAY * 35), endDate: new Date(now.getTime() - DAY * 33),
      totalPrice: 114, status: 'completed' },
    { owner: users[3]._id, sitter: sitters[1]._id, pet: pets[9]._id, service: 'garde_chez_sitter',
      startDate: new Date(now.getTime() - DAY * 15), endDate: new Date(now.getTime() - DAY * 13),
      totalPrice: 76, status: 'completed' },
    // Lucas (sitters[2])
    { owner: users[0]._id, sitter: sitters[2]._id, pet: pets[0]._id, service: 'promenade',
      startDate: new Date(now.getTime() - DAY * 5), endDate: new Date(now.getTime() - DAY * 5),
      totalPrice: 10, status: 'completed' },
    { owner: users[1]._id, sitter: sitters[2]._id, pet: pets[3]._id, service: 'promenade',
      startDate: new Date(now.getTime() - DAY * 10), endDate: new Date(now.getTime() - DAY * 10),
      totalPrice: 10, status: 'completed' },
    // Camille (sitters[3])
    { owner: users[0]._id, sitter: sitters[3]._id, pet: pets[0]._id, service: 'garde_domicile',
      startDate: new Date(now.getTime() - DAY * 50), endDate: new Date(now.getTime() - DAY * 47),
      totalPrice: 96, status: 'completed' },
    { owner: users[7]._id, sitter: sitters[3]._id, pet: pets[7]._id, service: 'garde_domicile',
      startDate: new Date(now.getTime() - DAY * 45), endDate: new Date(now.getTime() - DAY * 43),
      totalPrice: 64, status: 'completed' },
    // Julie (sitters[4])
    { owner: users[0]._id, sitter: sitters[4]._id, pet: pets[2]._id, service: 'garde_domicile',
      startDate: new Date(now.getTime() - DAY * 60), endDate: new Date(now.getTime() - DAY * 57),
      totalPrice: 60, status: 'completed' },
    { owner: users[4]._id, sitter: sitters[4]._id, pet: pets[5]._id, service: 'garde_chez_sitter',
      startDate: new Date(now.getTime() - DAY * 55), endDate: new Date(now.getTime() - DAY * 53),
      totalPrice: 40, status: 'completed' },
  ]);

  // ═══════════════════════════════════════
  // AVIS REALISTES (avec booking refs)
  // ═══════════════════════════════════════
  console.log('Creation des avis...');
  const reviews = await Review.create([
    // Avis pour Thomas (sitters[0]) — bookings[2,3,4]
    { author: users[0]._id, petsitter: sitters[0]._id, booking: bookings[2]._id, rating: 5,
      comment: 'Thomas est incroyable ! Rex n\'a jamais ete aussi bien garde. Il m\'a envoye des photos tous les jours et Rex ne voulait plus partir. Je recommande a 200% !' },
    { author: users[7]._id, petsitter: sitters[0]._id, booking: bookings[3]._id, rating: 5,
      comment: 'Excellent gardien, tres professionnel. Mon chat etait detendu a mon retour, ce qui est tres rare. Thomas connait vraiment les animaux.' },
    { author: users[4]._id, petsitter: sitters[0]._id, booking: bookings[4]._id, rating: 4,
      comment: 'Tres bon service. Oscar a bien mange et Thomas a respecte ses horaires de jeux. Seul petit bemol : le jardin pourrait etre mieux cloture.' },
    // Avis pour Sophie (sitters[1]) — bookings[5,6,7]
    { author: users[0]._id, petsitter: sitters[1]._id, booking: bookings[5]._id, rating: 5,
      comment: 'En tant que veterinaire, Sophie a detecte un petit probleme de peau chez Luna que je n\'avais pas vu. Grace a elle, on a pu traiter tot. Merci infiniment !' },
    { author: users[7]._id, petsitter: sitters[1]._id, booking: bookings[6]._id, rating: 5,
      comment: 'La meilleure gardienne pour notre tortue Speedy. Elle connait parfaitement les NAC et a meme ameliore l\'installation UV. Prix un peu eleve mais ca vaut le coup.' },
    { author: users[3]._id, petsitter: sitters[1]._id, booking: bookings[7]._id, rating: 5,
      comment: 'Sophie est exceptionnelle. Rocky etait propre, nourri et heureux. Elle m\'a meme donne des conseils nutritionnels gratuits pour son alimentation.' },
    // Avis pour Lucas (sitters[2]) — bookings[8,9]
    { author: users[0]._id, petsitter: sitters[2]._id, booking: bookings[8]._id, rating: 4,
      comment: 'Lucas est super avec les chiens ! Rex adore ses promenades. Il le fait courir et jouer pendant 1h. Par contre, il est parfois en retard de 10 min.' },
    { author: users[1]._id, petsitter: sitters[2]._id, booking: bookings[9]._id, rating: 5,
      comment: 'Mon Buddy revient toujours fatigue et heureux de ses promenades avec Lucas. Top pour les chiens energiques !' },
    // Avis pour Camille (sitters[3]) — bookings[10,11]
    { author: users[0]._id, petsitter: sitters[3]._id, booking: bookings[10]._id, rating: 5,
      comment: 'Camille a fait des miracles avec Rex ! En plus de le garder, elle lui a appris le rappel. Je suis bluffee par son professionnalisme.' },
    { author: users[7]._id, petsitter: sitters[3]._id, booking: bookings[11]._id, rating: 4,
      comment: 'Tres bonne educatrice, Simba est plus calme depuis sa garde. Le tarif est un peu eleve mais le resultat est la.' },
    // Avis pour Julie (sitters[4]) — bookings[12,13]
    { author: users[0]._id, petsitter: sitters[4]._id, booking: bookings[12]._id, rating: 5,
      comment: 'Julie est adorable et tres disponible. Mon Coco (perruche) etait en pleine forme a mon retour. Elle a meme nettoye sa cage !' },
    { author: users[4]._id, petsitter: sitters[4]._id, booking: bookings[13]._id, rating: 4,
      comment: 'Julie prend bien soin des animaux. Oscar a ete gate. Appartement un peu petit mais elle compense par beaucoup d\'attention.' },
  ]);

  // ═══════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════
  console.log('Creation des messages...');
  const conv1 = [users[0]._id, users[1]._id].sort().join('_');
  const conv2 = [users[0]._id, users[2]._id].sort().join('_');
  await Message.create([
    { sender: users[0]._id, receiver: users[1]._id, conversation: conv1,
      content: 'Bonjour Thomas ! Est-ce que vous seriez disponible la semaine prochaine pour garder Rex ?',
      createdAt: new Date(now - 1000 * 60 * 60 * 4) },
    { sender: users[1]._id, receiver: users[0]._id, conversation: conv1,
      content: 'Bonjour Marie ! Oui bien sur, quelles dates exactement ?',
      createdAt: new Date(now - 1000 * 60 * 60 * 3.5) },
    { sender: users[0]._id, receiver: users[1]._id, conversation: conv1,
      content: 'Du mercredi au vendredi, ca serait possible ?',
      createdAt: new Date(now - 1000 * 60 * 60 * 3) },
    { sender: users[1]._id, receiver: users[0]._id, conversation: conv1,
      content: 'Parfait, c\'est note ! Rex va adorer le jardin. J\'ai achete de nouveaux jouets justement 😄',
      createdAt: new Date(now - 1000 * 60 * 60 * 2.5) },
    { sender: users[0]._id, receiver: users[1]._id, conversation: conv1,
      content: 'Super merci ! Je vous fais la reservation alors.',
      createdAt: new Date(now - 1000 * 60 * 60 * 2) },
    { sender: users[0]._id, receiver: users[2]._id, conversation: conv2,
      content: 'Bonjour Sophie, je souhaiterais prendre rdv pour un bilan de Luna.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24) },
    { sender: users[2]._id, receiver: users[0]._id, conversation: conv2,
      content: 'Bonjour Marie ! Avec plaisir. Luna est la British Shorthair, c\'est ca ? Je peux la voir des la semaine prochaine.',
      createdAt: new Date(now - 1000 * 60 * 60 * 23) },
  ]);

  // ═══════════════════════════════════════
  console.log('\n' + '='.repeat(50));
  console.log('   PATOUNE - SEED PREMIUM TERMINE !');
  console.log('='.repeat(50));
  console.log('\n📱 Comptes de test:');
  console.log('   marie@test.com / password123 (proprietaire, 3 animaux)');
  console.log('   thomas@test.com / password123 (gardien ★4.8)');
  console.log('   sophie@test.com / password123 (veterinaire ★4.9)');
  console.log('   camille@test.com / password123 (educatrice ★4.7)');
  console.log('\n📊 Donnees:');
  console.log('   ' + users.length + ' utilisateurs');
  console.log('   ' + pets.length + ' animaux');
  console.log('   ' + products.length + ' produits');
  console.log('   ' + sitters.length + ' gardiens');
  console.log('   ' + reviews.length + ' avis');
  console.log('   8 scans historiques');
  console.log('   ' + bookings.length + ' reservations');
  console.log('   7 messages');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Erreur seed:', err);
  process.exit(1);
});
