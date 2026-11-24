export interface SeedRestaurant {
  id: string;
  name: string;
  zone: "Centro" | "Norte" | "Sur" | "Este";
  plan: "BASE" | "PRO";
  billingCycle: "MONTHLY" | "ANNUAL_10X12";
  subscriptionStatus: "TRIAL" | "ACTIVE_DEMO";
  taxRegime: "GENERAL" | "RTS";
  isAseracMember: boolean;
}

export interface SeedUser {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: "ADMIN" | "KITCHEN";
}

export interface SeedSupplier {
  id: string;
  restaurantId: string;
  name: string;
  category:
    | "Mercado Mayorista"
    | "Proveedor Directo"
    | "Supermercado"
    | "Productor Local";
  whatsappPhone: string;
  notes?: string;
}

export interface SeedIngredient {
  id: string;
  restaurantId: string;
  name: string;
  category:
    | "Carnes"
    | "Verduras"
    | "Tubérculos"
    | "Lácteos"
    | "Abarrotes"
    | "Aceites";
  location: "Cámara Frío" | "Almacén Seco" | "Cocina";
  unit: "kg" | "L" | "u";
  currentStock: number;
  minStock: number;
  optimalStock: number;
  unitCostBs: number;
  defaultSupplierId: string;
  alternativeSupplierIds: string[];
  updatedAt: string;
}

export interface SeedRecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantityRequired: number;
}

export interface SeedRecipe {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  salePriceBs: number;
  isActive: boolean;
  ingredients: SeedRecipeIngredient[];
}

export type WasteReasonCode =
  | "EXPIRATION"
  | "COLD_SPOILAGE"
  | "PREP_ERROR"
  | "PORTION_ERROR"
  | "THEFT_LOSS";

export interface SeedWasteRecord {
  id: string;
  restaurantId: string;
  ingredientId: string;
  quantityLost: number;
  reason: WasteReasonCode;
  monetaryLossBs: number;
  notes: string;
  createdAt: string;
}

export interface SeedSaleRecord {
  id: string;
  restaurantId: string;
  recipeId: string;
  quantitySold: number;
  totalRevenueBs: number;
  totalIngredientCostBs: number;
  source: "MANUAL_POS" | "EXTERNAL_POS";
  createdAt: string;
}

export const RESTAURANT_ID = "rest-el-solar-cbba";

export const SEED_RESTAURANT: SeedRestaurant = {
  id: RESTAURANT_ID,
  name: "El Solar Cochabambino",
  zone: "Centro",
  plan: "PRO",
  billingCycle: "MONTHLY",
  subscriptionStatus: "TRIAL",
  taxRegime: "GENERAL",
  isAseracMember: false,
};

export const SEED_USERS: SeedUser[] = [
  {
    id: "user-admin-elsolar",
    restaurantId: RESTAURANT_ID,
    name: "Carlos Mendoza (Dueño)",
    email: "admin@elsolar.bo",
    role: "ADMIN",
  },
  {
    id: "user-kitchen-elsolar",
    restaurantId: RESTAURANT_ID,
    name: "Elena Quispe (Cocina)",
    email: "cocina@elsolar.bo",
    role: "KITCHEN",
  },
];

export const SEED_SUPPLIERS: SeedSupplier[] = [
  {
    id: "sup-calatayud",
    restaurantId: RESTAURANT_ID,
    name: "Casera Mercado Calatayud (Doña Martha)",
    category: "Mercado Mayorista",
    whatsappPhone: "+59170011223",
    notes: "Entrega 06:30 en puerta trasera, pago efectivo o QR.",
  },
  {
    id: "sup-avicola",
    restaurantId: RESTAURANT_ID,
    name: "Distribuidora Avícola Cochabamba",
    category: "Proveedor Directo",
    whatsappPhone: "+59170044556",
    notes: "Pollo fresco de granja Quillacollo, pedidos antes de 18:00.",
  },
  {
    id: "sup-sanpedro",
    restaurantId: RESTAURANT_ID,
    name: "Frigorífico San Pedro",
    category: "Proveedor Directo",
    whatsappPhone: "+59170077889",
    notes: "Cortes lomo y pulpa seleccionados.",
  },
  {
    id: "sup-lacancha",
    restaurantId: RESTAURANT_ID,
    name: "Abarrotes Mayorista La Cancha",
    category: "Mercado Mayorista",
    whatsappPhone: "+59170099112",
    notes: "Quintales de arroz y bidones de aceite.",
  },
  {
    id: "sup-lacteos",
    restaurantId: RESTAURANT_ID,
    name: "Lácteos del Valle",
    category: "Productor Local",
    whatsappPhone: "+59170033445",
    notes: "Queso mozzarella y quesillo fresco de Tiquipaya.",
  },
];

