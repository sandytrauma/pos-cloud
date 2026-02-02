import { pgTable, serial, text, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums for strict type safety
export const orderSourceEnum = pgEnum('order_source', ['POS', 'ZOMATO', 'SWIGGY']);
export const orderStatusEnum = pgEnum('order_status', ['RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']);

// 1. Users Table (for NextAuth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hashed bcrypt password
  role: text('role').default('staff'), // 'admin' or 'staff'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Orders Table (The Core)
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  tokenNumber: text('token_number').notNull(), 
  source: orderSourceEnum('source').default('POS'),
  status: orderStatusEnum('status').default('RECEIVED'),
  
  // Financials in INR (Decimal for precision)
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).default('5.00'), // Track the rate used (5% or 18%)
  
  customerPhone: text('customer_phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Order Items Table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(), // Price per unit
});

// 4. Drizzle Relations (Crucial for the Dashboard)
// This allows you to fetch an order AND its items in one clean query
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
  unit: text('unit').notNull(), // 'kg', 'ltr', 'pcs', 'packets'
  minStockLevel: decimal('min_stock_level', { precision: 12, scale: 2 }).default('5.00'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Stock Logs (The Digital Register)
export const stockLogs = pgTable('stock_logs', {
  id: serial('id').primaryKey(),
  inventoryId: integer('inventory_id').references(() => inventory.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'IN' (Purchase) or 'OUT' (Usage/Wastage)
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  staffName: text('staff_name'), // Who made the entry
  reason: text('reason'), // e.g., 'Daily Usage', 'New Supply', 'Spoilage'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const inventoryRelations = relations(inventory, ({ many }) => ({
  logs: many(stockLogs),
}));