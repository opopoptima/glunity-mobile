'use strict';

require('dotenv').config({ override: true });
const mongoose = require('mongoose');

const User = require('../src/database/models/user.model');
const Product = require('../src/database/models/product.model');
const Event = require('../src/database/models/event.model');
const Recipe = require('../src/database/models/recipe.model');
const Review = require('../src/database/models/review.model');
const { PROFILE_TYPES } = require('../src/app/config/constants');

// Pre-hashed 'password123' — avoids running bcrypt 30×
const PWD = '$2a$10$wKz0bBspq9lQO5cZk3T1euW4l38F.f6LleN24xIeJ1FvS2Q8R1M1q';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
function shuffle(arr, n) {
  return arr.slice().sort(() => 0.5 - Math.random()).slice(0, n);
}

// ─── Photo banks ──────────────────────────────────────────────────────────────
const FOOD_IMGS = [
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400',
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400',
  'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=80&w=400',
  'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?q=80&w=400',
  'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=400',
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400',
  'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=400',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400',
  'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400',
];
const EVENT_IMGS = [
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=400',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=400',
  'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=400',
  'https://images.unsplash.com/photo-1505232458627-539c1a251756?q=80&w=400',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=400',
];

const CITIES = ['Tunis', 'Sousse', 'Sfax', 'Bizerte', 'Nabeul', 'Ariana', 'La Marsa', 'Hammamet', 'Monastir', 'Djerba'];

