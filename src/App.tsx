import { useState, useEffect, useMemo, ReactNode, FormEvent } from 'react';
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
  AlertCircle,
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
  Trash,
  Printer,
  WifiOff,
  CloudUpload,
  BarChart3,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Product, CartItem, Transaction, DashboardStats, Tenant, Notification, AdminStats, User, SubscriptionPayment, DetailedStats } from './types';

export default function App() {
  const [view, setView] = useState<'login' | 'store' | 'admin'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'history' | 'inventory' | 'users' | 'subscription' | 'settings'>('pos');
  const [adminActiveTab, setAdminActiveTab] = useState<'tenants' | 'security' | 'payments'>('tenants');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User & { password?: string }> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ dailyTotal: 0, transactionCount: 0 });
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'pay'>('select');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string, title: string, price: number } | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank'>('momo');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionPayment[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'payment'>('form');
  const [registrationData, setRegistrationData] = useState({ name: '', email: '', plan: 'monthly', password: '', confirmPassword: '' });
  const [registrationPaymentInfo, setRegistrationPaymentInfo] = useState<{ paymentId: string, amount: number } | null>(null);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'identify' | 'reset'>('identify');
  const [forgotPasswordData, setForgotPasswordData] = useState({ username: '', email: '', resetToken: '', newPassword: '', confirmPassword: '' });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Admin State
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<SubscriptionPayment[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ paymentId: string, amount: number } | null>(null);
  const [newTenant, setNewTenant] = useState({ name: '', email: '', plan: 'monthly' as any, expiry_days: 30, password: 'password123' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isBulkUpdateMode, setIsBulkUpdateMode] = useState(false);
  const [bulkStockData, setBulkStockData] = useState<Record<number, number>>({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && currentTenant) {
      syncOfflineTransactions();
    }
  }, [isOnline, currentTenant]);

  useEffect(() => {
    if (currentUser) {
      setProfileData({ username: currentUser.username, email: currentUser.email });
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, userId: currentUser.id })
      });
      if (res.ok) {
        setCurrentUser({ ...currentUser, ...profileData });
        setIsProfileModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const syncOfflineTransactions = async () => {
    if (!currentTenant || isSyncing) return;
    
    const offlineData = localStorage.getItem(`offline_tx_${currentTenant.id}`);
    if (!offlineData) return;

    const pendingTransactions = JSON.parse(offlineData);
    if (pendingTransactions.length === 0) return;

    setIsSyncing(true);
    setSyncError(null);
    console.log(`Syncing ${pendingTransactions.length} offline transactions...`);

    const remaining = [];
    let errorCount = 0;

    for (const tx of pendingTransactions) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx)
        });
        if (!res.ok) {
          remaining.push(tx);
          errorCount++;
        }
      } catch (e) {
        remaining.push(tx);
        errorCount++;
      }
    }

    if (remaining.length === 0) {
      localStorage.removeItem(`offline_tx_${currentTenant.id}`);
      fetchStats();
      fetchDetailedStats();
      fetchTransactions();
      fetchProducts();
      setSyncError(null);
    } else {
      localStorage.setItem(`offline_tx_${currentTenant.id}`, JSON.stringify(remaining));
      setSyncError(`Failed to sync ${errorCount} transaction(s). Please check your connection.`);
    }
    
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (currentTenant) {
      fetchProducts();
      fetchStats();
      fetchDetailedStats();
      fetchTransactions();
      fetchNotifications();
      fetchSubscriptionHistory();
      if (currentUser?.role === 'tenant_admin') {
        fetchUsers();
      }
    }
  }, [currentTenant]);

  useEffect(() => {
    if (!currentTenant) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', tenantId: currentTenant.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transaction_created') {
          fetchStats();
          fetchTransactions();
          fetchProducts();
          fetchDetailedStats();
        }
        if (data.type === 'notification_created') {
          setNotifications(prev => {
            if (prev.some(n => n.id === data.notification.id)) return prev;
            return [data.notification, ...prev];
          });
        }
      } catch (e) {
        console.error('WS Message error:', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentTenant]);

  useEffect(() => {
    if (view === 'admin') {
      fetchAdminStats();
      fetchPendingSubscriptions();
      fetchPendingRegistrations();
    }
  }, [view]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (registrationData.password !== registrationData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsSubmittingRegistration(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registrationData.name,
          email: registrationData.email,
          plan: registrationData.plan,
          password: registrationData.password
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrationPaymentInfo(data);
        setRegistrationStep('payment');
      } else {
        const err = await res.json();
        alert(err.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error', error);
      alert('Connection error');
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    console.log('Attempting login...', loginData.username);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const { user, tenant } = await res.json();
        console.log('Login success:', user.username);
        setCurrentUser(user);
        if (user.role === 'super_admin') {
          setView('admin');
          fetchTenants();
        } else {
          setCurrentTenant(tenant);
          setView('store');
          if (user.role === 'staff') {
            setActiveTab('pos');
          } else {
            setActiveTab('dashboard');
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(errorData.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed', error);
      alert('Connection error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTenant(null);
    setView('login');
    setLoginData({ username: '', password: '' });
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    if (!currentUser) return;

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        alert("Password changed successfully!");
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to change password");
      }
    } catch (error) {
      alert("Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotPasswordData.username,
          email: forgotPasswordData.email
        })
      });

      if (res.ok) {
        const data = await res.json();
        setForgotPasswordData({ ...forgotPasswordData, resetToken: data.resetToken });
        setForgotPasswordStep('reset');
      } else {
        const data = await res.json();
        alert(data.error || "User not found");
      }
    } catch (error) {
      alert("Error processing request");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: forgotPasswordData.resetToken,
          newPassword: forgotPasswordData.newPassword
        })
      });

      if (res.ok) {
        alert("Password reset successfully! Please login with your new password.");
        setIsForgotPassword(false);
        setForgotPasswordStep('identify');
        setForgotPasswordData({ username: '', email: '', resetToken: '', newPassword: '', confirmPassword: '' });
      } else {
        alert("Failed to reset password");
      }
    } catch (error) {
      alert("Error resetting password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const fetchUsers = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/users?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setUsers(data);
  };

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser || !currentTenant) return;

    const method = editingUser.id ? 'PATCH' : 'POST';
    const url = editingUser.id ? `/api/users/${editingUser.id}` : '/api/users';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingUser, tenant_id: currentTenant.id })
    });

    if (res.ok) {
      fetchUsers();
      setIsUserModalOpen(false);
      setEditingUser(null);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
    }
  };

  const handleAdjustStock = async (productId: number, adjustment: number) => {
    const res = await fetch(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustment })
    });
    if (res.ok) {
      fetchProducts();
    }
  };

  const handleBulkUpdate = async () => {
    setIsSyncing(true);
    try {
      const updates = Object.entries(bulkStockData).map(([id, stock]) => ({
        id: parseInt(id),
        stock
      }));

      // We'll update them one by one for simplicity as the backend might not have a bulk endpoint
      // but we'll use Promise.all to make it faster
      await Promise.all(updates.map(update => 
        fetch(`/api/products/${update.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: update.stock })
        })
      ));

      fetchProducts();
      setIsBulkUpdateMode(false);
      setBulkStockData({});
    } catch (error) {
      console.error('Bulk update failed:', error);
      setSyncError('Failed to update some products');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !currentTenant) return;

    const method = editingProduct.id ? 'PATCH' : 'POST';
    const url = editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products';
    
    const productToSave = { 
      ...editingProduct, 
      tenant_id: currentTenant.id,
      image: editingProduct.image || `https://picsum.photos/seed/${encodeURIComponent(editingProduct.name || Date.now().toString())}/200`
    };
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productToSave)
    });

    if (res.ok) {
      fetchProducts();
      setIsProductModalOpen(false);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    setProductToDelete(id);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const res = await fetch(`/api/products/${productToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      fetchProducts();
    }
    setProductToDelete(null);
  };

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

  const fetchPendingSubscriptions = async () => {
    const res = await fetch('/api/admin/subscriptions/pending');
    const data = await res.json();
    setPendingSubscriptions(data);
  };

  const fetchPendingRegistrations = async () => {
    const res = await fetch('/api/admin/registrations/pending');
    const data = await res.json();
    setPendingRegistrations(data);
  };

  const fetchSubscriptionHistory = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/subscription/history?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setSubscriptionHistory(data);
  };

  const handleApproveRegistration = async (id: string) => {
    const res = await fetch('/api/admin/registrations/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: id })
    });
    if (res.ok) {
      fetchPendingRegistrations();
      fetchTenants();
    }
  };

  const handleApproveSubscription = async (id: number) => {
    const res = await fetch('/api/admin/subscriptions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: id })
    });
    if (res.ok) {
      fetchPendingSubscriptions();
      fetchTenants();
      fetchAdminStats();
    }
  };

  const handleApproveSubscriptionManual = async (tenantId: number, plan: string, amount: number, days: number) => {
    const res = await fetch('/api/admin/subscriptions/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, plan, amount, days })
    });
    if (res.ok) {
      fetchTenants();
      fetchAdminStats();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleRejectSubscription = async (id: number, providedReason?: string) => {
    const reason = providedReason || prompt('Reason for rejection:');
    if (reason === null) return;
    const res = await fetch('/api/admin/subscriptions/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: id, reason })
    });
    if (res.ok) {
      fetchPendingSubscriptions();
    }
  };

  const handlePaySubscription = async (plan: 'monthly' | 'quarterly' | 'annual', amount: number, paymentMethod: string, reference: string) => {
    if (!currentTenant) return;
    setIsSubmittingPayment(true);
    try {
      const res = await fetch('/api/subscription/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          plan,
          amount,
          paymentMethod,
          reference
        })
      });
      if (res.ok) {
        fetchSubscriptionHistory();
        alert('Payment request submitted successfully. Admin will verify and approve shortly.');
      }
    } catch (error) {
      console.error('Payment submission failed', error);
    } finally {
      setIsSubmittingPayment(false);
    }
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
      setNewTenant({ name: '', email: '', plan: 'monthly', expiry_days: 30, password: 'password123' });
      setPendingPayment(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleAdminResetTenantPassword = async (tenantId: number) => {
    const newPassword = prompt("Enter new password for this tenant admin:");
    if (!newPassword) return;

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      if (res.ok) {
        alert("Tenant password reset successfully!");
      } else {
        alert("Failed to reset tenant password");
      }
    } catch (error) {
      alert("Error resetting password");
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

  const handlePrintReceipt = (transaction: Transaction) => {
    if (!currentTenant) return;
    
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const itemsHtml = transaction.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>${item.name} x${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Receipt #${transaction.id}</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              width: 280px; 
              margin: 0 auto; 
              padding: 20px;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
            .total { font-weight: bold; font-size: 14px; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; display: flex; justify-content: space-between; }
            .meta { margin-bottom: 10px; font-size: 10px; }
            @media print {
              @page { margin: 0; }
              body { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">${currentTenant.name}</h2>
            <p style="margin: 5px 0;">${currentTenant.email}</p>
          </div>
          <div class="meta">
            <div>Order: #${transaction.id}</div>
            <div>Date: ${new Date(transaction.timestamp).toLocaleString()}</div>
            <div>Staff: ${currentUser?.username || 'System'}</div>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>$${transaction.total.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Powered by Lucid Hub POS</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const fetchProducts = async () => {
    if (!currentTenant) return;
    try {
      const res = await fetch(`/api/products?tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        // Cache products for offline use
        localStorage.setItem(`cached_products_${currentTenant.id}`, JSON.stringify(data));
      }
    } catch (error) {
      console.log('Fetching products failed, loading from cache...', error);
      const cached = localStorage.getItem(`cached_products_${currentTenant.id}`);
      if (cached) {
        setProducts(JSON.parse(cached));
      }
    }
  };

  const fetchStats = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/stats?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setStats(data);
  };

  const fetchDetailedStats = async () => {
    if (!currentTenant) return;
    const res = await fetch(`/api/dashboard/detailed-stats?tenantId=${currentTenant.id}`);
    const data = await res.json();
    setDetailedStats(data);
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

  const handleRenew = (planId: string) => {
    const plans = {
      monthly: { id: 'monthly', title: 'Monthly', price: 150 },
      quarterly: { id: 'quarterly', title: 'Quarterly', price: 450 },
      annual: { id: 'annual', title: 'Yearly', price: 1800 }
    };
    setSelectedPlan(plans[planId as keyof typeof plans]);
    setPaymentStep('pay');
  };

  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !selectedPlan || !paymentReference) return;

    setIsSubmittingPayment(true);
    try {
      const res = await fetch('/api/subscription/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          paymentMethod,
          reference: paymentReference
        })
      });

      if (res.ok) {
        setIsRenewing(false);
        setPaymentStep('select');
        setSelectedPlan(null);
        setPaymentReference('');
        fetchNotifications();
        alert('Payment submitted successfully! Our team will verify and approve your subscription shortly.');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit payment');
      }
    } catch (error) {
      console.error('Payment submission failed', error);
      alert('Connection error. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
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

  const processOfflineTransaction = (txData: any) => {
    if (!currentTenant) return;
    const offlineData = localStorage.getItem(`offline_tx_${currentTenant.id}`);
    const pending = offlineData ? JSON.parse(offlineData) : [];
    pending.push(txData);
    localStorage.setItem(`offline_tx_${currentTenant.id}`, JSON.stringify(pending));

    // Optimistic UI update
    const optimisticTx = {
      id: Date.now(),
      total: cartTotal,
      items: [...cart],
      timestamp: new Date().toISOString(),
      tenant_id: currentTenant.id,
      isOffline: true
    };
    
    setTransactions([optimisticTx, ...transactions]);
    setLastTransaction(optimisticTx);
    setCart([]);
    setIsCartOpen(false);
    setShowSuccess(true);
    
    // Update local stock optimistically
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
      return p;
    }));

    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentTenant) return;

    const txData = {
      total: cartTotal,
      items: cart,
      tenantId: currentTenant.id
    };

    if (!isOnline) {
      processOfflineTransaction(txData);
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });

      if (res.ok) {
        const data = await res.json();
        const newTransaction = {
          id: data.id,
          total: cartTotal,
          items: [...cart],
          timestamp: new Date().toISOString(),
          tenant_id: currentTenant.id
        };
        setLastTransaction(newTransaction);
        setCart([]);
        setIsCartOpen(false);
        setShowSuccess(true);
        fetchProducts();
        fetchStats();
        fetchDetailedStats();
        fetchTransactions();
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        const err = await res.json();
        if (res.status === 403) {
          alert(err.error); // Subscription expired
        } else {
          // Other errors might be connection related, fallback to offline
          processOfflineTransaction(txData);
        }
      }
    } catch (error) {
      console.error('Checkout failed, falling back to offline', error);
      setIsOnline(false);
      processOfflineTransaction(txData);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (view === 'login') {
    return (
      <div className="flex flex-col min-h-screen w-full md:max-w-md mx-auto bg-[#0f172a] overflow-hidden shadow-2xl p-6 sm:p-8 justify-center relative">
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 relative overflow-hidden group"
            >
              <img 
                src="https://picsum.photos/seed/lucidpos/200/200" 
                alt="Lucid POS Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              Lucid<span className="text-emerald-400">POS</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">Enterprise SaaS POS Terminal</p>
          </div>

          {isForgotPassword ? (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-black text-white">Reset Access</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Security Verification</p>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotPasswordStep('identify');
                  }}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-black text-white">Reset Password</h2>
              </div>

              {forgotPasswordStep === 'identify' ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    Enter your username and registered email address to verify your identity.
                  </p>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Username</label>
                    <input 
                      type="text"
                      required
                      placeholder="Your username"
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                      value={forgotPasswordData.username}
                      onChange={(e) => setForgotPasswordData({...forgotPasswordData, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="your@email.com"
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                      value={forgotPasswordData.email}
                      onChange={(e) => setForgotPasswordData({...forgotPasswordData, email: e.target.value})}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isResettingPassword}
                    className="w-full bg-emerald-500 text-white p-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                  >
                    {isResettingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify Identity"}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <p className="text-emerald-400 text-xs font-bold">
                    Identity verified! Please set your new password.
                  </p>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => setForgotPasswordData({...forgotPasswordData, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Confirm Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                      value={forgotPasswordData.confirmPassword}
                      onChange={(e) => setForgotPasswordData({...forgotPasswordData, confirmPassword: e.target.value})}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isResettingPassword}
                    className="w-full bg-emerald-500 text-white p-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                  >
                    {isResettingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Reset Password"}
                  </motion.button>
                </form>
              )}
            </div>
          ) : isRegistering ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-black text-white">Create Store</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Start your 30-day trial</p>
              </div>

              {registrationStep === 'form' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Store Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. My Awesome Shop"
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                      value={registrationData.name}
                      onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="shop@example.com"
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Subscription Plan</label>
                    <select 
                      className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none"
                      value={registrationData.plan}
                      onChange={(e) => setRegistrationData({...registrationData, plan: e.target.value as any})}
                    >
                      <option value="monthly">Monthly - ₵150</option>
                      <option value="quarterly">Quarterly - ₵450</option>
                      <option value="annual">Yearly - ₵1800</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                        value={registrationData.password}
                        onChange={(e) => setRegistrationData({...registrationData, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Confirm</label>
                      <input 
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#0f172a]/50 border border-white/5 p-4 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                        value={registrationData.confirmPassword}
                        onChange={(e) => setRegistrationData({...registrationData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmittingRegistration}
                    className="w-full bg-emerald-500 text-white p-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    {isSubmittingRegistration ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create My Store"}
                  </motion.button>
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="w-full py-2 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white">Store Created!</h3>
                    <p className="text-slate-400 text-sm">Your store is ready. Please complete the initial payment to activate your account.</p>
                  </div>

                  <div className="bg-[#0f172a]/80 border border-white/5 p-6 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment ID</span>
                      <span className="text-xs font-mono font-black text-emerald-400">{registrationPaymentInfo?.paymentId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount Due</span>
                      <span className="text-lg font-black text-white">₵{registrationPaymentInfo?.amount}</span>
                    </div>
                    
                    <div className="h-px bg-white/5 w-full" />
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Payment Methods</p>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MTN / Telecel MoMo</p>
                          <p className="text-sm font-black text-white">0542361753 / 0207923981</p>
                          <p className="text-[10px] font-bold text-slate-500">Name: Akwasi Rabbi</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ecobank</p>
                          <p className="text-sm font-black text-white">1441004209423</p>
                          <p className="text-[10px] font-bold text-slate-500">Name: Akwasi Rabbi</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center font-bold">
                    Once paid, our team will verify your payment using the Payment ID and activate your store.
                  </p>

                  <button 
                    onClick={() => {
                      setIsRegistering(false);
                      setRegistrationStep('form');
                      setRegistrationPaymentInfo(null);
                    }}
                    className="w-full bg-white/5 text-white p-5 rounded-2xl font-black hover:bg-white/10 transition-all"
                  >
                    Return to Login
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-white">Welcome Back</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Lucid Hub POS Terminal</p>
              </div>
              <motion.form 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
              <div className="space-y-2">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Username</label>
                <motion.div 
                  whileFocus={{ scale: 1.01 }}
                  className="relative group"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Users size={18} />
                  </div>
                  <input 
                    type="text"
                    required
                    placeholder="Enter your username"
                    className="w-full bg-[#0f172a]/50 border border-white/5 p-4 pl-12 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  />
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Password</label>
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <motion.div 
                  whileFocus={{ scale: 1.01 }}
                  className="relative group"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#0f172a]/50 border border-white/5 p-4 pl-12 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  />
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoggingIn}
                className={`w-full bg-emerald-500 text-white p-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all mt-4 flex items-center justify-center gap-3 group ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Secure Access</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>
          </>
          )}

          {!isForgotPassword && !isRegistering && (
            <div className="pt-4 border-t border-white/5 text-center space-y-4">
              <p className="text-slate-500 text-xs font-bold">Don't have a store yet?</p>
              <button 
                onClick={() => setIsRegistering(true)}
                className="w-full bg-white/5 text-white p-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-all border border-white/5"
              >
                Create Your Store Now
              </button>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-600">
              Protected by Lucid Security Engine
            </p>
          </div>
        </div>

        {/* Quick Access for Demo */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => setLoginData({ username: 'admin', password: 'admin123' })}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/5"
          >
            Super Admin Demo
          </button>
          <button 
            onClick={() => setLoginData({ username: 'demo', password: 'password123' })}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/5"
          >
            Staff Demo
          </button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="flex flex-col h-screen w-full md:max-w-4xl mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
        <header className="bg-slate-900 px-6 py-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-white">Super Admin</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">System Management</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {/* Admin Tabs */}
          <div className="flex bg-slate-200 p-1 rounded-2xl">
            <button 
              onClick={() => setAdminActiveTab('tenants')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminActiveTab === 'tenants' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Tenants
            </button>
            <button 
              onClick={() => setAdminActiveTab('payments')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminActiveTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Payments {pendingSubscriptions.length > 0 && <span className="ml-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{pendingSubscriptions.length}</span>}
            </button>
            <button 
              onClick={() => setAdminActiveTab('security')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminActiveTab === 'security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Security
            </button>
          </div>

          {adminActiveTab === 'tenants' && (
            <>
              {adminStats && (
                <div className="grid grid-cols-2 gap-4">
                  <AdminStatCard icon={<Users size={20} />} label="Total Tenants" value={adminStats.totalTenants} />
                  <AdminStatCard icon={<TrendingUp size={20} />} label="Total Revenue" value={`₵${adminStats.totalRevenue.toFixed(0)}`} />
                  <AdminStatCard icon={<ShoppingCart size={20} />} label="Transactions" value={adminStats.totalTransactions} />
                  <AdminStatCard icon={<CheckCircle2 size={20} />} label="Active Stores" value={adminStats.activeTenants} />
                </div>
              )}

              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold">API Gateway</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Operational</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold">Database Cluster</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Operational</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold">Storage Engine</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Operational</span>
                  </div>
                </div>
              </div>

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
                          const plan = prompt('Select Plan (monthly, quarterly, annual):', 'monthly');
                          if (!plan) return;
                          const days = plan === 'annual' ? 365 : plan === 'quarterly' ? 90 : 30;
                          const amount = plan === 'annual' ? 1800 : plan === 'quarterly' ? 450 : 150;
                          if (confirm(`Manually upgrade ${tenant.name} to ${plan} plan for ₵${amount}?`)) {
                            handleApproveSubscriptionManual(tenant.id, plan, amount, days);
                          }
                        }}
                        title="Manual Upgrade/Renew"
                        className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-500 transition-colors rounded-xl"
                      >
                        <CreditCard size={18} />
                      </button>
                      <button 
                        onClick={() => handleAdminResetTenantPassword(tenant.id)}
                        title="Reset Admin Password"
                        className="p-2 bg-slate-50 text-slate-400 hover:text-amber-500 transition-colors rounded-xl"
                      >
                        <ShieldCheck size={18} />
                      </button>
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
            </>
          )}

          {adminActiveTab === 'payments' && (
            <div className="space-y-8">
              {/* New Registrations Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">New Stores</p>
                    <h2 className="text-2xl font-black text-slate-900">Pending Registrations</h2>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pendingRegistrations.length} Pending</span>
                  </div>
                </div>

                {pendingRegistrations.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRegistrations.map(reg => (
                      <div key={reg.id} className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                              {reg.name?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900">{reg.name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{reg.email}</p>
                            </div>
                          </div>
                          <div className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">New Store</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Plan & Amount</p>
                            <p className="text-sm font-black text-slate-900 uppercase">{reg.plan} - ₵{reg.amount}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Payment ID</p>
                            <p className="text-sm font-mono font-black text-emerald-600">{reg.id}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleApproveRegistration(reg.id)}
                          className="w-full bg-emerald-500 text-white text-xs font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          Verify & Activate Store
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 p-8 rounded-[2rem] text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No new store registrations</p>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Subscription Renewals Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Renewals</p>
                    <h2 className="text-2xl font-black text-slate-900">Subscription Payments</h2>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pendingSubscriptions.length} Pending</span>
                  </div>
                </div>

                {pendingSubscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {pendingSubscriptions.map(sub => (
                      <div key={sub.id} className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black">
                              {sub.tenant_name?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900">{sub.tenant_name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(sub.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="bg-amber-50 text-amber-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Renewal</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Plan & Amount</p>
                            <p className="text-sm font-black text-slate-900 uppercase">{sub.plan} - ₵{sub.amount}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Method</p>
                            <p className="text-sm font-black text-slate-900 uppercase">{sub.payment_method}</p>
                          </div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-2xl text-white">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Transaction Reference</p>
                          <p className="text-sm font-mono font-black text-emerald-400 break-all">{sub.reference}</p>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleApproveSubscription(sub.id)}
                            className="flex-1 bg-emerald-500 text-white text-xs font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            Approve Renewal
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) handleRejectSubscription(sub.id, reason);
                            }}
                            className="px-6 bg-slate-100 text-slate-500 text-xs font-black py-4 rounded-2xl hover:bg-slate-200 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 p-8 rounded-[2rem] text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No pending renewals</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {adminActiveTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Admin Security</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Update super admin password</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-4"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Admin Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
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
                className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-[100] p-8 space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900">New Tenant Store</h2>
                  <p className="text-slate-500 text-sm">Onboard a new business to Lucid Hub</p>
                </div>

                <div className="space-y-4">
                  <AdminInput label="Store Name" value={newTenant.name} onChange={v => setNewTenant({...newTenant, name: v})} placeholder="e.g. Lucid Coffee" />
                  <AdminInput label="Owner Email" value={newTenant.email} onChange={v => setNewTenant({...newTenant, email: v})} placeholder="owner@example.com" />
                  <AdminInput label="Initial Password" value={newTenant.password} onChange={v => setNewTenant({...newTenant, password: v})} placeholder="Set initial password" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Plan</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={newTenant.plan}
                        onChange={e => {
                          const plan = e.target.value as any;
                          const days = plan === 'annual' ? 365 : plan === 'quarterly' ? 90 : 30;
                          setNewTenant({...newTenant, plan, expiry_days: days});
                        }}
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
          {productToDelete && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProductToDelete(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[110]"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] bg-white rounded-[2.5rem] shadow-2xl z-[110] p-8 space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Delete Product?</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    Are you sure you want to delete <span className="font-bold text-slate-800">{products.find(p => p.id === productToDelete)?.name}</span>? This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteProduct}
                    className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                  >
                    Delete
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
    <div className="flex flex-col h-screen w-full md:max-w-5xl mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
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
          <AnimatePresence>
            {!isOnline && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-red-100 shadow-sm shadow-red-500/5"
              >
                <WifiOff size={14} className="animate-pulse" />
                <span>Offline Mode</span>
              </motion.div>
            )}
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-emerald-100 shadow-sm shadow-emerald-500/5"
              >
                <CloudUpload size={14} className="animate-bounce" />
                <span>Syncing Data</span>
              </motion.div>
            )}
            {syncError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-amber-100 shadow-sm shadow-amber-500/5"
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Sync Failed</span>
                </div>
                <div className="flex items-center gap-2 border-l border-amber-200 pl-2 ml-1">
                  <button 
                    onClick={() => syncOfflineTransactions()}
                    className="hover:text-amber-800 transition-colors"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => setSyncError(null)}
                    className="hover:text-amber-800 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-200"
          >
            <Users size={20} />
          </button>
          {currentUser?.role !== 'staff' && (
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
          )}
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
          {currentUser?.role !== 'staff' && (
            <button 
              onClick={() => setIsPrinterModalOpen(true)}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              title="Printer Setup"
            >
              <Printer size={18} className="text-slate-700" />
            </button>
          )}
          {currentUser?.role === 'super_admin' && (
            <button 
              onClick={() => setView('admin')}
              className="p-2 bg-slate-100 rounded-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors"
            >
              <ShieldCheck size={18} />
            </button>
          )}
          <button 
            onClick={handleLogout}
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
            {activeTab === 'dashboard' && currentUser?.role !== 'staff' && (
              <div className="space-y-6 pb-20">
                {/* Header Section */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Overview</p>
                    <h2 className="text-2xl font-black text-slate-900">Sales Dashboard</h2>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live</span>
                  </div>
                </div>

                {/* Real-time Sales Overview Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500 p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp size={80} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Today's Revenue</p>
                    <h3 className="text-4xl font-black mb-4">₵{detailedStats?.totalSales.daily.toFixed(2) || '0.00'}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                      <CheckCircle2 size={12} />
                      <span>{transactions.filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString()).length} Transactions</span>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100"
                    >
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3">
                        <Calendar size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly</p>
                      <p className="text-xl font-black text-slate-900">₵{detailedStats?.totalSales.weekly.toFixed(2) || '0.00'}</p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100"
                    >
                      <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-3">
                        <Store size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly</p>
                      <p className="text-xl font-black text-slate-900">₵{detailedStats?.totalSales.monthly.toFixed(2) || '0.00'}</p>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100"
                    >
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3">
                        <BarChart3 size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Order</p>
                      <p className="text-xl font-black text-slate-900">₵{detailedStats?.totalSales.avgOrder?.toFixed(2) || '0.00'}</p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100"
                    >
                      <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                        <ShoppingCart size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                      <p className="text-xl font-black text-slate-900">{detailedStats?.totalSales.count || 0}</p>
                    </motion.div>
                  </div>
                </div>

                {/* Sales Trend Chart */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100"
                >
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Flow</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Last 30 Days</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    {detailedStats?.salesTrends && detailedStats.salesTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={detailedStats.salesTrends}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return date.getDate().toString();
                            }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                            tickFormatter={(val) => `₵${val}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              padding: '12px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#10b981" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                        No trend data available
                      </div>
                    )}
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Best Selling Products */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100"
                  >
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Top Performers</h3>
                    <div className="space-y-5">
                      {detailedStats?.bestSellers && detailedStats.bestSellers.length > 0 ? (
                        detailedStats.bestSellers.slice(0, 5).map((product, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                              idx === 0 ? 'bg-amber-100 text-amber-600' : 
                              idx === 1 ? 'bg-slate-100 text-slate-600' : 
                              idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-black text-slate-800">{product.name}</p>
                                <p className="text-[10px] font-black text-slate-900">{product.quantity} sold</p>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(product.quantity / detailedStats.bestSellers[0].quantity) * 100}%` }}
                                  className={`h-full rounded-full ${
                                    idx === 0 ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs font-bold">
                          No sales data yet
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Category Performance */}
                  {detailedStats?.categories && detailedStats.categories.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100"
                    >
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Category Distribution</h3>
                      <div className="space-y-4">
                        {detailedStats.categories.slice(0, 4).map((cat, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{cat.name}</p>
                                <p className="text-[10px] font-black text-slate-900">₵{cat.value.toFixed(2)}</p>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(cat.value / detailedStats.categories![0].value) * 100}%` }}
                                  className="h-full bg-blue-500 rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recent Activity */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                      <button onClick={() => setActiveTab('history')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {transactions.slice(0, 4).map((t, idx) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                              <ShoppingCart size={14} />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900">Order #{t.id}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-slate-900">₵{t.total.toFixed(2)}</p>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-xs font-bold">
                          No recent transactions
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Subscription Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden"
                >
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Subscription Status</p>
                        <h3 className="text-2xl font-black uppercase tracking-tight">{currentTenant.plan} Plan</h3>
                      </div>
                      <div className="bg-emerald-500/20 p-3 rounded-[1.5rem] text-emerald-400 backdrop-blur-md">
                        <ShieldCheck size={24} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                        <Calendar size={18} className="text-emerald-500" />
                        <span>Expires: {new Date(currentTenant.expiry_date).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => setIsRenewing(true)} 
                        className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        Manage Account
                      </button>
                    </div>
                  </div>
                </motion.div>
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-slate-900">Transaction History</h2>
                  <div className="bg-slate-100 px-3 py-1 rounded-full">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{transactions.length} Total</p>
                  </div>
                </div>
                {transactions.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-slate-900">Order #{t.id}</p>
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Paid</span>
                          {t.isOffline && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <WifiOff size={8} />
                              Offline
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(t.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-emerald-600">${t.total.toFixed(2)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {t.items.reduce((acc, item) => acc + item.quantity, 0)} items
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items Summary</p>
                      </div>
                      <div className="space-y-2">
                        {t.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-white border border-slate-100 rounded flex items-center justify-center font-black text-slate-400 text-[9px]">
                                {item.quantity}
                              </span>
                              <span className="font-bold text-slate-700">{item.name}</span>
                            </div>
                            <span className="font-black text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => handlePrintReceipt(t)}
                      className="mt-4 w-full py-3 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-slate-100 hover:border-emerald-200"
                    >
                      <Printer size={14} />
                      Print Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'inventory' && currentUser?.role !== 'staff' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Inventory</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Manage your product stock</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if (isBulkUpdateMode) {
                          setIsBulkUpdateMode(false);
                          setBulkStockData({});
                        } else {
                          setIsBulkUpdateMode(true);
                          const initialData: Record<number, number> = {};
                          products.forEach(p => initialData[p.id] = p.stock);
                          setBulkStockData(initialData);
                        }
                      }}
                      className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isBulkUpdateMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      {isBulkUpdateMode ? 'Cancel' : 'Bulk Edit'}
                    </button>
                    {isBulkUpdateMode && (
                      <button 
                        onClick={handleBulkUpdate}
                        disabled={isSyncing}
                        className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Save All
                      </button>
                    )}
                    {!isBulkUpdateMode && (
                      <>
                        <button 
                          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                          className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${showLowStockOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          <AlertTriangle size={14} />
                          {showLowStockOnly ? 'Showing Low Stock' : 'Filter Low Stock'}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingProduct({ name: '', price: 0, category: '', stock: 0, low_stock_threshold: 5, image: '' });
                            setIsProductModalOpen(true);
                          }}
                          className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                        >
                          <Plus size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
                    <p className="text-xl font-black text-slate-900">{products.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock</p>
                    <p className="text-xl font-black text-red-500">{products.filter(p => p.stock <= p.low_stock_threshold).length}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(showLowStockOnly ? products.filter(p => p.stock <= p.low_stock_threshold) : products).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-bold">
                            {showLowStockOnly ? 'No low stock items found' : 'No products in inventory'}
                          </td>
                        </tr>
                      ) : (
                        (showLowStockOnly ? products.filter(p => p.stock <= p.low_stock_threshold) : products).map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{p.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">${p.price.toFixed(2)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {isBulkUpdateMode ? (
                                  <input 
                                    type="number"
                                    className="w-20 bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 transition-all text-xs font-black"
                                    value={bulkStockData[p.id] ?? p.stock}
                                    onChange={(e) => setBulkStockData({ ...bulkStockData, [p.id]: parseInt(e.target.value) || 0 })}
                                  />
                                ) : (
                                  <>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${p.stock <= p.low_stock_threshold ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                      {p.stock} UNITS
                                    </span>
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={() => handleAdjustStock(p.id, -1)}
                                        className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                                      >
                                        <Minus size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleAdjustStock(p.id, 1)}
                                        className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                              {p.stock <= p.low_stock_threshold && !isBulkUpdateMode && (
                                <p className="text-[8px] text-red-500 font-bold uppercase mt-1">Below threshold ({p.low_stock_threshold})</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!isBulkUpdateMode && (
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setIsProductModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                                    title="Edit Product"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && currentUser?.role === 'tenant_admin' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-slate-900">User Management</h2>
                  <button 
                    onClick={() => {
                      setEditingUser({ role: 'staff', email: '' });
                      setIsUserModalOpen(true);
                    }}
                    className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{user.username}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{user.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingUser(user);
                            setIsUserModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'subscription' && currentUser?.role === 'tenant_admin' && (
              <div className="space-y-6">
                <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</p>
                      <h2 className="text-2xl font-black capitalize">{currentTenant?.plan}</h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Calendar size={16} />
                    <span>Expires: {currentTenant ? new Date(currentTenant.expiry_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Renew Subscription</h3>
                  <div className="grid gap-4">
                    {[
                      { name: 'monthly', price: 150, days: 30, label: 'Monthly' },
                      { name: 'quarterly', price: 450, days: 90, label: 'Quarterly' },
                      { name: 'annual', price: 1800, days: 365, label: 'Yearly' }
                    ].map(plan => (
                      <div key={plan.name} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-black text-slate-900">{plan.label}</p>
                          <p className="text-xs text-slate-500 font-bold">{plan.days} Days Access</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-500">{plan.price} GH₵</p>
                          <button 
                            disabled={isSubmittingPayment}
                            onClick={() => {
                              const ref = prompt(`To renew for ${plan.label}, please pay ${plan.price} GH₵ to:\n\nBank: GCB Bank\nAcc: 1234567890\nName: Lucid Hub POS\n\nOR\n\nMoMo: 0541234567 (Lucid Hub)\n\nEnter your transaction reference/ID:`);
                              if (ref) handlePaySubscription(plan.name as any, plan.price, 'Manual', ref);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-xl mt-1 disabled:opacity-50"
                          >
                            {isSubmittingPayment ? '...' : 'Pay Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Payment History</h3>
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                          <th className="px-4 py-3 font-bold uppercase">Date</th>
                          <th className="px-4 py-3 font-bold uppercase">Plan</th>
                          <th className="px-4 py-3 font-bold uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {subscriptionHistory.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No history</td></tr>
                        ) : (
                          subscriptionHistory.map(h => (
                            <tr key={h.id}>
                              <td className="px-4 py-3 font-bold">{new Date(h.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-bold uppercase">{h.plan}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full font-black uppercase ${
                                  h.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                  h.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                  'bg-amber-100 text-amber-600'
                                }`}>
                                  {h.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'settings' && currentUser?.role !== 'staff' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Security Settings</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Update your password</p>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                      <input 
                        type="password"
                        required
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                      <input 
                        type="password"
                        required
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                      <input 
                        type="password"
                        required
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-4"
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>

                <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100">
                  <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-2">Danger Zone</h3>
                  <p className="text-xs text-red-500/70 font-bold mb-4">Once you logout, you will need your credentials to access the terminal again.</p>
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Logout from Terminal
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full md:max-w-5xl mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        {currentUser?.role !== 'staff' && (
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
        )}
        <NavButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} icon={<ShoppingCart size={20} />} label="POS" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20} />} label="History" />
        {currentUser?.role !== 'staff' && (
          <>
            <NavButton 
              active={activeTab === 'inventory'} 
              onClick={() => setActiveTab('inventory')} 
              icon={<Package size={20} />} 
              label="Stock" 
              badge={products.some(p => p.stock <= p.low_stock_threshold)}
            />
            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Settings" />
          </>
        )}
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
              onClick={() => {
                setIsRenewing(false);
                setPaymentStep('select');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[70]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-8 space-y-6 max-h-[90%] overflow-y-auto no-scrollbar"
            >
              {paymentStep === 'select' ? (
                <>
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900">Renew Subscription</h2>
                    <p className="text-slate-500 text-sm">Select a plan for <span className="font-bold">{currentTenant.name}</span></p>
                  </div>

                  <div className="space-y-3">
                    <PlanOption 
                      title="Monthly" 
                      price="₵150.00" 
                      period="/mo" 
                      onClick={() => handleRenew('monthly')} 
                    />
                    <PlanOption 
                      title="Quarterly" 
                      price="₵450.00" 
                      period="/3mo" 
                      onClick={() => handleRenew('quarterly')} 
                      best
                    />
                    <PlanOption 
                      title="Yearly" 
                      price="₵1800.00" 
                      period="/yr" 
                      onClick={() => handleRenew('annual')} 
                    />
                  </div>
                </>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <button 
                      type="button"
                      onClick={() => setPaymentStep('select')}
                      className="p-2 bg-slate-100 rounded-xl text-slate-500"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Complete Payment</h2>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{selectedPlan?.title} Plan - ₵{selectedPlan?.price}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Payment Instructions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('momo')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'momo' ? 'border-emerald-500 bg-white shadow-sm' : 'border-transparent bg-emerald-500/5 text-emerald-600/50'}`}
                      >
                        <CreditCard size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">MoMo</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'bank' ? 'border-emerald-500 bg-white shadow-sm' : 'border-transparent bg-emerald-500/5 text-emerald-600/50'}`}
                      >
                        <Store size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Bank</span>
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-emerald-100">
                      {paymentMethod === 'momo' ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MTN Mobile Money</p>
                            <p className="text-sm font-black text-slate-900">0542361753</p>
                            <p className="text-[10px] font-bold text-slate-500">Name: Akwasi Rabbi</p>
                          </div>
                          <div className="h-px bg-slate-100 w-full" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telecel Cash</p>
                            <p className="text-sm font-black text-slate-900">0207923981</p>
                            <p className="text-[10px] font-bold text-slate-500">Name: Akwasi Rabbi</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details (Ecobank)</p>
                          <p className="text-sm font-black text-slate-900">1441004209423</p>
                          <p className="text-[10px] font-bold text-slate-500">Name: Akwasi Rabbi</p>
                          <p className="text-[10px] font-bold text-slate-500">Bank: Ecobank Ghana</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">Transaction Reference</label>
                    <input 
                      type="text"
                      required
                      placeholder="Enter MoMo/Bank Ref ID"
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                    <p className="text-[9px] text-slate-400 font-bold ml-1">Please enter the transaction ID from your payment receipt.</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmittingPayment}
                    className={`w-full bg-emerald-500 text-white p-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 ${isSubmittingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmittingPayment ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        <span>Submit Payment</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              <button 
                onClick={() => {
                  setIsRenewing(false);
                  setPaymentStep('select');
                }}
                className="w-full py-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
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
              className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-50 flex flex-col max-h-[85%]"
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
                <p className="text-xs text-slate-500 font-medium">
                  {lastTransaction?.isOffline 
                    ? "Transaction saved offline. It will sync when you're back online." 
                    : "Transaction has been recorded successfully."}
                </p>
              </div>
              {lastTransaction && (
                <button 
                  onClick={() => handlePrintReceipt(lastTransaction)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20"
                >
                  <Printer size={18} />
                  Print Receipt
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printer Setup Modal */}
      <AnimatePresence>
        {isPrinterModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrinterModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-[100] p-8 space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Printer size={32} className="text-slate-900" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Printer Setup</h2>
                <p className="text-slate-500 text-sm">Connect your thermal or standard printer</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Option 1: System Print</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Our receipts are optimized for 58mm and 80mm thermal printers. When you click "Print Receipt", the system print dialog will open. Select your thermal printer and set the paper size to "Roll Paper" or "58mm/80mm".
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Option 2: Direct Connection</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    For direct USB/Bluetooth thermal printing, ensure your printer drivers are installed. Most modern thermal printers (Epson, Star, etc.) work automatically with the system print dialog.
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex gap-3">
                    <Info size={18} className="text-emerald-500 shrink-0" />
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Tip: Disable "Headers and Footers" in the print settings for a cleaner look on thermal paper.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsPrinterModalOpen(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
              >
                Got it
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Management Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-[100] p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900">{editingUser?.id ? 'Edit User' : 'Create User'}</h2>
                <p className="text-slate-500 text-sm">Manage staff access for your store</p>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Username</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingUser?.username || ''}
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Email Address</label>
                  <input 
                    type="email"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingUser?.email || ''}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">
                    {editingUser?.id ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input 
                    type="password"
                    required={!editingUser?.id}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingUser?.password || ''}
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Role</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                    value={editingUser?.role || 'staff'}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                  >
                    <option value="staff">Staff</option>
                    <option value="tenant_admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20"
                  >
                    Save User
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* User Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-[100] p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900">User Profile</h2>
                <p className="text-slate-500 text-sm">Update your personal information</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Username</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 transition-all"
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Email Address</label>
                  <input 
                    type="email"
                    required
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 transition-all"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Management Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2.5rem] md:w-[480px] bg-white rounded-t-[2.5rem] shadow-2xl z-[100] p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900">{editingProduct?.id ? 'Edit Product' : 'Add Product'}</h2>
                <p className="text-slate-500 text-sm">Manage your store inventory</p>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Product Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Price ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                      value={editingProduct?.price || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Stock</label>
                    <input 
                      type="number"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                      value={editingProduct?.stock || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Low Stock Threshold</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingProduct?.low_stock_threshold || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Category</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingProduct?.category || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Image URL</label>
                  <input 
                    type="text"
                    placeholder="https://picsum.photos/200"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    value={editingProduct?.image || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, badge?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all relative ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-emerald-50' : ''}`}>
        {icon}
      </div>
      {badge && (
        <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
      )}
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


