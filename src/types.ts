export interface Tenant {
  id: number;
  name: string;
  email: string;
  plan: 'monthly' | 'quarterly' | 'annual';
  expiry_date: string;
  status: string;
}

export interface Product {
  id: number;
  tenant_id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  low_stock_threshold: number;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: number;
  total: number;
  items: CartItem[];
  timestamp: string;
  isOffline?: boolean;
}

export interface DashboardStats {
  dailyTotal: number;
  transactionCount: number;
}

export interface Notification {
  id: number;
  tenant_id: number;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'error' | 'success';
  is_read: number;
  created_at: string;
}

export interface AdminStats {
  totalTenants: number;
  totalTransactions: number;
  totalRevenue: number;
  activeTenants: number;
}

export interface User {
  id: number;
  tenant_id: number | null;
  username: string;
  role: 'super_admin' | 'tenant_admin' | 'staff';
}

export interface SubscriptionPayment {
  id: number;
  tenant_id: number;
  tenant_name?: string;
  plan: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  payment_method: string;
  reference: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