// ─── User templates ───────────────────────────────────────────────────────────
// 15 Celiac patients — varied engagement (high / medium / low activity)
const CELIAC_USERS = [
  { fullName: 'Yasmine Ben Salah', email: 'yasmine.bensalah@scale.com', points: 1240, streakDays: 28, avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { fullName: 'Rania Khelifi', email: 'rania.khelifi@scale.com', points: 980, streakDays: 14, avatar: 'https://randomuser.me/api/portraits/women/23.jpg' },
  { fullName: 'Sami Trabelsi', email: 'sami.trabelsi@scale.com', points: 750, streakDays: 7, avatar: 'https://randomuser.me/api/portraits/men/34.jpg' },
  { fullName: 'Ines Chaabane', email: 'ines.chaabane@scale.com', points: 620, streakDays: 5, avatar: 'https://randomuser.me/api/portraits/women/45.jpg' },
  { fullName: 'Karim Mansouri', email: 'karim.mansouri@scale.com', points: 540, streakDays: 3, avatar: 'https://randomuser.me/api/portraits/men/56.jpg' },
  { fullName: 'Nour Boughanmi', email: 'nour.boughanmi@scale.com', points: 430, streakDays: 9, avatar: 'https://randomuser.me/api/portraits/women/67.jpg' },
  { fullName: 'Hamza Dridi', email: 'hamza.dridi@scale.com', points: 390, streakDays: 0, avatar: 'https://randomuser.me/api/portraits/men/78.jpg' },
  { fullName: 'Fatma Oueslati', email: 'fatma.oueslati@scale.com', points: 310, streakDays: 2, avatar: 'https://randomuser.me/api/portraits/women/89.jpg' },
  { fullName: 'Aziz Rjab', email: 'aziz.rjab@scale.com', points: 270, streakDays: 1, avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { fullName: 'Meriem Saidi', email: 'meriem.saidi@scale.com', points: 210, streakDays: 0, avatar: 'https://randomuser.me/api/portraits/women/11.jpg' },
  { fullName: 'Youssef Hamdi', email: 'youssef.hamdi@scale.com', points: 165, streakDays: 4, avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { fullName: 'Sirine Baccar', email: 'sirine.baccar@scale.com', points: 120, streakDays: 0, avatar: 'https://randomuser.me/api/portraits/women/55.jpg' },
  { fullName: 'Omar Belhadj', email: 'omar.belhadj@scale.com', points: 90, streakDays: 0, avatar: 'https://randomuser.me/api/portraits/men/66.jpg' },
  { fullName: 'Amira Fehri', email: 'amira.fehri@scale.com', points: 50, streakDays: 0, avatar: 'https://randomuser.me/api/portraits/women/77.jpg' },
  { fullName: 'Bilel Guesmi', email: 'bilel.guesmi@scale.com', points: 20, streakDays: 0, avatar: 'https://randomuser.me/api/portraits/men/88.jpg' },
];

// 5 Proche (family/caretakers)
const PROCHE_USERS = [
  { fullName: 'Leila Ben Salah', email: 'leila.bensalah@scale.com', points: 180, avatar: 'https://randomuser.me/api/portraits/women/30.jpg' },
  { fullName: 'Khaled Trabelsi', email: 'khaled.trabelsi@scale.com', points: 95, avatar: 'https://randomuser.me/api/portraits/men/31.jpg' },
  { fullName: 'Maha Dridi', email: 'maha.dridi@scale.com', points: 600, avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
  { fullName: 'Walid Chaabane', email: 'walid.chaabane@scale.com', points: 3000, avatar: 'https://randomuser.me/api/portraits/men/33.jpg' },
  { fullName: 'Sana Boughanmi', email: 'sana.boughanmi@scale.com', points: 10, avatar: 'https://randomuser.me/api/portraits/women/35.jpg' },
];

// 5 Pro-Commerce (bakery / specialty food sellers)
const SELLER_USERS = [
  { fullName: 'Ali Maktouf', email: 'ali.maktouf@scale.com', storeName: 'Maktouf GF Bakery', city: 'Tunis', street: '14 Rue Alain Savary', hours: 'Lun-Sam 07:00-20:00', phone: '+21671234501' },
  { fullName: 'Houssem Zouaoui', email: 'houssem.zouaoui@scale.com', storeName: 'La Boulange Sans Gluten', city: 'Sousse', street: '32 Avenue Habib Bourguiba', hours: 'Tlj 08:00-19:00', phone: '+21673234502' },
  { fullName: 'Radhia Belkacem', email: 'radhia.belkacem@scale.com', storeName: 'Radhia Naturelle', city: 'Sfax', street: '7 Rue Ibn Khaldoun', hours: 'Lun-Ven 09:00-18:00', phone: '+21674234503' },
  { fullName: 'Ghassen Mhenni', email: 'ghassen.mhenni@scale.com', storeName: 'GF Délices Nabeul', city: 'Nabeul', street: '3 Impasse des Jasmin', hours: 'Mar-Dim 08:30-21:00', phone: '+21672234504' },
  { fullName: 'Samira Louati', email: 'samira.louati@scale.com', storeName: 'Bio & Sain Djerba', city: 'Djerba', street: '18 Rue du Tourisme', hours: 'Tlj 09:00-22:00', phone: '+21675234505' },
];

// 5 Pro-Health (dietitians / doctors)
const HEALTH_USERS = [
  { fullName: 'Dr. Sonia Ayari', email: 'dr.ayari@scale.com', avatar: 'https://randomuser.me/api/portraits/women/40.jpg' },
  { fullName: 'Dr. Tarek Bouaziz', email: 'dr.bouaziz@scale.com', avatar: 'https://randomuser.me/api/portraits/men/41.jpg' },
  { fullName: 'Dr. Hajer Mejri', email: 'dr.mejri@scale.com', avatar: 'https://randomuser.me/api/portraits/women/42.jpg' },
  { fullName: 'Dr. Fethi Sahli', email: 'dr.sahli@scale.com', avatar: 'https://randomuser.me/api/portraits/men/43.jpg' },
  { fullName: 'Dr. Olfa Hamrouni', email: 'dr.hamrouni@scale.com', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
];

// ─── Product templates (50 unique, realistic prices per category) ─────────────
// Price ranges by category:
//   Flour & Mixes:  7–22 TND   (staples, sold by weight)
//   Bakery:        12–35 TND   (artisan baked goods)
//   Pastry & Cakes:18–55 TND   (premium patisserie)
//   Breads & Buns:  9–28 TND   (everyday bread)
//   Snacks:         6–18 TND   (packaged snacks)
//   Desserts:      14–42 TND   (specialty desserts)
const PRODUCTS = [
  // ── Flour & Mixes (10) ───────────────────────────────────────────────────────
  { name: 'Farine de Sorgho Certifiée (1kg)', cat: 'Flour & Mixes', price: 12.500, cert: true, ing: ['Sorgho pur sans gluten', 'Conditionné en zone sans gluten'] },
  { name: 'Mix Pâtisserie Sans Gluten (500g)', cat: 'Flour & Mixes', price: 9.900, cert: true, ing: ['Fécule de maïs', 'Farine de riz', 'Gomme de xanthane', 'Levure chimique'] },
  { name: 'Farine de Pois Chiches Bio (1kg)', cat: 'Flour & Mixes', price: 14.500, cert: false, ing: ['Pois chiches bio moulus', 'Sans additifs'] },
  { name: 'Fécule de Pomme de Terre (750g)', cat: 'Flour & Mixes', price: 7.900, cert: true, ing: ['Amidon de pomme de terre pur'] },
  { name: 'Farine de Sarrasin (1kg)', cat: 'Flour & Mixes', price: 13.500, cert: true, ing: ['Sarrasin décortiqué', 'Mouture à froid'] },
  { name: 'Mix Pain Maison SG (1kg)', cat: 'Flour & Mixes', price: 18.900, cert: true, ing: ['Farine de riz', 'Tapioca', 'Psyllium', 'Sel de mer', 'Gomme guar'] },
  { name: 'Amidon de Tapioca (500g)', cat: 'Flour & Mixes', price: 8.500, cert: false, ing: ['Tapioca pur extrait du manioc'] },
  { name: 'Farine de Quinoa (500g)', cat: 'Flour & Mixes', price: 19.900, cert: true, ing: ['Graines de quinoa blanc moulu', 'Riche en protéines'] },
  { name: 'Mix Crêpes & Gaufres SG (400g)', cat: 'Flour & Mixes', price: 11.900, cert: true, ing: ['Farine de riz', 'Fécule', 'Vanille bourbon', 'Sel'] },
  { name: 'Farine de Millet Doré (1kg)', cat: 'Flour & Mixes', price: 10.500, cert: false, ing: ['Millet décortiqué moulu', 'Riche en fer'] },

  // ── Bakery (10) ──────────────────────────────────────────────────────────────
  { name: 'Kaak Amandes SG (250g)', cat: 'Bakery', price: 22.000, cert: true, ing: ['Amandes moulues', 'Sucre de canne', 'Œufs fermiers', 'Eau de fleur d\'oranger'] },
  { name: 'Ghraïba Pistaches Artisanale', cat: 'Bakery', price: 28.500, cert: false, ing: ['Poudre de pistache', 'Sucre glace', 'Beurre clarifié', 'Eau de rose'] },
  { name: 'Biscuits Sésame & Miel (200g)', cat: 'Bakery', price: 16.900, cert: true, ing: ['Farine de riz', 'Sésame torréfié', 'Miel de thym', 'Huile d\'olive'] },
  { name: 'Croissants SG au Beurre (x4)', cat: 'Bakery', price: 31.000, cert: true, ing: ['Mix SG premium', 'Beurre AOP', 'Œufs', 'Lait entier'] },
  { name: 'Muffins Chocolat Noir (x6)', cat: 'Bakery', price: 24.500, cert: false, ing: ['Farine de riz', 'Cacao 72%', 'Huile de coco', 'Sucre de coco', 'Œufs'] },
  { name: 'Cookies Flocons Avoine SG (150g)', cat: 'Bakery', price: 14.900, cert: true, ing: ['Flocons d\'avoine certifiés SG', 'Beurre', 'Sucre brun', 'Pépites chocolat'] },
  { name: 'Financiers à l\'Amande SG (x8)', cat: 'Bakery', price: 27.000, cert: true, ing: ['Poudre d\'amande', 'Beurre noisette', 'Sucre glace', 'Blancs d\'œufs'] },
  { name: 'Cake Citron Pavot SG', cat: 'Bakery', price: 33.500, cert: false, ing: ['Farine de maïs', 'Zeste de citron bio', 'Graines de pavot', 'Yaourt nature'] },
  { name: 'Tartelettes Framboises (x4)', cat: 'Bakery', price: 35.000, cert: true, ing: ['Pâte sablée SG', 'Crème pâtissière', 'Framboises fraîches'] },
  { name: 'Brownies Noix Pécan SG (x6)', cat: 'Bakery', price: 29.000, cert: false, ing: ['Cacao pur', 'Noix de pécan', 'Sucre muscovado', 'Beurre', 'Œufs'] },

  // ── Pastry & Cakes (8) ───────────────────────────────────────────────────────
  { name: 'Baklawa Miel & Pistaches SG', cat: 'Pastry & Cakes', price: 48.000, cert: true, ing: ['Pâte de riz spéciale', 'Pistaches Bronte', 'Miel de sidr', 'Eau de rose'] },
  { name: 'Makroudh Dattes Semoule SG', cat: 'Pastry & Cakes', price: 38.500, cert: false, ing: ['Semoule de maïs fin', 'Dattes Deglet Nour', 'Cannelle', 'Huile d\'olive'] },
  { name: 'Gâteau Mariage Personnalisé SG', cat: 'Pastry & Cakes', price: 220.00, cert: true, ing: ['Sur commande — consultation requise'] },
  { name: 'Tarte Tatin Pommes Caramel SG', cat: 'Pastry & Cakes', price: 42.000, cert: true, ing: ['Pâte SG au beurre', 'Pommes Golden', 'Caramel au beurre salé'] },
  { name: 'Paris-Brest Praline SG', cat: 'Pastry & Cakes', price: 55.000, cert: false, ing: ['Pâte à choux SG', 'Crème pralinée', 'Pralin amande-noisette'] },
  { name: 'Entremets Mangue Passion SG', cat: 'Pastry & Cakes', price: 52.000, cert: true, ing: ['Mousse mangue', 'Insert passion', 'Biscuit dacquoise SG', 'Glaçage miroir'] },
  { name: 'Cheesecake New York SG', cat: 'Pastry & Cakes', price: 45.000, cert: true, ing: ['Base biscuit SG', 'Philadelphia', 'Sucre vanillé', 'Crème fraîche'] },
  { name: 'Opéra Café Chocolat SG', cat: 'Pastry & Cakes', price: 50.000, cert: false, ing: ['Biscuit joconde SG', 'Ganache chocolat 66%', 'Crème café', 'Glaçage cacao'] },

  // ── Breads & Buns (8) ────────────────────────────────────────────────────────
  { name: 'Pain de Campagne SG (400g)', cat: 'Breads & Buns', price: 12.500, cert: true, ing: ['Mix SG', 'Levain naturel', 'Graines de tournesol', 'Sel de Guérande'] },
  { name: 'Baguette Tradition SG (250g)', cat: 'Breads & Buns', price: 9.900, cert: true, ing: ['Farine de riz', 'Fécule', 'Levure', 'Eau, Sel'] },
  { name: 'Pains Burgers SG (x4)', cat: 'Breads & Buns', price: 18.500, cert: true, ing: ['Farine de riz', 'Graines de sésame', 'Œufs', 'Lait', 'Huile'] },
  { name: 'Pain de Mie Moelleux SG (500g)', cat: 'Breads & Buns', price: 14.900, cert: false, ing: ['Mix briochin SG', 'Lait entier', 'Beurre', 'Œufs', 'Sucre'] },
  { name: 'Focaccia Romarin & Sel SG', cat: 'Breads & Buns', price: 22.000, cert: true, ing: ['Farine de maïs', 'Romarin frais', 'Fleur de sel', 'Huile d\'olive extra vierge'] },
  { name: 'Pita Orientale SG (x6)', cat: 'Breads & Buns', price: 16.500, cert: false, ing: ['Fécule de tapioca', 'Farine de riz', 'Levure', 'Sel'] },
  { name: 'Pain aux Graines Multigrains SG', cat: 'Breads & Buns', price: 19.900, cert: true, ing: ['Graines de lin', 'Chia', 'Tournesol', 'Citrouille', 'Mix SG'] },
  { name: 'Ciabatta SG à l\'Huile d\'Olive', cat: 'Breads & Buns', price: 24.000, cert: false, ing: ['Farine de riz', 'Huile olive AOP', 'Levure liquide', 'Sel de mer'] },

  // ── Snacks (8) ───────────────────────────────────────────────────────────────
  { name: 'Crackers Thym & Romarin (100g)', cat: 'Snacks', price: 8.500, cert: true, ing: ['Farine de riz', 'Thym séché', 'Romarin', 'Huile d\'olive', 'Sel'] },
  { name: 'Mix Fruits Secs & Noix (200g)', cat: 'Snacks', price: 16.900, cert: false, ing: ['Noix de cajou', 'Amandes', 'Noisettes', 'Raisins secs', 'Dattes'] },
  { name: 'Chips Lentilles Épicées (80g)', cat: 'Snacks', price: 7.500, cert: true, ing: ['Lentilles rouges', 'Sel de mer', 'Paprika fumé', 'Curcuma'] },
  { name: 'Barres Énergie Datte-Amande (x5)', cat: 'Snacks', price: 14.500, cert: true, ing: ['Dattes Medjool', 'Amandes', 'Beurre d\'arachide', 'Cacao cru', 'Noix de coco'] },
  { name: 'Pâte d\'Amande Artisanale (150g)', cat: 'Snacks', price: 12.900, cert: false, ing: ['Amandes émondées', 'Sucre glace', 'Eau de fleur d\'oranger', 'Miel'] },
  { name: 'Pois Chiches Grillés Harissa (80g)', cat: 'Snacks', price: 6.900, cert: true, ing: ['Pois chiches', 'Harissa douce', 'Huile de tournesol', 'Sel'] },
  { name: 'Pop-Corn Caramel & Fleur de Sel', cat: 'Snacks', price: 9.900, cert: false, ing: ['Maïs soufflé', 'Caramel maison', 'Fleur de sel de Monastir'] },
  { name: 'Granola Coco & Fruits Rouges (300g)', cat: 'Snacks', price: 18.500, cert: true, ing: ['Flocons avoine SG', 'Noix de coco', 'Myrtilles séchées', 'Sirop agave', 'Huile coco'] },

  // ── Desserts (6) ─────────────────────────────────────────────────────────────
  { name: 'Crème Brûlée Vanille Bourbon (x2)', cat: 'Desserts', price: 28.000, cert: true, ing: ['Crème fleurette 35%', 'Jaunes d\'œufs', 'Vanille Bourbon Madagascar', 'Cassonade'] },
  { name: 'Panna Cotta Rose & Framboises', cat: 'Desserts', price: 24.500, cert: true, ing: ['Crème végétale', 'Agar-agar', 'Eau de rose', 'Coulis framboises'] },
  { name: 'Mousse au Chocolat 70% (x2)', cat: 'Desserts', price: 22.000, cert: false, ing: ['Chocolat noir 70%', 'Blancs d\'œufs', 'Sucre de canne', 'Fleur de sel'] },
  { name: 'Tiramisu SG aux Spéculoos', cat: 'Desserts', price: 32.000, cert: true, ing: ['Mascarpone', 'Spéculoos SG', 'Espresso', 'Marsala', 'Œufs', 'Cacao'] },
  { name: 'Gelée de Grenade & Menthe', cat: 'Desserts', price: 17.500, cert: true, ing: ['Jus de grenade pur', 'Agar-agar bio', 'Menthe fraîche', 'Sucre de coco'] },
  { name: 'Riz au Lait Safran & Rose (x2)', cat: 'Desserts', price: 19.900, cert: false, ing: ['Riz rond', 'Lait frais entier', 'Safran de Béja', 'Eau de rose', 'Sucre'] },
];

// ─── Event templates (45 unique, realistic prices & descriptions) ──────────────
// free=0 TND, low=15–35, medium=40–80, premium=90–150
const EVENTS = [
  { title: 'Atelier Boulangerie SG — Pain au Levain', type: 'class', city: 'Tunis', price: 65, maxCap: 12, desc: 'Apprenez à confectionner un pain au levain 100% sans gluten avec la boulangère Radhia Belkacem. Technique de pétrissage, fermentation longue et cuisson sur pierre incluses.' },
  { title: 'Marché Bio & Sans Gluten de La Marsa', type: 'market', city: 'La Marsa', price: 0, maxCap: 300, desc: 'Plus de 30 exposants locaux proposent produits bios, sans gluten et sans allergènes. Entrée gratuite. Animations pour enfants, dégustation et conférences.' },
  { title: 'Cercle Cœliaque Sousse — Rencontre #12', type: 'meetup', city: 'Sousse', price: 0, maxCap: 40, desc: 'Réunion mensuelle de la communauté cœliaque de Sousse. Partage d\'expériences, astuces du quotidien et annonces de nouveaux produits testés par les membres.' },
  { title: 'Séminaire Nutrition & Maladie Cœliaque', type: 'other', city: 'Tunis', price: 90, maxCap: 80, desc: 'Le Dr. Tarek Bouaziz présente les dernières avancées en matière de diagnostic précoce, alimentation optimisée et supplémentation pour les patients cœliaques adultes.' },
  { title: 'Cours de Pâtisserie Orientale SG', type: 'class', city: 'Nabeul', price: 75, maxCap: 10, desc: 'Maîtrisez le makroudh, la ghraïba et le kaak en version 100% sans gluten avec Samira Louati. Emportez vos créations à la maison.' },
  { title: 'Expo Produits Sans Allergènes — Sfax', type: 'market', city: 'Sfax', price: 15, maxCap: 200, desc: 'Salon annuel regroupant fabricants, importateurs et artisans de produits sans gluten, sans lactose et végans. Accès professionnel et grand public.' },
  { title: 'Pique-Nique Cœliaque Nabeul Beach', type: 'meetup', city: 'Nabeul', price: 0, maxCap: 60, desc: 'Sortie conviviale à la plage organisée par l\'association GluFree Nabeul. Chaque participant apporte un plat SG à partager. Boissons offertes.' },
  { title: 'Webinaire : Lire les Étiquettes Sans Risque', type: 'other', city: 'Tunis', price: 0, maxCap: 500, desc: 'Session en ligne animée par la diététicienne Dr. Sonia Ayari. Comment repérer les traces de gluten cachées, déchiffrer les certifications et éviter les contaminationscroisées.' },
  { title: 'Masterclass Pizza Napolitaine SG', type: 'class', city: 'Hammamet', price: 80, maxCap: 8, desc: 'Techniques professionnelles de préparation de la pâte à pizza sans gluten, fermentation 48h, four à bois. Apportez votre tablier !' },
  { title: 'Gala Cœliaque Annuel — Tunis Hilton', type: 'other', city: 'Tunis', price: 150, maxCap: 120, desc: 'Soirée de gala de l\'Association Tunisienne Cœliaque. Dîner gourmet SG, remise de prix, témoignages de patients et annonces scientifiques.' },
  { title: 'Marché Fermier Ariana — Stand GF', type: 'market', city: 'Ariana', price: 0, maxCap: 150, desc: 'Le marché hebdomadaire de l\'Ariana accueille un nouveau stand dédié aux produits sans gluten. Céréales anciennes, farines artisanales et conserves.' },
  { title: 'Cours : Crêpes & Galettes de Sarrasin SG', type: 'class', city: 'Monastir', price: 45, maxCap: 14, desc: 'Réalisez des crêpes bretonnes authentiques en version SG. Recettes sucrées et salées, techniques de râtelier et présentation culinaire.' },
  { title: 'Nuit SG des Brasseries — Tunis', type: 'meetup', city: 'Tunis', price: 35, maxCap: 50, desc: 'Soirée dégustation de bières sans gluten artisanales accompagnées de tapas SG maison. Rencontre avec les brasseurs locaux.' },
  { title: 'Conférence : Pédiatrie & Maladie Cœliaque', type: 'other', city: 'Tunis', price: 0, maxCap: 100, desc: 'Destinée aux parents d\'enfants cœliaques. Gestion à l\'école, alimentation équilibrée en croissance et accompagnement psychologique.' },
  { title: 'Brunch Cœliaque Hammamet Garden', type: 'meetup', city: 'Hammamet', price: 55, maxCap: 35, desc: 'Brunch gastronomique sans gluten face à la mer. Menu complet élaboré par le chef Ghassen Mhenni. Réservation obligatoire.' },
  { title: 'Atelier Desserts de Fête SG', type: 'class', city: 'Bizerte', price: 60, maxCap: 12, desc: 'Bûche de Noël, Charlotte aux fruits et Pavlova en version sans gluten. Idéal pour préparer les fêtes en toute sécurité.' },
  { title: 'Atelier Enfants : Biscuits SG', type: 'class', city: 'Ariana', price: 30, maxCap: 16, desc: 'Atelier ludique pour les 6–12 ans. Les enfants préparent et décorent leurs propres biscuits SG. Tabliers et kits fournis.' },
  { title: 'Réunion Annuelle Assoc. Cœliaque Tunisie', type: 'other', city: 'Tunis', price: 0, maxCap: 200, desc: 'Assemblée générale de l\'ATC. Rapport d\'activités, élection du bureau et présentation du plan d\'action 2026.' },
  { title: 'Retraite Bien-Être SG — Djerba', type: 'meetup', city: 'Djerba', price: 0, maxCap: 25, desc: 'Week-end immersif combinant yoga, cuisine SG locale et ateliers bien-être. Nombre de places très limité — inscrivez-vous tôt.' },
  { title: 'Festival Dattes & Produits Bio — Tozeur', type: 'market', city: 'Djerba', price: 0, maxCap: 400, desc: 'Le grand rendez-vous annuel des oasis. Producteurs de dattes Medjool et Deglet Nour, huiles artisanales et épices du Sud tunisien.' },
  { title: 'Panel : Alimentation Méditerranéenne SG', type: 'other', city: 'Monastir', price: 40, maxCap: 90, desc: 'Table ronde avec des nutritionnistes, chefs et patients sur l\'adaptation du régime méditerranéen aux contraintes du régime sans gluten.' },
  { title: 'Atelier Pâtes Fraîches Artisanales SG', type: 'class', city: 'Tunis', price: 70, maxCap: 10, desc: 'Fabriquez vos tagliatelles, ravioles et gnocchi sans gluten de A à Z. Farine de riz, semoule de maïs et techniques italiennes adaptées.' },
  { title: 'Marche Solidaire Cœliaque — Sousse', type: 'meetup', city: 'Sousse', price: 0, maxCap: 500, desc: '5 km de marche pour sensibiliser aux maladies auto-immunes. Départ depuis la Médina de Sousse, collation SG offerte à l\'arrivée.' },
  { title: 'Conférence : Santé Intestinale & Microbiome', type: 'other', city: 'Sfax', price: 50, maxCap: 70, desc: 'La Dr. Hajer Mejri explore le lien entre maladie cœliaque, perméabilité intestinale et dysbiose. Suivi d\'une séance de questions-réponses.' },
  { title: 'Fête du Quartier — Kiosque GF Carthage', type: 'market', city: 'La Marsa', price: 0, maxCap: 200, desc: 'La boulangerie Maktouf GF tient un kiosque pendant la fête de quartier. Dégustations gratuites et vente de produits de saison.' },
  { title: 'Q&A Live : Diététicienne Spécialisée SG', type: 'other', city: 'Tunis', price: 0, maxCap: 999, desc: 'Session interactive en ligne avec la Dr. Olfa Hamrouni. Posez vos questions sur l\'équilibre nutritionnel, les carences fréquentes et les substituts efficaces.' },
  { title: 'Atelier Ramadan : Iftar & Suhoor SG', type: 'class', city: 'Tunis', price: 55, maxCap: 18, desc: 'Recettes traditionnelles tunisiennes revisitées en version sans gluten pour le mois sacré. Brik, asida, chabba et harissa maison.' },
  { title: 'Voyage Culinaire : Couscous SG Authentique', type: 'class', city: 'Sousse', price: 85, maxCap: 8, desc: 'Préparation complète d\'un couscous d\'agneau traditionnel en version 100% sans gluten. Avec graines de sorgho roulées à la main.' },
  { title: 'Meetup Cœliaque Ariana — Café Littéraire', type: 'meetup', city: 'Ariana', price: 0, maxCap: 30, desc: 'Rencontre informelle autour d\'un café SG. Partage de lectures, recommandations de restaurants et bons plans locaux.' },
  { title: 'Atelier Makroudh de Kairouan SG', type: 'class', city: 'Sfax', price: 65, maxCap: 10, desc: 'La cheffe Radhia Belkacem enseigne les secrets du makroudh authentique dans sa version semoule de maïs. Recette originale de Kairouan.' },
  { title: 'Matinée Pancakes & Granola SG', type: 'meetup', city: 'Hammamet', price: 30, maxCap: 20, desc: 'Petit-déjeuner-rencontre convivial autour de pancakes moelleux et de granola artisanal SG. Idéal pour les nouveaux diagnostiqués.' },
  { title: 'Cours Harissa & Sauces Tunisiennes SG', type: 'class', city: 'Nabeul', price: 40, maxCap: 14, desc: 'Préparez votre harissa maison, chermoula et sauce tchakchouka authentiques — toutes naturellement sans gluten. Bocaux fournis.' },
  { title: 'Bazar Éco-Responsable Sans Allergènes', type: 'market', city: 'Bizerte', price: 0, maxCap: 120, desc: 'Marché zéro déchet avec stands de vrac SG, cosmétiques bio, plants de légumes et produits artisanaux locaux.' },
  { title: 'Table Ronde : Adolescents & Vie Cœliaque', type: 'other', city: 'Tunis', price: 0, maxCap: 60, desc: 'Comment vivre le régime sans gluten à l\'adolescence ? Témoignages de jeunes patients, conseils nutritionnels et soutien psychologique.' },
  { title: 'Défi Petit-Déjeuner SG Équilibré', type: 'meetup', city: 'Monastir', price: 25, maxCap: 24, desc: 'Participants préparent et partagent leur meilleur petit-déjeuner SG. Vote pour les créations, lot pour le vainqueur et échange de recettes.' },
  { title: 'Masterclass Repas Rapides SG (< 20 min)', type: 'class', city: 'Ariana', price: 50, maxCap: 16, desc: 'Techniques de batch cooking et recettes express pour la semaine. Idéal pour les familles actives devant gérer plusieurs contraintes alimentaires.' },
  { title: 'Journée Olive & Terroir Sfax', type: 'other', city: 'Sfax', price: 0, maxCap: 300, desc: 'Célébration de la culture oléicole sfaxienne. Huiles premium, olives marinées et produits du terroir naturellement sans gluten.' },
  { title: 'Foire Saharienne Gabes — Produits du Sud', type: 'market', city: 'Djerba', price: 0, maxCap: 600, desc: 'Grand marché hebdomadaire de Gabès élargi pour l\'occasion. Épices, condiments, huiles et grains du Sud tunisien sans gluten.' },
  { title: 'Atelier Fêtes de Fin d\'Année SG', type: 'class', city: 'La Marsa', price: 75, maxCap: 10, desc: 'Sablés décorés, stollen SG et bûche glacée pour Noël et Noël du voyageur. Recettes familiales adaptées pour les enfants cœliaques.' },
  { title: 'Dîner-Rencontre Cœliaque — Sfax', type: 'meetup', city: 'Sfax', price: 45, maxCap: 30, desc: 'Dîner gastronomique organisé par l\'association cœliaque de Sfax. Menu entièrement SG, vins sans tanins recommandés.' },
  { title: 'Journée Portes Ouvertes — Boulangerie SG', type: 'other', city: 'Sousse', price: 0, maxCap: 80, desc: 'Houssem Zouaoui ouvre les coulisses de sa boulangerie SG. Démonstration de fabrication, dégustation et atelier initiation pour les enfants.' },
  { title: 'Pique-Nique Printanier — Parc du Belvédère', type: 'meetup', city: 'Tunis', price: 0, maxCap: 70, desc: 'Rassemblement printanier de la communauté cœliaque tunisienne. Chacun apporte une spécialité SG. Jeux de plein air et tombola.' },
  { title: 'Atelier Sécurité Alimentaire en Cuisine', type: 'class', city: 'Bizerte', price: 45, maxCap: 20, desc: 'Prévention des contaminations croisées à la maison, organisation du réfrigérateur, nettoyage des surfaces et ustensiles dédiés SG.' },
  { title: 'Forum Annuel Santé Digestive Ariana', type: 'other', city: 'Ariana', price: 35, maxCap: 150, desc: 'Congrès médical ouvert au public. Spécialistes gastro-entérologues, diététiciens et chercheurs présentent les avancées 2025–2026.' },
  { title: 'Atelier Bien Manger au Bureau — SG Edition', type: 'other', city: 'Tunis', price: 30, maxCap: 25, desc: 'Préparation de repas légers et nutritifs pour le midi au bureau. Meal prep SG, conservation et réchauffage sans perte de qualité.' },
  { title: 'Rencontre GF Wellness Group Monastir', type: 'meetup', city: 'Monastir', price: 0, maxCap: 35, desc: 'Groupe de soutien mensuel réunissant patients cœliaques, proches et professionnels de santé de la région de Monastir.' },
];

