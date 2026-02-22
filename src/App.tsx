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
  X,
  Store,
  AlertTriangle,
  Lock,
  Calendar,
  LogOut,
  Bell,
  Info,
  ShieldCheck,
  Settings,
  Users,
  TrendingUp,
  PlusCircle,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Transaction, DashboardStats, Tenant, Notification, AdminStats } from './types';

export default function App() {
  const [view, setView] = useState<'portal' | 'store' | 'admin'>('portal');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'history' | 'inventory'>('pos');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ dailyTotal: 0, transactionCount: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  // Admin State
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ paymentId: string, amount: number } | null>(null);
  const [newTenant, setNewTenant] = useState({ name: '', email: '', plan: 'monthly', expiry_days: 30 });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (currentTenant) {
      fetchProducts();
      fetchStats();
      fetchTransactions();
      fetchNotifications();
    }
  }, [currentTenant]);

  useEffect(() => {
    if (view === 'admin') {
      fetchAdminStats();
    }
  }, [view]);

  const fetchTenants = async () => {
    const res = await fetch('/api/tenants');
    const data = await res.json();
    setTenants(data);
  };

  const fetchAdminStats = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setAdminStats(data);
  };

  const handleInitCreate = () => {
    if (!newTenant.name || !newTenant.email) {
      alert('Please fill in all fields');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCreate = async () => {
    setIsConfirmModalOpen(false);
    const res = await fetch('/api/admin/tenants/init-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTenant)
    });
    if (res.ok) {
      const data = await res.json();
      setPendingPayment(data);
      setIsPaymentModalOpen(true);
    }
  };

  const handleFinalizePayment = async () => {
    if (!pendingPayment) return;
    const res = await fetch('/api/admin/tenants/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: pendingPayment.paymentId })
    });
    if (res.ok) {
      fetchTenants();
      fetchAdminStats();
      setIsPaymentModalOpen(false);
      setIsAdminModalOpen(false);
      setNewTenant({ name: '', email: '', plan: 'monthly', expiry_days: 30 });
      setPendingPayment(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDeleteTenant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tenant and all its data?')) return;
    const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTenants();
      fetchAdminStats();
    }
  };

  const fetchProducts = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/products?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setProducts(data);
  };

  const fetchStats = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/stats?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setStats(data);
  };

  const fetchTransactions = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/transactions?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setTransactions(data);
  };

  const fetchNotifications = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/notifications?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setNotifications(data);
  };

  const markNotificationsRead = async () => {
    if (!currentTenant) return;
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: currentTenant.id })
    });
    fetchNotifications();
  };

  const handleRenew = async (plan: string) => {
    if (!currentTenant) return;
    const res = await fetch('/api/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: currentTenant.id, plan })
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentTenant({ ...currentTenant, expiry_date: data.expiry_date, plan: plan as any });
      setIsRenewing(false);
      fetchTenants();
      fetchNotifications();
    }
  };

  const subscriptionStatus = useMemo(() => {
    if (!currentTenant) return null;
    const expiry = new Date(currentTenant.expiry_date);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      daysLeft: diffDays,
      isExpired: diffDays <= 0,
      isWarning: diffDays <= 7 && diffDays > 0,
      isCritical: diffDays <= 3 && diffDays > 0
    };
  }, [currentTenant]);

  const addToCart = (product: Product) => {
    if (subscriptionStatus?.isExpired) return;
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
    if (cart.length === 0 || !currentTenant) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: cartTotal,
          items: cart,
          tenantId: currentTenant.id
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
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error('Checkout failed', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (view === 'portal') {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-900 overflow-hidden shadow-2xl p-8 justify-center relative">
        <button 
          onClick={() => setView('admin')}
          className="absolute top-8 right-8 p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-emerald-400 transition-colors border border-slate-700"
        >
          <ShieldCheck size={24} />
        </button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 rotate-3">
            <Store size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Lucid Hub POS</h1>
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">SaaS Multi-Tenant Portal</p>
        </div>

        <div className="space-y-4 overflow-y-auto no-scrollbar max-h-[50vh]">
          <p className="text-slate-400 text-sm font-medium mb-2">Select your store to continue:</p>
          {tenants.map(tenant => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={tenant.id}
              onClick={() => {
                setCurrentTenant(tenant);
                setView('store');
              }}
              className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl flex justify-between items-center group hover:border-emerald-500/50 transition-all"
            >
              <div className="text-left">
                <h3 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{tenant.name}</h3>
                <p className="text-slate-500 text-xs">{tenant.email}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                  new Date(tenant.expiry_date) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {new Date(tenant.expiry_date) < new Date() ? 'Expired' : 'Active'}
                </span>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>

        <p className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-widest font-bold">
          Powered by Lucid IT Hub
        </p>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
        <header className="bg-slate-900 px-6 py-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-white">Super Admin</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">System Management</p>
          </div>
          <button 
            onClick={() => setView('portal')}
            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {adminStats && (
            <div className="grid grid-cols-2 gap-4">
              <AdminStatCard icon={<Users size={20} />} label="Total Tenants" value={adminStats.totalTenants} />
              <AdminStatCard icon={<TrendingUp size={20} />} label="Total Revenue" value={`$${adminStats.totalRevenue.toFixed(0)}`} />
              <AdminStatCard icon={<ShoppingCart size={20} />} label="Transactions" value={adminStats.totalTransactions} />
              <AdminStatCard icon={<CheckCircle2 size={20} />} label="Active Stores" value={adminStats.activeTenants} />
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900">Manage Tenants</h2>
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
            >
              <PlusCircle size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {tenants.map(tenant => (
              <div key={tenant.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{tenant.name}</h3>
                  <p className="text-[10px] text-slate-500">{tenant.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{tenant.plan}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      new Date(tenant.expiry_date) < new Date() ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'
                    }`}>
                      {new Date(tenant.expiry_date) < new Date() ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCurrentTenant(tenant);
                      setView('store');
                    }}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-500 transition-colors rounded-xl"
                  >
                    <Settings size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTenant(tenant.id)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Create Tenant Modal */}
        <AnimatePresence>
          {isAdminModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl z-[100] p-8 space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900">New Tenant Store</h2>
                  <p className="text-slate-500 text-sm">Onboard a new business to Lucid Hub</p>
                </div>

                <div className="space-y-4">
                  <AdminInput label="Store Name" value={newTenant.name} onChange={v => setNewTenant({...newTenant, name: v})} placeholder="e.g. Lucid Coffee" />
                  <AdminInput label="Owner Email" value={newTenant.email} onChange={v => setNewTenant({...newTenant, email: v})} placeholder="owner@example.com" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Plan</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={newTenant.plan}
                        onChange={e => setNewTenant({...newTenant, plan: e.target.value})}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                    <AdminInput label="Days to Expiry" type="number" value={newTenant.expiry_days.toString()} onChange={v => setNewTenant({...newTenant, expiry_days: parseInt(v)})} />
                  </div>
                </div>

                <button 
                  onClick={handleInitCreate}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
                >
                  Proceed to Payment
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {isConfirmModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsConfirmModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[110]"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] bg-white rounded-[2.5rem] shadow-2xl z-[110] p-8 space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Confirm Store Creation</h3>
                  <p className="text-slate-500 text-sm mt-2">You are about to create <span className="font-bold text-slate-800">{newTenant.name}</span>. This will generate a payment request.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Plan</span>
                    <span className="text-slate-900 font-black uppercase">{newTenant.plan}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Owner</span>
                    <span className="text-slate-900 font-black">{newTenant.email}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmCreate}
                    className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Payment Simulation Modal */}
        <AnimatePresence>
          {isPaymentModalOpen && pendingPayment && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl z-[120]"
              />
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] bg-white rounded-[3rem] shadow-2xl z-[120] overflow-hidden"
              >
                <div className="bg-emerald-500 p-8 text-center text-white">
                  <CreditCard size={48} className="mx-auto mb-4" />
                  <h2 className="text-2xl font-black">Secure Checkout</h2>
                  <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mt-1">Payment Gateway Simulation</p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</p>
                        <p className="text-sm font-mono font-bold text-slate-600">{pendingPayment.paymentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Due</p>
                        <p className="text-3xl font-black text-slate-900">${pendingPayment.amount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <CreditCard size={20} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800">Visa ending in 4242</p>
                          <p className="text-[10px] text-slate-400">Expires 12/26</p>
                        </div>
                        <div className="w-4 h-4 rounded-full border-4 border-emerald-500"></div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleFinalizePayment}
                    className="w-full bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Pay ${pendingPayment.amount.toFixed(2)}
                  </button>
                  
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    🔒 Encrypted by Lucid IT Hub Security
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
      {/* Subscription Warning Banner */}
      {subscriptionStatus?.isWarning && !subscriptionStatus.isExpired && (
        <div className={`px-4 py-2 flex items-center justify-between gap-3 text-xs font-bold ${
          subscriptionStatus.isCritical ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>Subscription expires in {subscriptionStatus.daysLeft} days!</span>
          </div>
          <button onClick={() => setIsRenewing(true)} className="bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
            Renew Now
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
            {currentTenant.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">{currentTenant.name}</h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-emerald-600">Lucid Hub POS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsNotificationsOpen(true);
              markNotificationsRead();
            }}
            className="relative p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <Bell size={18} className="text-slate-700" />
            {notifications.some(n => !n.is_read) && (
              <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            )}
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <ShoppingCart size={18} className="text-slate-700" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              setCurrentTenant(null);
              setView('portal');
            }}
            className="p-2 bg-slate-100 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 relative">
        {subscriptionStatus?.isExpired ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-500 shadow-inner">
              <Lock size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Access Locked</h2>
              <p className="text-slate-500 text-sm">Your subscription for <span className="font-bold text-slate-800">{currentTenant.name}</span> expired on {new Date(currentTenant.expiry_date).toLocaleDateString()}.</p>
            </div>
            <button 
              onClick={() => setIsRenewing(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              <CreditCard size={20} />
              Renew Subscription
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Sales</p>
                    <p className="text-2xl font-black text-slate-900">${stats.dailyTotal.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transactions</p>
                    <p className="text-2xl font-black text-slate-900">{stats.transactionCount}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Subscription</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{currentTenant.plan.charAt(0).toUpperCase() + currentTenant.plan.slice(1)} Plan</p>
                      <p className="text-[10px] text-slate-500">Expires: {new Date(currentTenant.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setIsRenewing(true)} className="text-[10px] font-bold text-emerald-600 hover:underline">Manage</button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-slate-800">Order #{t.id}</p>
                          <p className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <p className="font-black text-emerald-600">+${t.total.toFixed(2)}</p>
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
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
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
                      className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col gap-2 group relative overflow-hidden"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 truncate">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 mb-1">{product.category}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-black text-emerald-600">${product.price.toFixed(2)}</p>
                          <span className="text-[9px] font-bold text-slate-400">Qty: {product.stock}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 mb-4">Transaction History</h2>
                {transactions.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-900">Order #{t.id}</p>
                        <p className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-lg font-black text-emerald-600">${t.total.toFixed(2)}</p>
                    </div>
                    <div className="text-[10px] text-slate-600 border-t border-slate-50 pt-2 mt-2 space-y-1">
                      {t.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span className="font-medium">{item.name} x{item.quantity}</span>
                          <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 mb-4">Inventory</h2>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 font-bold text-slate-800">{p.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {p.stock} UNITS
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">${p.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
        <NavButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} icon={<ShoppingCart size={20} />} label="POS" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20} />} label="History" />
        <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={20} />} label="Stock" />
      </nav>

      {/* Notifications Modal */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[80]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 bottom-0 w-4/5 bg-white shadow-2xl z-[80] flex flex-col"
            >
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900">Notifications</h2>
                <button onClick={() => setIsNotificationsOpen(false)} className="p-2 bg-slate-100 rounded-full">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <Bell size={48} className="mb-4" />
                    <p className="text-sm font-bold">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl border ${
                      n.type === 'critical' || n.type === 'error' ? 'bg-red-50 border-red-100' : 
                      n.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                      n.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                      'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex gap-3">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          n.type === 'critical' || n.type === 'error' ? 'text-red-500' : 
                          n.type === 'warning' ? 'text-amber-500' :
                          n.type === 'success' ? 'text-emerald-500' :
                          'text-slate-500'
                        }`}>
                          {n.type === 'critical' || n.type === 'error' ? <AlertTriangle size={18} /> : 
                           n.type === 'success' ? <CheckCircle2 size={18} /> :
                           <Info size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-bold">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Renew Modal */}
      <AnimatePresence>
        {isRenewing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRenewing(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[70]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900">Renew Subscription</h2>
                <p className="text-slate-500 text-sm">Select a plan for <span className="font-bold">{currentTenant.name}</span></p>
              </div>

              <div className="space-y-3">
                <PlanOption 
                  title="Monthly" 
                  price="$29.00" 
                  period="/mo" 
                  onClick={() => handleRenew('monthly')} 
                />
                <PlanOption 
                  title="Quarterly" 
                  price="$79.00" 
                  period="/3mo" 
                  onClick={() => handleRenew('quarterly')} 
                  best
                />
                <PlanOption 
                  title="Annual" 
                  price="$299.00" 
                  period="/yr" 
                  onClick={() => handleRenew('annual')} 
                />
              </div>

              <button 
                onClick={() => setIsRenewing(false)}
                className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                <h2 className="text-xl font-black text-slate-900">Current Order</h2>
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
                    <p className="text-slate-500 font-bold">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                        <p className="text-xs text-emerald-600 font-black">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-full transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-full transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Subtotal</span>
                  <span className="text-slate-900 font-black">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-900 font-black">Total</span>
                  <span className="text-emerald-600 font-black">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || subscriptionStatus?.isExpired}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
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
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100 text-center space-y-4 max-w-[280px]">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Success!</h3>
                <p className="text-xs text-slate-500 font-medium">Transaction has been recorded successfully.</p>
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
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function PlanOption({ title, price, period, onClick, best }: { title: string, price: string, period: string, onClick: () => void, best?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-5 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
        best ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-black text-slate-900">{title}</h4>
          {best && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Best Value</span>}
        </div>
        <p className="text-xs text-slate-500">Full access to all features</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-slate-900">{price}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{period}</p>
      </div>
    </button>
  );
}

function AdminStatCard({ icon, label, value }: { icon: ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="text-emerald-500 mb-2">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function AdminInput({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  );
}


