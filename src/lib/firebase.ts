import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    Auth
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    increment,
    deleteDoc,
    Firestore,
    Timestamp,
    runTransaction,
    collectionGroup
} from 'firebase/firestore';
import { UserProfile, Payment, GymClass, Plan, Staff, GymConfig } from '@/types';
import { addMonths } from 'date-fns';

// 1. CONFIGURATION
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 2. INITIALIZATION
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

const isOnline = !!firebaseConfig.apiKey;

if (isOnline) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    console.warn("⚠️ CMCF ENTERPRISE: Running in Mock Mode (No Firebase Keys)");
}

// 3. SERVICE LAYER (GymService)
export class GymService {
    private static MOCK_STORAGE_KEY = 'CMCF_ENT_DATA';

    // --- AUTH ---
    static async login(email: string, pass: string): Promise<UserProfile> {
        if (isOnline && auth && db) {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            return this.getUserProfile(cred.user.uid);
        }
        // Mock Auth
        if (email.includes('admin') && pass === 'cmcfadmin') return this.mockProfile('admin', email);
        if (pass === '123456') return this.mockProfile('user', email);
        throw new Error('Credenciales inválidas (Mock)');
    }

    static async register(data: any): Promise<UserProfile> {
        if (isOnline && auth && db) {
            const { email, password, ...profile } = data;
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const userProfile: UserProfile = {
                uid: cred.user.uid,
                email,
                role: 'user',
                membershipStatus: 'inactive',
                membershipExpiry: null,
                balance: 0,
                joinedAt: Date.now(),
                ...profile
            };
            await setDoc(doc(db, 'users', cred.user.uid), userProfile);
            return userProfile;
        }
        // Mock Register
        return this.mockProfile('user', data.email);
    }

    static async logout() {
        if (isOnline && auth) await signOut(auth);
    }

