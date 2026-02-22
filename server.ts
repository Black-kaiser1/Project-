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
`);

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

  // Seed products for the first two tenants
  const insertProduct = db.prepare("INSERT INTO products (tenant_id, name, price, category, stock, image) VALUES (?, ?, ?, ?, ?, ?)");
  [1, 2].forEach(tid => {
    insertProduct.run(tid, "Coffee Latte", 4.50, "Beverages", 50, "https://picsum.photos/seed/latte/200/200");
    insertProduct.run(tid, "Cappuccino", 4.00, "Beverages", 40, "https://picsum.photos/seed/cappuccino/200/200");
    insertProduct.run(tid, "Croissant", 3.25, "Bakery", 30, "https://picsum.photos/seed/croissant/200/200");
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  app.post("/api/renew", (req, res) => {
    const { tenantId, plan } = req.body;
    const days = plan === 'annual' ? 365 : plan === 'quarterly' ? 90 : 30;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    
    db.prepare("UPDATE tenants SET plan = ?, expiry_date = ?, status = 'active' WHERE id = ?").run(plan, newExpiry.toISOString(), tenantId);
    res.json({ success: true, expiry_date: newExpiry.toISOString() });
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
