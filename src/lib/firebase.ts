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
    limit,
    Firestore,
    Timestamp,
    runTransaction,
    collectionGroup,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { UserProfile, Payment, GymClass, Plan, Staff, GymConfig, Review, Trainer, Competition, CompetitionRegistration } from '@/types';
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
let storage: FirebaseStorage | undefined;

const isOnline = !!firebaseConfig.apiKey;

if (isOnline) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
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

    static async searchUsers(queryText: string): Promise<UserProfile[]> {
        if (!queryText.trim()) return [];
        if (isOnline && db) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef);
            const querySnapshot = await getDocs(q);
            const allUsers = querySnapshot.docs.map(d => d.data() as UserProfile);

            const lowerQuery = queryText.toLowerCase();
            return allUsers.filter(u =>
                u.fullName?.toLowerCase().includes(lowerQuery) ||
                u.email?.toLowerCase().includes(lowerQuery) ||
                (u.cedula && u.cedula.includes(queryText))
            );
        }
        return [];
    }

    static async getUserByCedula(cedula: string): Promise<UserProfile | null> {
        if (!cedula) return null;
        if (isOnline && db) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('cedula', '==', cedula), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return snap.docs[0].data() as UserProfile;
            }
        }
        return null;
    }

    static subscribeToUserProfile(uid: string, callback: (user: UserProfile) => void): Unsubscribe | null {
        if (isOnline && db) {
            return onSnapshot(doc(db, 'users', uid), (doc) => {
                if (doc.exists()) {
                    callback(doc.data() as UserProfile);
                }
            });
        }
        return null;
    }

    static async checkInUser(uid: string): Promise<void> {
        if (isOnline && db) {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                lastVisit: Date.now(),
                totalVisits: increment(1)
            });
        }
    }

    static async getDashboardStats(): Promise<{ activeUsers: number, dailyVisits: number }> {
        if (isOnline && db) {
            const usersRef = collection(db, 'users');

            // Active Users
            const qActive = query(usersRef, where('membershipStatus', '==', 'active'));
            const snapActive = await getDocs(qActive);

            // Daily Visits
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const qVisits = query(usersRef, where('lastVisit', '>=', todayStart.getTime()));
            const snapVisits = await getDocs(qVisits);

            return {
                activeUsers: snapActive.size,
                dailyVisits: snapVisits.size
            };
        }
        return { activeUsers: 0, dailyVisits: 0 };
    }

    static async getRecentCheckins(limitCount: number = 5): Promise<UserProfile[]> {
        if (isOnline && db) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('lastVisit', '>', 0), orderBy('lastVisit', 'desc'), limit(limitCount));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as UserProfile);
        }
        return [];
    }

    // --- REVIEWS ---
    static async addReview(review: Omit<Review, 'id'>): Promise<void> {
        if (isOnline && db) {
            // Sanitize data (Firestore doesn't like undefined)
            const safeReview = {
                ...review,
                userPhotoUrl: review.userPhotoUrl || null
            };
            await addDoc(collection(db, 'reviews'), safeReview);
        }
    }

    static async getReviews(limitCount: number = 4): Promise<Review[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'reviews'), where('approved', '==', true), orderBy('date', 'desc'), limit(limitCount));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        }
        return [];
    }

    // --- DATA ---
    static async getPlans(): Promise<Plan[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'plans'), where('visible', '==', true));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
        }
        return [];
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
    static async submitPayment(payment: Omit<Payment, 'id'>): Promise<string> {
        if (isOnline && db) {
            const docRef = await addDoc(collection(db, 'payments'), payment);

            // Only update membership status for MEMBERSHIP payments
            if (payment.type !== 'competition' && !payment.competitionId) {
                const userRef = doc(db, 'users', payment.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data() as UserProfile;
                    if (userData.membershipStatus !== 'active') {
                        await updateDoc(userRef, { membershipStatus: 'pending' });
                    }
                }
            }
            return docRef.id;
        } else {
            console.log("Mock Payment Submitted:", payment);
            return "mock_payment_id";
        }
    }

    // --- ADMIN ---
    static async getPendingPayments(type?: 'membership' | 'competition'): Promise<Payment[]> {
        if (isOnline && db) {
            let q = query(collection(db, 'payments'), where('status', 'in', ['pending', 'verification']), orderBy('timestamp', 'desc'));

            if (type) {
                // If type is membership, we want type=='membership' OR type==undefined (legacy)
                // This is hard in one firebase query.
                // Easier: Filter in memory or just query strictly if migrated.
                // For now, let's filter in memory since pending list is usually short.
                const snap = await getDocs(q);
                let docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));

                if (type === 'competition') {
                    docs = docs.filter(d => d.type === 'competition' || d.competitionId);
                } else {
                    docs = docs.filter(d => d.type !== 'competition' && !d.competitionId);
                }
                return docs;
            }

            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
        }
        return [];
    }

    static async getAllPayments(limitCount: number = 50, type?: 'membership' | 'competition'): Promise<Payment[]> {
        if (isOnline && db) {
            // For history, we might have many. Composite index might be needed.
            // If we filter by type, we should include it in query.
            // But 'orderBy' requires index matches.
            // Simplified: Fetch latest 100 and filter in memory for now.
            const q = query(collection(db, 'payments'), orderBy('timestamp', 'desc'), limit(100)); // increased limit
            const snap = await getDocs(q);
            let docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));

            if (type) {
                if (type === 'competition') {
                    docs = docs.filter(d => d.type === 'competition' || d.competitionId);
                } else {
                    docs = docs.filter(d => d.type !== 'competition' && !d.competitionId);
                }
            }

            return docs.slice(0, limitCount);
        }
        return [];
    }

    static async getUserPayments(userId: string): Promise<Payment[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'payments'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
        }
        return [];
    }

    static async updatePaymentStatus(paymentId: string, status: Payment['status'], feedback?: string): Promise<void> {
        if (isOnline && db) {
            const paymentRef = doc(db, 'payments', paymentId);

            // 1. Update Payment
            await updateDoc(paymentRef, {
                status,
                feedback: feedback || null
            });

            // 2. Sync Rejection to User Profile
            if (status === 'rejected') {
                const pSnap = await getDoc(paymentRef);
                if (pSnap.exists()) {
                    const pData = pSnap.data() as Payment;
                    const userRef = doc(db, 'users', pData.userId);
                    await updateDoc(userRef, {
                        membershipStatus: 'rejected',
                        rejectionFeedback: feedback || 'Pago rechazado. Por favor contacte a soporte.'
                    });
                }
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
                // Check capacity only if NOT unlimited
                if (!classData.isUnlimited && classData.bookedCount >= classData.capacity) throw new Error("Clase llena");

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


    // --- COMPETITIONS ---
    static async getCompetitions(): Promise<Competition[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'competitions'), orderBy('date', 'asc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Competition));
        }
        return [];
    }

    static async addCompetition(comp: Omit<Competition, 'id'>): Promise<string> {
        if (isOnline && db) {
            const ref = await addDoc(collection(db, 'competitions'), comp);
            return ref.id;
        }
        return '';
    }

    static async deleteCompetition(id: string): Promise<void> {
        if (isOnline && db) {
            await deleteDoc(doc(db, 'competitions', id));
        }
    }

    static async registerForCompetition(compId: string, data: Omit<CompetitionRegistration, 'id' | 'timestamp'>): Promise<void> {
        if (isOnline && db) {
            const compRef = doc(db, 'competitions', compId);
            const regRef = doc(collection(db, 'competitions', compId, 'registrations')); // Auto-ID

            // 1. Fetch ALL existing registrations for this competition to check duplicates
            // (Assuming reasonable scale < 1000 regs per comp)
            const allRegsSnap = await getDocs(collection(db, 'competitions', compId, 'registrations'));
            const existingRegs = allRegsSnap.docs.map(d => d.data() as CompetitionRegistration);

            // 2. Extact all registered Cedulas and User IDs
            const registeredCedulas = new Set<string>();
            const registeredUserIds = new Set<string>();

            existingRegs.forEach(reg => {
                if (reg.userId) registeredUserIds.add(reg.userId);
                if (reg.leaderCedula) registeredCedulas.add(reg.leaderCedula);
                reg.members?.forEach(m => {
                    if (m.cedula) registeredCedulas.add(m.cedula);
                    if (m.userId) registeredUserIds.add(m.userId);
                });
            });

            // 3. Check Current Request
            // Check Leader
            if (registeredUserIds.has(data.userId)) throw new Error("Ya estás inscrito en esta competencia.");
            if (data.leaderCedula && registeredCedulas.has(data.leaderCedula)) throw new Error(`La cédula ${data.leaderCedula} ya está inscrita.`);

            // Check Members
            for (const member of data.members) {
                if (member.cedula && registeredCedulas.has(member.cedula)) {
                    throw new Error(`La cédula ${member.cedula} (${member.name}) ya está inscrita.`);
                }
                if (member.userId && registeredUserIds.has(member.userId)) {
                    throw new Error(`El usuario ${member.name} ya está inscrito.`);
                }
            }

            // 4. Transaction
            await runTransaction(db, async (transaction) => {
                const compDoc = await transaction.get(compRef);
                if (!compDoc.exists()) throw new Error("Competencia no encontrada");

                const compData = compDoc.data() as Competition;
                if (!compData.isUnlimited && compData.registeredCount >= compData.capacity) {
                    throw new Error("Cupos agotados");
                }

                transaction.update(compRef, { registeredCount: increment(1) });
                transaction.set(regRef, {
                    ...data,
                    competitionId: compId,
                    timestamp: serverTimestamp(),
                    status: data.status || 'confirmed' // Default confirmed if not specified
                });
            });
        }
    }

    static async getUserCompetitions(uid: string): Promise<CompetitionRegistration[]> {
        if (isOnline && db) {
            const q = query(collectionGroup(db, 'registrations'), where('userId', '==', uid)); // Search by leader
            // If we want to find if they are a MEMBER of a team, we'd need a separate array-contains query or similar.
            // For now, let's just find where they are Leader.
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toMillis() || Date.now() } as CompetitionRegistration));
        }
        return [];
    }

    static async getCompetitionRegistrations(compId: string): Promise<CompetitionRegistration[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'competitions', compId, 'registrations'), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toMillis() || Date.now() } as CompetitionRegistration));
        }
        return [];
    }

    // --- TRAINERS ---
    static async getTrainers(): Promise<Trainer[]> {
        if (isOnline && db) {
            const q = query(collection(db, 'trainers'), orderBy('name', 'asc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Trainer));
        }
        return [];
    }

    static async addTrainer(trainer: Omit<Trainer, 'id'>): Promise<string> {
        if (isOnline && db) {
            const ref = await addDoc(collection(db, 'trainers'), trainer);
            return ref.id;
        }
        throw new Error('Offline');
    }

    static async updateTrainer(id: string, data: Partial<Trainer>): Promise<void> {
        if (isOnline && db) {
            await updateDoc(doc(db, 'trainers', id), data);
        }
    }

    static async deleteTrainer(id: string): Promise<void> {
        if (isOnline && db) {
            await deleteDoc(doc(db, 'trainers', id));
        }
    }

    static async processImageForDatabase(file: File | Blob): Promise<string> {
        // "Guardado Local"/Data Matrix Strategy:
        // Convert image to Base64 to store directly in Firestore.
        // This avoids Firebase Storage permission issues entirely.
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
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

    // --- MANUAL ADMIN ACTIONS ---
    // --- MANUAL ADMIN ACTIONS ---
    static async createManualPayment(data: { cedula: string, amount: number, method: string, reference?: string, planId?: string }): Promise<void> {
        if (isOnline && db) {
            // 1. Find User
            const user = await this.getUserByCedula(data.cedula);
            if (!user) throw new Error("Usuario no encontrado con esa cédula");

            // 2. Create Payment Record (Auto-Approved)
            const paymentRef = doc(collection(db, 'payments'));
            await setDoc(paymentRef, {
                id: paymentRef.id,
                userId: user.uid,
                userEmail: user.email,
                amount: data.amount,
                currency: '$', // Defaulting to USD for manual
                method: data.method,
                reference: data.reference || 'PAGO-MANUAL-' + Date.now().toString().slice(-4), // Auto-gen if empty
                description: 'Pago registrado manualmente por Admin',
                status: 'approved',
                isPartial: false,
                timestamp: Date.now(),
                planId: data.planId || user.planId // Use submitted plan or fallback to user's current
            });

            // 3. Update User Membership immediately
            await this.approvePayment(paymentRef.id, user.uid);
        }
    }

    // ... HELPERS ...

    static async approvePayment(paymentId: string, userId: string): Promise<void> {
        if (isOnline && db) {
            // 1. Retrieve Payment to check for planId
            const paymentRef = doc(db, 'payments', paymentId);
            const paymentSnap = await getDoc(paymentRef);

            if (!paymentSnap.exists()) {
                throw new Error('Payment not found');
            }

            const pData = paymentSnap.data() as Payment;
            const paidPlanId = pData.planId || '';

            // 2. Update payment status to approved
            await updateDoc(paymentRef, {
                status: 'approved',
                feedback: null
            });

            // 3. Calculate New Expiry
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error('User not found');
            }

            const userData = userSnap.data() as UserProfile;
            const currentExpiry = userData.membershipExpiry || 0;
            const now = Date.now();

            // Determine Duration and get plan data
            let durationDays = 30; // Default
            let planData: Plan | null = null;

            if (paidPlanId) {
                // Try to fetch plan details for accurate duration
                const planRef = doc(db, 'plans', paidPlanId);
                const planSnap = await getDoc(planRef);
                if (planSnap.exists()) {
                    planData = planSnap.data() as Plan;
                    durationDays = planData.durationDays || 30;
                } else {
                    // Fallback check on hardcoded list if not in DB
                    const plans = await this.getPlans();
                    const p = plans.find(pl => pl.id === paidPlanId);
                    if (p) {
                        planData = p;
                        durationDays = p.durationDays;
                    }
                }
            }

            // If active and future, add to existing expiry. If expired, add to NOW.
            const baseDate = currentExpiry > now ? currentExpiry : now;
            const expiryDate = new Date(baseDate);

            // Calculate expiration based on duration type
            if (planData) {
                if (planData.durationType === 'months') {
                    // Use calendar months for monthly/quarterly plans
                    expiryDate.setMonth(expiryDate.getMonth() + (planData.durationValue || 1));
                } else if (planData.durationType === 'days') {
                    // Use fixed days for daily/weekly plans
                    expiryDate.setDate(expiryDate.getDate() + (planData.durationValue || 1));
                } else {
                    // Fallback for old plans without durationType
                    expiryDate.setDate(expiryDate.getDate() + durationDays);
                }
            } else {
                // Fallback if plan not found in DB
                expiryDate.setDate(expiryDate.getDate() + durationDays);
            }

            // 4. Update user membership
            const userUpdate: any = {
                membershipStatus: 'active',
                membershipExpiry: expiryDate.getTime(),
                rejectionFeedback: null
            };

            // Only update planId if we have a valid value
            if (paidPlanId) {
                userUpdate.planId = paidPlanId;
            } else if (userData.planId) {
                userUpdate.planId = userData.planId;
            }

            await updateDoc(userRef, userUpdate);
        }
    }

    // --- HELPERS ---
    static async getExchangeRates(): Promise<{ dolar: number, euro: number, fecha: string } | null> {
        if (isOnline) {
            try {
                const response = await fetch('/api/rates');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Status: ${response.status}`);
                }

                return {
                    dolar: data.dolar,
                    euro: data.euro,
                    fecha: data.fecha
                };
            } catch (error) {
                console.error("Error obteniendo tasas BCV:", error);
                return null;
            }
        }
        // Mock Rates
        return { dolar: 36.5, euro: 39.2, fecha: 'MOCK-DATE' };
    }

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