    static async getUserProfile(uid: string): Promise<UserProfile> {
        if (isOnline && db) {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) return snap.data() as UserProfile;
        }
        return this.mockProfile('user', 'unknown');
    }

    // --- DATA ---
    static async getPlans(): Promise<Plan[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'plans'), where('visible', '==', true));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
            }
        }
        // Fallback or Offline
        return [
            {
                id: 'lite',
                title: 'LITE: SESIÓN DIARIA',
                price: 5,
                currency: '$',
                description: 'Acceso por un día',
                visible: true,
                features: ['Acceso a Pesas', 'Válido por 24h']
            },
            {
                id: 'standard',
                title: 'STANDARD',
                price: 20,
                currency: '$',
                description: 'Lunes a Viernes',
                visible: true,
                features: ['Acceso a Pesas', 'Área de Cardio', 'Lunes a Viernes']
            },
            {
                id: 'elite',
                title: 'ELITE',
                price: 30,
                currency: '$',
                description: 'Acceso Total 24/7',
                visible: true,
                recommended: true,
                features: ['Lunes a Domingo', 'Acceso a Clases', 'Sin Restricciones']
            },
            {
                id: 'full',
                title: 'FULL PACK',
                price: 50,
                currency: '$',
                description: 'VIP + Entrenador',
                visible: true,
                features: ['Lunes a Domingo', 'Entrenador Personal', 'Nutrición Básica', 'Toalla y Agua']
            }
        ];
    }

    static async getStaff(): Promise<Staff[]> {
        if (isOnline && db) {
            const snap = await getDocs(collection(db, 'staff'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
        }
        return [
            { id: 's1', name: 'CARLOS M.', role: 'HEAD COACH', specialty: 'CROSSFIT', active: true }
        ];
    }

    // --- SUBMIT PAYMENT ---
    static async submitPayment(payment: Omit<Payment, 'id'>): Promise<void> {
        if (isOnline && db) {
            await addDoc(collection(db, 'payments'), payment);
        } else {
            console.log("Mock Payment Submitted:", payment);
        }
    }

    // --- ADMIN ---
    static async getPendingPayments(): Promise<Payment[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'payments'), where('status', 'in', ['pending', 'verification']), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
        }
        return [];
    }

    static async updatePaymentStatus(paymentId: string, status: Payment['status'], feedback?: string): Promise<void> {
        if (isOnline && db) {
            await updateDoc(doc(db, 'payments', paymentId), {
                status,
                feedback: feedback || null
            });
        }
    }

    static async approvePayment(paymentId: string, userId: string): Promise<void> {
        if (isOnline && db) {
            // 1. Update Payment Status
            await this.updatePaymentStatus(paymentId, 'approved');

            // 2. Calculate New Expiry
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data() as UserProfile;
                const currentExpiry = userData.membershipExpiry || 0;
                const now = Date.now();

                // If active and future, add 1 month to existing expiry. If expired, add 1 month to NOW.
                const baseDate = currentExpiry > now ? currentExpiry : now;
                const newExpiry = addMonths(baseDate, 1).getTime();

                await updateDoc(userRef, {
                    membershipStatus: 'active',
                    membershipExpiry: newExpiry
                });
            }
        }
    }

    static async updatePlan(planId: string, data: Partial<Plan>): Promise<void> {
        if (isOnline && db) {
            await updateDoc(doc(db, 'plans', planId), data);
        }
    }

    static async addPlan(plan: Omit<Plan, 'id'>): Promise<string> {
        if (isOnline && db) {
            const docRef = await addDoc(collection(db, 'plans'), plan);
            return docRef.id;
        }
        return '';
    }

    static async deletePlan(planId: string): Promise<void> {
        if (isOnline && db) {
            await deleteDoc(doc(db, 'plans', planId));
        }
    }

    static async getUsers(): Promise<UserProfile[]> {
        if (isOnline && db) {
            const snap = await getDocs(collection(db, 'users'));
            return snap.docs.map(d => d.data() as UserProfile);
        }
        // Mock Users
        return [
            this.mockProfile('user', 'john@connor.com'),
            this.mockProfile('admin', 'sarah@connor.com')
        ];
    }

    static async updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
        if (isOnline && db) {
            await updateDoc(doc(db, 'users', uid), data);
        }
    }

    // --- CLASSES ---
    static async getClasses(): Promise<GymClass[]> {
        if (isOnline && db) {
            const snap = await getDocs(collection(db, 'classes'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as GymClass));
        }
        // Mock Classes
        return [
            { id: '1', day: 'LUNES', time: '07:00 AM', name: 'CROSSFIT', coachId: '1', coachName: 'Coach Mike', capacity: 20, bookedCount: 5 },
            { id: '2', day: 'LUNES', time: '06:00 PM', name: 'FUNCTIONAL', coachId: '2', coachName: 'Coach Sarah', capacity: 15, bookedCount: 15 },
            { id: '3', day: 'MARTES', time: '07:00 AM', name: 'CROSSFIT', coachId: '1', coachName: 'Coach Mike', capacity: 20, bookedCount: 2 }
        ];
    }

    static async addClass(gymClass: Omit<GymClass, 'id'>): Promise<void> {
        if (isOnline && db) {
            await addDoc(collection(db, 'classes'), gymClass);
        }
    }

    static async deleteClass(classId: string): Promise<void> {
        if (isOnline && db) {
            await deleteDoc(doc(db, 'classes', classId));
        }
    }

    // --- BOOKINGS ---
    static async bookClass(classId: string, user: UserProfile): Promise<void> {
        if (isOnline && db) {
            const classRef = doc(db, 'classes', classId);
            const attendeeRef = doc(db, 'classes', classId, 'attendees', user.uid);

            await runTransaction(db, async (transaction) => {
                const classDoc = await transaction.get(classRef);
                const attendeeDoc = await transaction.get(attendeeRef);

                if (!classDoc.exists()) throw new Error("Clase no encontrada");
                if (attendeeDoc.exists()) throw new Error("Ya estás inscrito en esta clase");

                const classData = classDoc.data() as GymClass;
                if (classData.bookedCount >= classData.capacity) throw new Error("Clase llena");

                transaction.update(classRef, { bookedCount: increment(1) });
                transaction.set(attendeeRef, {
                    uid: user.uid,
                    fullName: user.fullName,
                    email: user.email,
                    joinedAt: serverTimestamp()
                });
            });
        }
    }

    static async cancelBooking(classId: string, uid: string): Promise<void> {
        if (isOnline && db) {
            const classRef = doc(db, 'classes', classId);
            const attendeeRef = doc(db, 'classes', classId, 'attendees', uid);

            await runTransaction(db, async (transaction) => {
                const attendeeDoc = await transaction.get(attendeeRef);
                if (!attendeeDoc.exists()) return; // Already cancelled or never existed

                transaction.update(classRef, { bookedCount: increment(-1) });
                transaction.delete(attendeeRef);
            });
        }
    }

    static async getClassAttendees(classId: string): Promise<any[]> {
        if (isOnline && db) {
            const snap = await getDocs(collection(db, 'classes', classId, 'attendees'));
            return snap.docs.map(d => d.data());
        }
        return [];
    }

    static async getUserBookings(uid: string): Promise<string[]> {
        if (isOnline && db) {
            try {
                const bookingsQuery = query(collectionGroup(db, 'attendees'), where('uid', '==', uid));
                const snapshot = await getDocs(bookingsQuery);
                return snapshot.docs.map(doc => doc.ref.parent.parent?.id).filter((id): id is string => !!id);
            } catch (error) {
                console.error("Error fetching user bookings:", error);
                return [];
            }
        }
        return [];
    }


    // --- CONFIG ---
    static async getGymConfig(): Promise<GymConfig> {
        if (isOnline && db) {
            const snap = await getDoc(doc(db, 'config', 'main'));
            if (snap.exists()) return snap.data() as GymConfig;
        }
        // Mock Config
        return {
            paymentMethods: {
                zelle: 'Enviar a: pagosc mcf@gmail.com / Titular: CMCF Enterprise LLC',
                pago_movil: '0414-1234567 / CI: 12345678 / Banco: Mercantil',
                binance: 'Pay ID: 123456789 / Email: crypto@cmcf.com',
                transferencia: 'Banco Mercantil / Cuenta: 0105...1234 / RIF: J-123456789'
            },
            contactPhone: '+58 414 123 4567',
            contactEmail: 'info@cmcf.com'
        };
    }

    static async updateGymConfig(data: Partial<GymConfig>): Promise<void> {
        if (isOnline && db) {
            await setDoc(doc(db, 'config', 'main'), data, { merge: true });
        }
    }

    // --- HELPERS ---
    private static mockProfile(role: 'admin' | 'user', email: string): UserProfile {
        return {
            uid: 'mock-' + Date.now() + Math.random(),
            email,
            role,
            fullName: role === 'admin' ? 'Sarah Connor' : 'John Connor',
            cedula: 'V-12345678',
            phone: '0414-1234567',
            membershipStatus: 'active',
            membershipExpiry: Date.now() + 86400000 * 15,
            balance: 0,
            joinedAt: Date.now()
        };
    }
}

export { auth, db };
