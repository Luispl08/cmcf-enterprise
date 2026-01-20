export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  cedula?: string;
  instagram?: string;
  address?: string;
  membershipStatus: 'active' | 'inactive';
  membershipExpiry: number | null; // Timestamp (seconds) or Date.now()
  balance: number;
  joinedAt: number;
  photoUrl?: string;
}

export interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: 'zelle' | 'pago_movil' | 'efectivo' | 'transferencia' | 'binance' | 'credit_card';
  reference: string;
  description?: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isPartial: boolean; // If true, only adds balance, doesn't renew membership
  timestamp: number;

  // Specific fields
  accountHolder?: string; // Zelle
  originPhone?: string;   // Pago Movil
  originBank?: string;    // Pago Movil
}

export interface GymClass {
  id: string;
  day: 'LUNES' | 'MARTES' | 'MIÉRCOLES' | 'JUEVES' | 'VIERNES' | 'SÁBADO' | 'DOMINGO';
  time: string; // "07:00 AM"
  name: string; // "CROSSFIT"
  coachId: string;
  coachName: string;
  capacity: number;
  bookedCount: number;
}

export interface Plan {
  id: string;
  title: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  visible: boolean;
  recommended?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  specialty: string;
  photoUrl?: string;
  active: boolean;
}

// Global Config Document Structure
export interface GymConfig {
  paymentMethods: Record<string, string>; // Instructions text
  contactPhone: string;
  contactEmail: string;
}
