import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña").optional(),
});

export const demoSwitchSchema = z.object({
  role: z.enum(["ADMIN", "KITCHEN"]),
});

export const ingredientCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nombre requerido").max(120),
  category: z.enum([
    "Carnes",
    "Verduras",
    "Tubérculos",
    "Lácteos",
    "Abarrotes",
    "Aceites",
  ]),
  location: z.enum(["Cámara Frío", "Almacén Seco", "Cocina"]),
  unit: z.enum(["kg", "L", "u"]),
  currentStock: z.number().min(0),
  minStock: z.number().min(0),
  optimalStock: z.number().positive(),
  unitCostBs: z.number().min(0),
  defaultSupplierId: z.string().min(1),
  alternativeSupplierIds: z.array(z.string()).default([]),
});

export const quickPurchaseSchema = z.object({
  ingredientId: z.string().min(1),
  quantityAdded: z.number().positive(),
  newUnitCostBs: z.number().min(0).optional(),
  clientMutationId: z.string().min(1),
});

export const recipeCreateSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  salePriceBs: z.number().positive(),
  ingredients: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        quantityRequired: z.number().positive(),
      })
    )
    .min(1, "Agrega al menos un insumo a la receta"),
});

export const saleCreateSchema = z.object({
  recipeId: z.string().min(1),
  quantitySold: z.number().int().positive().default(1),
  source: z.enum(["MANUAL_POS", "EXTERNAL_POS"]).default("MANUAL_POS"),
  clientMutationId: z.string().min(1),
});

export const wasteCreateSchema = z.object({
  ingredientId: z.string().min(1),
  quantityLost: z.number().positive(),
  reason: z.enum([
    "EXPIRATION",
    "COLD_SPOILAGE",
    "PREP_ERROR",
    "PORTION_ERROR",
    "THEFT_LOSS",
  ]),
  notes: z.string().max(300).optional().default(""),
  clientMutationId: z.string().min(1),
});

export const purchaseOrderItemSchema = z.object({
  ingredientId: z.string().min(1),
  ingredientName: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitCostBs: z.number().min(0),
  subtotalBs: z.number().min(0),
});

export const purchaseOrderActionSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().min(1),
  status: z.enum(["DRAFT_OFFLINE", "SENT_WHATSAPP", "RECEIVED"]),
  whatsappMessage: z.string().min(1),
  estimatedTotalBs: z.number().min(0),
  items: z.array(purchaseOrderItemSchema).min(1),
  clientMutationId: z.string().min(1),
});

export const syncMutationSchema = z.object({
  clientMutationId: z.string().min(1),
  type: z.enum([
    "SALE_POS",
    "WASTE_RECORD",
    "QUICK_PURCHASE",
    "PURCHASE_ORDER_SENT",
    "PURCHASE_ORDER_RECEIVED",
    "INGREDIENT_UPSERT",
    "RECIPE_CREATE",
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const syncBatchSchema = z.object({
  mutations: z.array(syncMutationSchema),
});

export const subscriptionDemoSchema = z.object({
  plan: z.enum(["BASE", "PRO"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL_10X12"]),
  isAseracMember: z.boolean().default(false),
  action: z.enum(["SIMULATE_PAYMENT", "SELECT_PLAN"]).default("SIMULATE_PAYMENT"),
});
