export interface Product {
  id: number;
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
