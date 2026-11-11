// Catálogo de productos de Café Torrons.
// Lo usan index.html (tienda) y admin.html (administración).
// Los precios aquí son los precios base; los cambios hechos en admin.html
// se guardan en Firebase y tienen prioridad.

// ========== MENÚ DATA ==========
const products = [
  // Churrascos
  {
    id: 1,
    name: "Churrasco con Queso",
    desc: "Clásico churrasco de res con queso.",
    price: 30,
    category: "churrasco",
    emoji: "🥩",
    image: "imagenes/churrasco-queso.jpg",
    offerExtras: true
  },
  {
    id: 2,
    name: "Churrasco Chacarero",
    desc: "Res, tomate, ejotes, chile y mayonesa.",
    price: 31,
    category: "churrasco",
    emoji: "🥩",
    image: "imagenes/churrasco-chacarero.jpg",
    offerExtras: true,
    allowSinChile: true
  },
  {
    id: 3,
    name: "Churrasco Italiano",
    desc: "Res, aguacate, tomate y mayonesa.",
    price: 33,
    category: "churrasco",
    emoji: "🥩",
    image: "imagenes/churrasco-italiano.jpg",
    offerExtras: true
  },
  {
    id: 4,
    name: "Churrasco Torrons",
    desc: "Res, tomate, aguacate, chucrut y mayonesa.",
    price: 36,
    category: "churrasco",
    emoji: "🥩",
    image: "imagenes/churrasco-torrons.jpg",
    offerExtras: true
  },
  // Hot-Dogs
  {
    id: 5,
    name: "Hot-Dog Solo",
    desc: "Salchicha clásica.",
    price: 12,
    category: "hotdog",
    emoji: "🌭",
    image: "imagenes/hotdog-solo.jpg",
    offerExtras: true
  },
  {
    id: 6,
    name: "Hot-Dog Completo",
    desc: "Salchicha, chucrut, tomate y mayonesa.",
    price: 17,
    category: "hotdog",
    emoji: "🌭",
    image: "imagenes/hotdog-completo.jpg",
    offerExtras: true
  },
  {
    id: 7,
    name: "Hot-Dog Italiano",
    desc: "Salchicha, tomate, aguacate y mayonesa.",
    price: 23,
    category: "hotdog",
    emoji: "🌭",
    image: "imagenes/hotdog-italiano.jpg",
    offerExtras: true
  },
  {
    id: 8,
    name: "Hot-Dog Torrons",
    desc: "Salchicha, tomate, aguacate, chucrut y mayonesa.",
    price: 26,
    category: "hotdog",
    emoji: "🌭",
    image: "imagenes/hotdog-torrons.jpg",
    offerExtras: true
  },
  // Otros
  {
    id: 9,
    name: "Choripán",
    desc: "Pan de agua con chorizo extremeño y pebre.",
    price: 20,
    category: "otros",
    emoji: "🥖",
    image: "imagenes/choripan.jpg",
    offerExtras: true
  },
  {
    id: 10,
    name: "Ave Mayo",
    desc: "Pan de hamburguesa con pechuga de pollo, chile pimiento y mayonesa.",
    price: 20,
    category: "otros",
    emoji: "🍗",
    image: "imagenes/ave-mayo.jpg",
    offerExtras: true
  },
  {
    id: 11,
    name: "Chorrillana",
    desc: "Papas fritas con cebolla caramelizada, churrasco, chorizo y huevo frito.",
    price: 60,
    category: "papas",
    emoji: "🍟",
    image: "imagenes/chorrillana.jpg",
    needsEggCook: true
  },
  {
    id: 12,
    name: "Papas Fritas 200 g",
    desc: "Porción de papas fritas (200 g).",
    price: 25,
    category: "papas",
    emoji: "🍟",
    image: "imagenes/papas-fritas.jpg"
  },
  {
    id: 28,
    name: "Papas Fritas 100 g",
    desc: "Porción individual de papas fritas (100 g).",
    price: 13,
    category: "papas",
    emoji: "🍟",
    image: "imagenes/papas-fritas.jpg"
  },
  {
    id: 13,
    name: "Salchipapa",
    desc: "Papas fritas con salchicha.",
    price: 35,
    category: "papas",
    emoji: "🍟",
    image: "imagenes/salchipapa.jpg"
  },
  // Bebidas
  {
    id: 14,
    name: "Café",
    desc: "Café tradicional.",
    price: 15,
    category: "bebidas",
    emoji: "☕",
    image: "imagenes/bebida-cafe.jpg",
    needsSweetener: true
  },
  {
    id: 27,
    name: "Café con leche",
    desc: "Café con leche caliente.",
    price: 20,
    category: "bebidas",
    emoji: "☕",
    image: "imagenes/bebida-latte.jpg",
    needsSweetener: true
  },
  {
    id: 15,
    name: "Café espresso",
    desc: "Espresso clásico (1 oz).",
    price: 15,
    category: "bebidas",
    emoji: "☕",
    image: "imagenes/bebida-espresso.jpg",
    needsSweetener: true
  },
  {
    id: 16,
    name: "Capuccino",
    desc: "Espresso con leche vaporizada y espuma (6 oz).",
    price: 20,
    category: "bebidas",
    emoji: "☕",
    image: "imagenes/bebida-capuccino.jpg",
    needsSweetener: true
  },
  {
    id: 17,
    name: "Frapuccino",
    desc: "Bebida fría de café batido (10 oz).",
    price: 25,
    category: "bebidas",
    emoji: "🧊",
    image: "imagenes/bebida-frapuccino.jpg",
    needsSweetener: true
  },
  {
    id: 18,
    name: "Latte",
    desc: "Espresso con leche vaporizada (10 oz).",
    price: 25,
    category: "bebidas",
    emoji: "☕",
    image: "imagenes/bebida-latte.jpg",
    needsSweetener: true
  },
  {
    id: 19,
    name: "Shakerato",
    desc: "Espresso en coctelera.",
    price: 20,
    category: "bebidas",
    emoji: "🍸",
    image: "imagenes/bebida-shakerato.jpg",
    needsSweetener: true
  },
  {
    id: 20,
    name: "Affogato",
    desc: "Café y helado de vainilla.",
    price: 28,
    category: "bebidas",
    emoji: "🍨",
    image: "imagenes/bebida-affogato.jpg",
    needsSweetener: true
  },
  {
    id: 21,
    name: "Mocaccino",
    desc: "Café con chocolate y leche.",
    price: 28,
    category: "bebidas",
    emoji: "☕",
    image: "imagenes/bebida-mocaccino.jpg",
    needsSweetener: true
  },
  {
    id: 22,
    name: "Chocolate Mixco",
    desc: "Con azúcar, canela y cacao (10 oz).",
    price: 18,
    category: "bebidas",
    emoji: "🍫",
    image: "imagenes/bebida-chocolate-mixco.jpg",
    needsSweetener: true
  },
  {
    id: 30,
    name: "Agua mineral",
    desc: "Agua mineral Salutaris.",
    price: 10,
    category: "bebidas",
    emoji: "💧",
    image: "imagenes/bebida-agua-mineral.jpg"
  },
  {
    id: 24,
    name: "Coca-Cola normal",
    desc: "Coca-Cola clásica en lata.",
    price: 10,
    category: "bebidas",
    emoji: "🥤",
    image: "imagenes/bebida-coca-cola.jpg"
  },
  {
    id: 23,
    name: "Agua Pura 500cc",
    desc: "Botella de agua pura 500 ml.",
    price: 5,
    category: "bebidas",
    emoji: "💧",
    image: "imagenes/bebida-agua-pura.jpg"
  },
  // Turrones de chocolate
  {
    id: 25,
    name: "Chocolate con Berries",
    desc: "55% cacao Belga con arándanos deshidratados.",
    price: 20,
    category: "turrones",
    emoji: "🍫",
    image: "imagenes/turron-berries.png"
  },
  {
    id: 26,
    name: "Chocolate con Leche y Coco",
    desc: "35% cacao Belga con coco rallado.",
    price: 20,
    category: "turrones",
    emoji: "🥥",
    image: "imagenes/turron-coco.png"
  }
];