const NOW_ISO = new Date().toISOString();

export const SEED_INGREDIENTS: SeedIngredient[] = [
  {
    id: "ing-tomate",
    restaurantId: RESTAURANT_ID,
    name: "Tomate Perita",
    category: "Verduras",
    location: "Cámara Frío",
    unit: "kg",
    currentStock: 2.0,
    minStock: 5.0,
    optimalStock: 10.0,
    unitCostBs: 12.0,
    defaultSupplierId: "sup-calatayud",
    alternativeSupplierIds: ["sup-lacancha"],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-pollo",
    restaurantId: RESTAURANT_ID,
    name: "Pollo Entero / Filete",
    category: "Carnes",
    location: "Cámara Frío",
    unit: "kg",
    currentStock: 3.5,
    minStock: 8.0,
    optimalStock: 15.0,
    unitCostBs: 24.0,
    defaultSupplierId: "sup-avicola",
    alternativeSupplierIds: ["sup-sanpedro"],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-carne",
    restaurantId: RESTAURANT_ID,
    name: "Carne de Res (Lomo/Pulpa)",
    category: "Carnes",
    location: "Cámara Frío",
    unit: "kg",
    currentStock: 2.5,
    minStock: 6.0,
    optimalStock: 12.0,
    unitCostBs: 48.0,
    defaultSupplierId: "sup-sanpedro",
    alternativeSupplierIds: [],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-aceite",
    restaurantId: RESTAURANT_ID,
    name: "Aceite Vegetal",
    category: "Aceites",
    location: "Almacén Seco",
    unit: "L",
    currentStock: 2.0,
    minStock: 5.0,
    optimalStock: 10.0,
    unitCostBs: 16.5,
    defaultSupplierId: "sup-lacancha",
    alternativeSupplierIds: ["sup-calatayud"],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-papa",
    restaurantId: RESTAURANT_ID,
    name: "Papa Imilla Seleccionada",
    category: "Tubérculos",
    location: "Almacén Seco",
    unit: "kg",
    currentStock: 12.0,
    minStock: 15.0,
    optimalStock: 25.0,
    unitCostBs: 6.5,
    defaultSupplierId: "sup-calatayud",
    alternativeSupplierIds: ["sup-lacancha"],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-queso",
    restaurantId: RESTAURANT_ID,
    name: "Queso Mozzarella",
    category: "Lácteos",
    location: "Cámara Frío",
    unit: "kg",
    currentStock: 2.4,
    minStock: 3.0,
    optimalStock: 6.0,
    unitCostBs: 38.0,
    defaultSupplierId: "sup-lacteos",
    alternativeSupplierIds: [],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-arroz",
    restaurantId: RESTAURANT_ID,
    name: "Arroz Grano de Oro",
    category: "Abarrotes",
    location: "Almacén Seco",
    unit: "kg",
    currentStock: 25.0,
    minStock: 10.0,
    optimalStock: 30.0,
    unitCostBs: 9.0,
    defaultSupplierId: "sup-lacancha",
    alternativeSupplierIds: ["sup-calatayud"],
    updatedAt: NOW_ISO,
  },
  {
    id: "ing-cebolla",
    restaurantId: RESTAURANT_ID,
    name: "Cebolla Roja",
    category: "Verduras",
    location: "Almacén Seco",
    unit: "kg",
    currentStock: 14.0,
    minStock: 6.0,
    optimalStock: 18.0,
    unitCostBs: 5.5,
    defaultSupplierId: "sup-calatayud",
    alternativeSupplierIds: ["sup-lacancha"],
    updatedAt: NOW_ISO,
  },
];

