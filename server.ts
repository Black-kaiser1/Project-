import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("pos.db");

// Initialize database with multi-tenancy
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    plan TEXT CHECK(plan IN ('monthly', 'quarterly', 'annual')) DEFAULT 'monthly',
    expiry_date DATETIME NOT NULL,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    image TEXT,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    total REAL NOT NULL,
    items TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS pending_payments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    expiry_days INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('super_admin', 'tenant_admin', 'staff')) NOT NULL,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS subscription_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    plan TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    reference TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );
`);

// Add low_stock_threshold column if it doesn't exist
try {
  db.exec("ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5");
} catch (e) {
  // Column already exists
}

// Function to check and generate notifications (subscriptions and low stock)
function checkSystemStatus() {
  const now = new Date();
  
  // 1. Check Subscriptions
  const tenants = db.prepare("SELECT id, name, expiry_date FROM tenants").all() as any[];
  tenants.forEach(tenant => {
    const expiry = new Date(tenant.expiry_date);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 7 || diffDays === 3 || diffDays <= 0) {
      let message = "";
      let type = "warning";
      
      if (diffDays === 7) message = "Your subscription expires in 7 days. Please renew to avoid service interruption.";
      else if (diffDays === 3) {
        message = "Urgent: Your subscription expires in 3 days!";
        type = "critical";
      }
      else if (diffDays <= 0) {
        message = "Your subscription has expired. Account is now locked.";
        type = "error";
      }

      const exists = db.prepare("SELECT id FROM notifications WHERE tenant_id = ? AND message = ? AND date(created_at) = date('now')").get(tenant.id, message);
      if (!exists) {
        db.prepare("INSERT INTO notifications (tenant_id, message, type) VALUES (?, ?, ?)").run(tenant.id, message, type);
      }
    }
  });

  // 2. Check Low Stock
  const lowStockProducts = db.prepare("SELECT id, tenant_id, name, stock, low_stock_threshold FROM products WHERE stock <= low_stock_threshold").all() as any[];
  lowStockProducts.forEach(product => {
    const message = `Low stock alert: ${product.name} has only ${product.stock} units left (Threshold: ${product.low_stock_threshold})`;
    
    // Check if notification already exists for today
    const exists = db.prepare("SELECT id FROM notifications WHERE tenant_id = ? AND message = ? AND date(created_at) = date('now')").get(product.tenant_id, message);
    
    if (!exists) {
      db.prepare("INSERT INTO notifications (tenant_id, message, type) VALUES (?, ?, ?)").run(product.tenant_id, message, 'warning');
    }
  });
}

// Run check on start
checkSystemStatus();
// Run check every hour
setInterval(checkSystemStatus, 3600000);

// Seed tenants if empty
const tenantCount = db.prepare("SELECT COUNT(*) as count FROM tenants").get() as { count: number };
if (tenantCount.count === 0) {
  const insertTenant = db.prepare("INSERT INTO tenants (name, email, plan, expiry_date) VALUES (?, ?, ?, ?)");
  
  // Active tenant (30 days from now)
  const date1 = new Date();
  date1.setDate(date1.getDate() + 30);
  insertTenant.run("Lucid Coffee Shop", "coffee@lucid.com", "monthly", date1.toISOString());
  
  // Warning tenant (5 days from now)
  const date2 = new Date();
  date2.setDate(date2.getDate() + 5);
  insertTenant.run("Lucid Bakery", "bakery@lucid.com", "monthly", date2.toISOString());

  // Expired tenant (yesterday)
  const date3 = new Date();
  date3.setDate(date3.getDate() - 1);
  insertTenant.run("Expired Store", "expired@lucid.com", "monthly", date3.toISOString());
}

// Seed users (ensure defaults exist)
db.prepare("INSERT OR REPLACE INTO users (tenant_id, username, password, role) VALUES (null, 'admin', 'admin123', 'super_admin')").run();

const tenants = db.prepare("SELECT id, name FROM tenants").all() as any[];
const coffee = tenants.find(t => t.name === "Lucid Coffee Shop");
const bakery = tenants.find(t => t.name === "Lucid Bakery");

if (coffee) db.prepare("INSERT OR IGNORE INTO users (tenant_id, username, password, role) VALUES (?, ?, ?, ?)").run(coffee.id, "coffee_admin", "coffee123", "tenant_admin");
if (bakery) db.prepare("INSERT OR IGNORE INTO users (tenant_id, username, password, role) VALUES (?, ?, ?, ?)").run(bakery.id, "bakery_admin", "bakery123", "tenant_admin");

console.log("Database seeded with default users.");
const allUsers = db.prepare("SELECT username, role FROM users").all();
console.log("Current users in DB:", allUsers);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    
    if (!user) {
      console.log(`Login failed for: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    console.log(`Login successful for: ${username} (Role: ${user.role})`);
    let tenant = null;
    if (user.tenant_id) {
      tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(user.tenant_id);
    }
    
    res.json({ user, tenant });
  });

  // User Management Routes (Tenant Level)
  app.get("/api/users", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
    const users = db.prepare("SELECT id, username, role FROM users WHERE tenant_id = ?").all(tenantId);
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { tenant_id, username, password, role } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (tenant_id, username, password, role) VALUES (?, ?, ?, ?)").run(tenant_id, username, password, role);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.patch("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    if (password) {
      db.prepare("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?").run(username, password, role, id);
    } else {
      db.prepare("UPDATE users SET username = ?, role = ? WHERE id = ?").run(username, role, id);
    }
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/tenants", (req, res) => {
    const tenants = db.prepare("SELECT * FROM tenants").all();
    res.json(tenants);
  });

  app.get("/api/tenant/:id", (req, res) => {
    const tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(req.params.id);
    res.json(tenant);
  });

  app.get("/api/products", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
    const products = db.prepare("SELECT * FROM products WHERE tenant_id = ?").all(tenantId);
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { tenant_id, name, price, category, stock, low_stock_threshold, image } = req.body;
    const info = db.prepare("INSERT INTO products (tenant_id, name, price, category, stock, low_stock_threshold, image) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      tenant_id, name, price, category, stock, low_stock_threshold || 5, image || `https://picsum.photos/seed/${name}/200/200`
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, category, stock, low_stock_threshold, image } = req.body;
    db.prepare("UPDATE products SET name = ?, price = ?, category = ?, stock = ?, low_stock_threshold = ?, image = ? WHERE id = ?").run(
      name, price, category, stock, low_stock_threshold, image, id
    );
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/transactions", (req, res) => {
    const { total, items, tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

    // Check subscription before allowing transaction
    const tenant = db.prepare("SELECT expiry_date FROM tenants WHERE id = ?").get(tenantId) as { expiry_date: string };
    if (new Date(tenant.expiry_date) < new Date()) {
      return res.status(403).json({ error: "Subscription expired. Please renew to continue." });
    }

    const info = db.prepare("INSERT INTO transactions (total, items, tenant_id) VALUES (?, ?, ?)").run(total, JSON.stringify(items), tenantId);
    
    // Update stock
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?");
    items.forEach((item: any) => {
      updateStock.run(item.quantity, item.id, tenantId);
    });

    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/transactions", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
    const transactions = db.prepare("SELECT * FROM transactions WHERE tenant_id = ? ORDER BY timestamp DESC").all(tenantId);
    res.json(transactions.map((t: any) => ({ ...t, items: JSON.parse(t.items) })));
  });

  app.get("/api/stats", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
    const dailyTotal = db.prepare("SELECT SUM(total) as total FROM transactions WHERE tenant_id = ? AND date(timestamp) = date('now')").get(tenantId) as { total: number };
    const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE tenant_id = ? AND date(timestamp) = date('now')").get(tenantId) as { count: number };
    res.json({
      dailyTotal: dailyTotal.total || 0,
      transactionCount: totalTransactions.count || 0
    });
  });

  app.get("/api/dashboard/detailed-stats", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

    // Total Sales
    const daily = db.prepare("SELECT SUM(total) as total FROM transactions WHERE tenant_id = ? AND date(timestamp) = date('now')").get(tenantId) as any;
    const weekly = db.prepare("SELECT SUM(total) as total FROM transactions WHERE tenant_id = ? AND date(timestamp) >= date('now', '-7 days')").get(tenantId) as any;
    const monthly = db.prepare("SELECT SUM(total) as total FROM transactions WHERE tenant_id = ? AND date(timestamp) >= date('now', '-30 days')").get(tenantId) as any;

    // Sales Trends (last 30 days)
    const trends = db.prepare(`
      SELECT date(timestamp) as date, SUM(total) as amount 
      FROM transactions 
      WHERE tenant_id = ? AND date(timestamp) >= date('now', '-30 days')
      GROUP BY date(timestamp)
      ORDER BY date(timestamp) ASC
    `).all(tenantId) as any[];

    // Best Sellers
    const transactions = db.prepare("SELECT items FROM transactions WHERE tenant_id = ? AND date(timestamp) >= date('now', '-30 days')").all(tenantId) as any[];
    const productStats: Record<string, { quantity: number, revenue: number }> = {};

    transactions.forEach(t => {
      const items = JSON.parse(t.items);
      items.forEach((item: any) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { quantity: 0, revenue: 0 };
        }
        productStats[item.name].quantity += item.quantity;
        productStats[item.name].revenue += (item.price * item.quantity);
      });
    });

    const bestSellers = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({
      totalSales: {
        daily: daily?.total || 0,
        weekly: weekly?.total || 0,
        monthly: monthly?.total || 0
      },
      salesTrends: trends,
      bestSellers
    });
  });

  // Subscription Payments (Tenant Side)
  app.post("/api/subscription/pay", (req, res) => {
    const { tenantId, plan, amount, paymentMethod, reference } = req.body;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

    db.prepare("INSERT INTO subscription_payments (tenant_id, plan, amount, payment_method, reference) VALUES (?, ?, ?, ?, ?)").run(
      tenantId, plan, amount, paymentMethod, reference
    );

    // Notify admin
    db.prepare("INSERT INTO notifications (tenant_id, message, type) VALUES (null, ?, ?)").run(
      `New subscription payment request from tenant #${tenantId} (${plan} plan).`, 'info'
    );

    res.json({ success: true });
  });

  app.get("/api/subscription/history", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
    const history = db.prepare("SELECT * FROM subscription_payments WHERE tenant_id = ? ORDER BY created_at DESC").all(tenantId);
    res.json(history);
  });

  // Subscription Management (Admin Side)
  app.get("/api/admin/subscriptions/pending", (req, res) => {
    const pending = db.prepare(`
      SELECT sp.*, t.name as tenant_name 
      FROM subscription_payments sp 
      JOIN tenants t ON sp.tenant_id = t.id 
      WHERE sp.status = 'pending'
      ORDER BY sp.created_at DESC
    `).all();
    res.json(pending);
  });

  app.post("/api/admin/subscriptions/approve", (req, res) => {
    const { paymentId } = req.body;
    const payment = db.prepare("SELECT * FROM subscription_payments WHERE id = ?").get(paymentId) as any;
    
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== 'pending') return res.status(400).json({ error: "Payment already processed" });

    const days = payment.plan === 'annual' ? 365 : payment.plan === 'quarterly' ? 90 : 30;
    
    // Update tenant expiry
    const tenant = db.prepare("SELECT expiry_date FROM tenants WHERE id = ?").get(payment.tenant_id) as any;
    let currentExpiry = new Date(tenant.expiry_date);
    if (currentExpiry < new Date()) currentExpiry = new Date();
    
    currentExpiry.setDate(currentExpiry.getDate() + days);

    db.prepare("UPDATE tenants SET plan = ?, expiry_date = ?, status = 'active' WHERE id = ?").run(
      payment.plan, currentExpiry.toISOString(), payment.tenant_id
    );

    // Update payment status
    db.prepare("UPDATE subscription_payments SET status = 'approved' WHERE id = ?").run(paymentId);

    // Notify tenant
    db.prepare("INSERT INTO notifications (tenant_id, message, type) VALUES (?, ?, ?)").run(
      payment.tenant_id, `Your ${payment.plan} subscription has been approved! New expiry: ${currentExpiry.toLocaleDateString()}`, 'success'
    );

    res.json({ success: true });
  });

  app.post("/api/admin/subscriptions/reject", (req, res) => {
    const { paymentId, reason } = req.body;
    db.prepare("UPDATE subscription_payments SET status = 'rejected' WHERE id = ?").run(paymentId);
    
    const payment = db.prepare("SELECT tenant_id FROM subscription_payments WHERE id = ?").get(paymentId) as any;
    db.prepare("INSERT INTO notifications (tenant_id, message, type) VALUES (?, ?, ?)").run(
      payment.tenant_id, `Your subscription payment was rejected. Reason: ${reason || 'Invalid reference'}`, 'error'
    );

    res.json({ success: true });
  });

  app.post("/api/renew", (req, res) => {
    const { tenantId, plan } = req.body;
    const days = plan === 'annual' ? 365 : plan === 'quarterly' ? 90 : 30;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    
    db.prepare("UPDATE tenants SET plan = ?, expiry_date = ?, status = 'active' WHERE id = ?").run(plan, newExpiry.toISOString(), tenantId);
    
    // Add success notification
    db.prepare("INSERT INTO notifications (tenant_id, message, type) VALUES (?, ?, ?)").run(tenantId, `Subscription successfully renewed for ${plan} plan.`, 'success');
    
    res.json({ success: true, expiry_date: newExpiry.toISOString() });
  });

  app.get("/api/notifications", (req, res) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
    const notifications = db.prepare("SELECT * FROM notifications WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 20").all(tenantId);
    res.json(notifications);
  });

  app.post("/api/notifications/read", (req, res) => {
    const { tenantId } = req.body;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE tenant_id = ?").run(tenantId);
    res.json({ success: true });
  });

  // Super Admin Routes
  app.get("/api/admin/stats", (req, res) => {
    const totalTenants = db.prepare("SELECT COUNT(*) as count FROM tenants").get() as { count: number };
    const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number };
    const totalRevenue = db.prepare("SELECT SUM(total) as total FROM transactions").get() as { total: number };
    const activeTenants = db.prepare("SELECT COUNT(*) as count FROM tenants WHERE expiry_date > datetime('now')").get() as { count: number };
    
    res.json({
      totalTenants: totalTenants.count,
      totalTransactions: totalTransactions.count,
      totalRevenue: totalRevenue.total || 0,
      activeTenants: activeTenants.count
    });
  });

  app.post("/api/admin/tenants/init-payment", (req, res) => {
    const { name, email, plan, expiry_days } = req.body;
    const amount = plan === 'annual' ? 299 : plan === 'quarterly' ? 79 : 29;
    const paymentId = `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    db.prepare("INSERT INTO pending_payments (id, name, email, plan, expiry_days, amount) VALUES (?, ?, ?, ?, ?, ?)").run(
      paymentId, name, email, plan, expiry_days, amount
    );
    
    res.json({ paymentId, amount });
  });

  app.post("/api/admin/tenants/finalize", (req, res) => {
    const { paymentId } = req.body;
    const pending = db.prepare("SELECT * FROM pending_payments WHERE id = ? AND status = 'pending'").get(paymentId) as any;
    
    if (!pending) return res.status(404).json({ error: "Payment record not found or already processed" });
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + pending.expiry_days);
    
    try {
      db.transaction(() => {
        db.prepare("UPDATE pending_payments SET status = 'completed' WHERE id = ?").run(paymentId);
        db.prepare("INSERT INTO tenants (name, email, plan, expiry_date) VALUES (?, ?, ?, ?)").run(
          pending.name, pending.email, pending.plan, expiryDate.toISOString()
        );
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/tenants/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM transactions WHERE tenant_id = ?").run(id);
    db.prepare("DELETE FROM products WHERE tenant_id = ?").run(id);
    db.prepare("DELETE FROM notifications WHERE tenant_id = ?").run(id);
    db.prepare("DELETE FROM tenants WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.patch("/api/admin/tenants/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, plan, expiry_date } = req.body;
    db.prepare("UPDATE tenants SET name = ?, email = ?, plan = ?, expiry_date = ? WHERE id = ?").run(name, email, plan, expiry_date, id);
    res.json({ success: true });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
