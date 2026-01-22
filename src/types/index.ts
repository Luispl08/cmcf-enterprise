export type UserRole = 'admin' | 'user' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  cedula?: string;
  dob?: string; // ISO Date YYYY-MM-DD
  instagram?: string;
  address?: string;
  membershipStatus: 'active' | 'inactive' | 'pending' | 'rejected'; // pending = awaiting payment verification, rejected = payment rejected
  rejectionFeedback?: string; // Reason for rejection
  membershipExpiry: number | null; // Timestamp (seconds) or Date.now()
  planId?: string; // Current plan ID
  balance: number;

  joinedAt: number;
  photoUrl?: string;
  totalVisits?: number;
  lastVisit?: number;
}

export interface Payment {
  id: string;
  userId: string;
  userEmail: string; // Added for admin reference
  amount: number;
  currency: string;
  method: 'zelle' | 'pago_movil' | 'efectivo' | 'transferencia' | 'binance' | 'credit_card' | 'split';
  reference: string;
  description?: string;
  screenshotUrl?: string;
  splitDetails?: { method: string; amount: number; reference: string; }[]; // New field for split payments
  status: 'pending' | 'approved' | 'rejected' | 'verification';
  rejectionReason?: string;
  isPartial: boolean; // If true, only adds balance, doesn't renew membership
  planId?: string; // The plan being paid for
  timestamp: number;
  feedback?: string;
  amountBs?: number;      // Calculated amount in Bolívares at payment time
  exchangeRate?: number;  // Rate used at payment time

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
  isUnlimited?: boolean;
  isSpecial?: boolean;
  date?: number; // Timestamp for special one-time classes
}

export interface Trainer {
  id: string;
  name: string;
  specialties: string[];
  bio: string;
  photoUrl: string;
  active: boolean;
}

export interface Plan {
  id: string;
  title: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  durationDays: number; // Duration in days (e.g., 30, 90, 1) - kept for backward compatibility
  durationType?: 'days' | 'months'; // Type of duration: days or months
  durationValue?: number; // Value: 1, 14, 1, 3 etc.
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

export interface Review {
  id?: string;
  userId: string;
  userName: string; // snapshot of name at review time
  userPhotoUrl?: string;
  rating: number;
  comment: string;
  date: number; // timestamp
  approved: boolean; // default true for now, can be moderated later
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  date: number; // timestamp
  type: 'individual' | 'team';
  teamSize?: number; // required if type is team
  category: 'male' | 'female' | 'mixed';
  capacity: number;
  isUnlimited: boolean;
  registeredCount: number;
}

export interface CompetitionRegistration {
  id: string;
  competitionId: string;
  userId: string; // Leader's UID
  leaderName: string;
  leaderCedula?: string;
  leaderPhone?: string;
  teamName?: string;
  members: {
    name: string;
    cedula: string;
    userId?: string; // If matched to existing user
  }[];
  timestamp: number;
}
