import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("pos.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    items TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insert = db.prepare("INSERT INTO products (name, price, category, stock, image) VALUES (?, ?, ?, ?, ?)");
  insert.run("Coffee Latte", 4.50, "Beverages", 50, "https://picsum.photos/seed/latte/200/200");
  insert.run("Cappuccino", 4.00, "Beverages", 40, "https://picsum.photos/seed/cappuccino/200/200");
  insert.run("Croissant", 3.25, "Bakery", 30, "https://picsum.photos/seed/croissant/200/200");
  insert.run("Blueberry Muffin", 2.75, "Bakery", 25, "https://picsum.photos/seed/muffin/200/200");
  insert.run("Avocado Toast", 8.50, "Food", 15, "https://picsum.photos/seed/toast/200/200");
  insert.run("Green Tea", 3.00, "Beverages", 60, "https://picsum.photos/seed/greentea/200/200");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/transactions", (req, res) => {
    const { total, items } = req.body;
    const info = db.prepare("INSERT INTO transactions (total, items) VALUES (?, ?)").run(total, JSON.stringify(items));
    
    // Update stock
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    items.forEach((item: any) => {
      updateStock.run(item.quantity, item.id);
    });

    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY timestamp DESC").all();
    res.json(transactions.map((t: any) => ({ ...t, items: JSON.parse(t.items) })));
  });

  app.get("/api/stats", (req, res) => {
    const dailyTotal = db.prepare("SELECT SUM(total) as total FROM transactions WHERE date(timestamp) = date('now')").get() as { total: number };
    const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE date(timestamp) = date('now')").get() as { count: number };
    res.json({
      dailyTotal: dailyTotal.total || 0,
      transactionCount: totalTransactions.count || 0
    });
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