// ========== CREA TU TORRONS (precios base; editables desde admin.html) ==========
const CREA_BASES = [
  { key: 'pan_hamb', name: 'Pan de hamburguesa', price: 5, image: 'imagenes/pan-hamburguesa.jpg' },
  { key: 'pan_hd', name: 'Pan de hotdog', price: 3, image: 'imagenes/pan-hotdog.jpg' },
  { key: 'pan_agua', name: '2 panes de agua', price: 4, image: 'imagenes/pan-agua.jpg', note: 'Ingredientes divididos en 2 panes' },
  { key: 'papas', name: 'Papas fritas 200 g', price: 25, image: 'imagenes/papas-fritas.jpg' }
];
const CREA_INGS = [
  { key: 'churrasco', name: 'Churrasco a la plancha 100 g', price: 17, image: 'imagenes/ing-churrasco.jpg' },
  { key: 'salchicha', name: '1 Salchicha de pollo', price: 7, image: 'imagenes/ing-salchicha.jpg' },
  { key: 'chorizo', name: '1 Chorizo extremeño', price: 10, image: 'imagenes/ing-chorizo.jpg' },
  { key: 'huevo', name: '1 Huevo estrellado', price: 4, image: 'imagenes/ing-huevo.jpg', needsCook: true },
  { key: 'pollo', name: '50 g Pollo y pimiento molido', price: 13, image: 'imagenes/ing-pollo-pimiento.jpg', needsMayo: true },
  { key: 'cebolla', name: 'Cebolla caramelizada', price: 6, image: 'imagenes/ing-cebolla.jpg' },
  { key: 'aguacate', name: '1/2 Aguacate', price: 8, image: 'imagenes/ing-aguacate.jpg' },
  { key: 'queso', name: '80 g Queso a la plancha', price: 8, image: 'imagenes/ing-queso.jpg' },
  { key: 'ejotes', name: 'Ejotes cocidos 50 g', price: 4, image: 'imagenes/ing-ejotes.jpg' },
  { key: 'tomate', name: 'Tomate', price: 3, image: 'imagenes/ing-tomate.jpg' },
  { key: 'chucrut', name: 'Chucrut', price: 4, image: 'imagenes/ing-chucrut.jpg' },
  { key: 'mayo', name: 'Mayonesa', price: 2, image: 'imagenes/ing-mayonesa.jpg' },
  { key: 'chile', name: 'Chile diente de perro', price: 1, image: 'imagenes/ing-chile.jpg' }
];

// ========== EXTRAS DE COMBO (precio y stock editables desde admin.html) ==========
const COMBO_PAPAS = { key: 'papas100', name: 'Papas fritas 100 g (combo)', price: 10, emoji: '🍟' };
const COMBO_LIQUIDS = [
  { key: 'coca', name: 'Coca-Cola', price: 7, emoji: '🥤' },
  { key: 'agua', name: 'Agua pura', price: 4, emoji: '💧' },
  { key: 'soda', name: 'Agua soda', price: 7, emoji: '🫧' },
  { key: 'cafe', name: 'Café americano', price: 8, emoji: '☕' }
];
