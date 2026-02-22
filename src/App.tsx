import { useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ChevronRight,
  CreditCard,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Transaction, DashboardStats } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'history' | 'inventory'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ dailyTotal: 0, transactionCount: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTransactions(data);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: cartTotal,
          items: cart
        })
      });

      if (res.ok) {
        setCart([]);
        setIsCartOpen(false);
        setShowSuccess(true);
        fetchProducts();
        fetchStats();
        fetchTransactions();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Checkout failed', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Lucid Hub POS</h1>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-600">Powered by Lucid IT Hub</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        >
          <ShoppingCart size={20} className="text-slate-700" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Today's Sales</p>
                <p className="text-2xl font-bold text-slate-900">${stats.dailyTotal.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{stats.transactionCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-slate-800">Order #{t.id}</p>
                      <p className="text-xs text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <p className="font-bold text-emerald-600">+${t.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col gap-2 group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{product.name}</h4>
                    <p className="text-xs text-slate-500 mb-1">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-emerald-600">${product.price.toFixed(2)}</p>
                      <span className="text-[10px] text-slate-400">Stock: {product.stock}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Transaction History</h2>
            {transactions.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900">Order #{t.id}</p>
                    <p className="text-xs text-slate-500">{new Date(t.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">${t.total.toFixed(2)}</p>
                </div>
                <div className="text-xs text-slate-600 border-t border-slate-50 pt-2 mt-2">
                  {t.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Inventory Management</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">${p.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22} />} label="Home" />
        <NavButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} icon={<ShoppingCart size={22} />} label="POS" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22} />} label="History" />
        <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={22} />} label="Stock" />
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl z-50 flex flex-col max-h-[85%]"
            >
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Current Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                        <p className="text-xs text-emerald-600 font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-full transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-full transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="text-slate-900 font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tax (0%)</span>
                  <span className="text-slate-900 font-bold">$0.00</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-900 font-bold">Total</span>
                  <span className="text-emerald-600 font-black">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <CreditCard size={20} />
                  Complete Checkout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-6"
          >
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-emerald-100 text-center space-y-4 max-w-[280px]">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Payment Success!</h3>
                <p className="text-sm text-slate-500">Transaction has been recorded successfully.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-emerald-50' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
