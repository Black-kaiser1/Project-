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
}

export interface DashboardStats {
  dailyTotal: number;
  transactionCount: number;
}