export const SEED_RECIPES: SeedRecipe[] = [
  {
    id: "rec-pique-macho",
    restaurantId: RESTAURANT_ID,
    name: "Pique Macho Tradicional",
    category: "Platos Fuertes",
    salePriceBs: 75.0,
    isActive: true,
    ingredients: [
      {
        id: "ri-pique-carne",
        recipeId: "rec-pique-macho",
        ingredientId: "ing-carne",
        quantityRequired: 0.4,
      },
      {
        id: "ri-pique-papa",
        recipeId: "rec-pique-macho",
        ingredientId: "ing-papa",
        quantityRequired: 0.5,
      },
      {
        id: "ri-pique-tomate",
        recipeId: "rec-pique-macho",
        ingredientId: "ing-tomate",
        quantityRequired: 0.25,
      },
      {
        id: "ri-pique-aceite",
        recipeId: "rec-pique-macho",
        ingredientId: "ing-aceite",
        quantityRequired: 0.1,
      },
    ],
  },
  {
    id: "rec-silpancho",
    restaurantId: RESTAURANT_ID,
    name: "Silpancho Cochabambino",
    category: "Tradicional",
    salePriceBs: 38.0,
    isActive: true,
    ingredients: [
      {
        id: "ri-silp-carne",
        recipeId: "rec-silpancho",
        ingredientId: "ing-carne",
        quantityRequired: 0.25,
      },
      {
        id: "ri-silp-arroz",
        recipeId: "rec-silpancho",
        ingredientId: "ing-arroz",
        quantityRequired: 0.15,
      },
      {
        id: "ri-silp-papa",
        recipeId: "rec-silpancho",
        ingredientId: "ing-papa",
        quantityRequired: 0.25,
      },
      {
        id: "ri-silp-tomate",
        recipeId: "rec-silpancho",
        ingredientId: "ing-tomate",
        quantityRequired: 0.15,
      },
    ],
  },
  {
    id: "rec-suprema",
    restaurantId: RESTAURANT_ID,
    name: "Suprema Napolitana de Pollo",
    category: "Platos Fuertes",
    salePriceBs: 42.0,
    isActive: true,
    ingredients: [
      {
        id: "ri-sup-pollo",
        recipeId: "rec-suprema",
        ingredientId: "ing-pollo",
        quantityRequired: 0.3,
      },
      {
        id: "ri-sup-queso",
        recipeId: "rec-suprema",
        ingredientId: "ing-queso",
        quantityRequired: 0.15,
      },
      {
        id: "ri-sup-tomate",
        recipeId: "rec-suprema",
        ingredientId: "ing-tomate",
        quantityRequired: 0.15,
      },
      {
        id: "ri-sup-arroz",
        recipeId: "rec-suprema",
        ingredientId: "ing-arroz",
        quantityRequired: 0.15,
      },
    ],
  },
];

export const SEED_WASTES: SeedWasteRecord[] = [
  {
    id: "waste-seed-tomate",
    restaurantId: RESTAURANT_ID,
    ingredientId: "ing-tomate",
    quantityLost: 1.5,
    reason: "EXPIRATION",
    monetaryLossBs: 18.0,
    notes: "Cajón maduro en exceso de la compra del martes.",
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: "waste-seed-pollo",
    restaurantId: RESTAURANT_ID,
    ingredientId: "ing-pollo",
    quantityLost: 1.125,
    reason: "COLD_SPOILAGE",
    monetaryLossBs: 27.0,
    notes: "Corte de energía nocturno en cámara auxiliar.",
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
];

export const SEED_SALES: SeedSaleRecord[] = [
  {
    id: "sale-seed-1",
    restaurantId: RESTAURANT_ID,
    recipeId: "rec-pique-macho",
    quantitySold: 6,
    totalRevenueBs: 450.0,
    totalIngredientCostBs: 162.6,
    source: "MANUAL_POS",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "sale-seed-2",
    restaurantId: RESTAURANT_ID,
    recipeId: "rec-silpancho",
    quantitySold: 12,
    totalRevenueBs: 456.0,
    totalIngredientCostBs: 199.5,
    source: "MANUAL_POS",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "sale-seed-3",
    restaurantId: RESTAURANT_ID,
    recipeId: "rec-suprema",
    quantitySold: 8,
    totalRevenueBs: 336.0,
    totalIngredientCostBs: 128.4,
    source: "EXTERNAL_POS",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

export const WASTE_REASON_LABELS: Record<WasteReasonCode, string> = {
  EXPIRATION: "Caducidad / Vencimiento",
  COLD_SPOILAGE: "Deterioro en Frío",
  PREP_ERROR: "Error de Cocción / Corte",
  PORTION_ERROR: "Porciones mal calculadas",
  THEFT_LOSS: "Robo o pérdida",
};
