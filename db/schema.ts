import { 
  pgTable, serial, text, timestamp, integer, decimal, 
  pgEnum, boolean, numeric, jsonb, index 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const orderSourceEnum = pgEnum('order_source', ['POS', 'ZOMATO', 'SWIGGY']);
export const orderStatusEnum = pgEnum('order_status', ['RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']);
export const customerTypeEnum = pgEnum("customer_type", ["REGULAR", "SUBSCRIBER", "VIP"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "EXPIRED", "CANCELLED", "PAUSED"]);
export const mealTypeEnum = pgEnum("meal_type", ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  password: text('password'),
  adminPin: text("admin_pin"),
  twoFactorEnabled: boolean("two_factor_enabled").default(true),
  role: text('role').default('staff'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
]);

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  tokenNumber: text('token_number').notNull(), 
  source: orderSourceEnum('source').default('POS'),
  status: text("status", { 
    enum: ["RECEIVED", "PREPARING", "READY", "COMPLETED", "CANCELLED", "archived"] 
  }).default("RECEIVED").notNull(),  
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).default('5.00'),
  customerPhone: text('customer_phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('orders_created_at_idx').on(table.createdAt),
  index('orders_status_idx').on(table.status),
  index('orders_user_id_idx').on(table.userId),
]);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
]);

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  currentStock: decimal('current_stock', { precision: 12, scale: 2 }).default('0.00'),
  unit: text('unit').notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).default("0.00"),
  minStockLevel: decimal('min_stock_level', { precision: 12, scale: 2 }).default('5.00'),
  expiryDate: timestamp("expiry_date"),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('inventory_name_idx').on(table.name),
]);

export const stockLogs = pgTable('stock_logs', {
  id: serial('id').primaryKey(),
  inventoryId: integer('inventory_id').references(() => inventory.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  staffName: text('staff_name'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('stock_logs_inventory_id_idx').on(table.inventoryId),
  index('stock_logs_created_at_idx').on(table.createdAt),
]);

export const inventoryRelations = relations(inventory, ({ many }) => ({
  logs: many(stockLogs),
}));

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").default(0),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default("0.00"),
  isAvailable: boolean("is_available").default(true),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index('menu_items_category_id_idx').on(table.categoryId),
  index('menu_items_name_idx').on(table.name),
]);

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
}));

export const reconciliations = pgTable('reconciliations', {
  id: serial('id').primaryKey(),
  date: timestamp('date').defaultNow().notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  inventoryExpense: decimal("inventory_expense", { precision: 12, scale: 2 }).default("0.00"),
  staffExpenses: decimal("staff_expenses", { precision: 12, scale: 2 }).default("0.00"),
  miscExpenses: decimal("misc_expenses", { precision: 12, scale: 2 }).default("0.00"),
  netEarning: decimal("net_earning", { precision: 12, scale: 2 }).default("0.00"),
  orderCount: integer("order_count").default(0),
  status: text("status").default("closed"),
  staffName: text("staff_name"),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('reconciliations_date_idx').on(table.date),
]);

export type Reconciliation = typeof reconciliations.$inferSelect;

export const customerProfiles = pgTable("customer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  customerType: customerTypeEnum("customer_type").default("REGULAR").notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  isLoyal: boolean("is_loyal").default(false).notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index('customer_profiles_phone_idx').on(table.phone),
  index('customer_profiles_user_id_idx').on(table.userId),
]);

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").default(30).notNull(),
  mealsPerDay: integer("meals_per_day").default(1).notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentReference: text("payment_reference"),
  benefitsApplied: boolean("benefits_applied").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_status_idx').on(table.status),
]);

export const customerAnalytics = pgTable("customer_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  totalVisits: integer("total_visits").default(0).notNull(),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0.00").notNull(),
  averageOrderValue: decimal("aov", { precision: 10, scale: 2 }).default("0.00").notNull(),
  firstVisit: timestamp("first_visit").defaultNow().notNull(),
  lastVisit: timestamp("last_visit").defaultNow().notNull(),
  preferredMealType: text("preferred_meal_type"),
  favoriteCategories: jsonb("favorite_categories").$type<string[]>(),
  dietaryNotes: text("dietary_notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index('customer_analytics_user_id_idx').on(table.userId),
]);
