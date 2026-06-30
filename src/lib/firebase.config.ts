import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any;
let auth: any;
let db: any;
let isMock = true;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isMock = false;
  } catch (error) {
    console.warn("Firebase initialization failed, falling back to mock environment:", error);
  }
}

// ----------------------------------------------------
// LOCAL STORAGE MOCK FIREBASE IMPLEMENTATION
// ----------------------------------------------------
class MockAuth {
  private currentUser: any = null;
  private listeners: Function[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dg_user");
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private saveUser(user: any) {
    this.currentUser = user;
    localStorage.setItem("dg_user", JSON.stringify(user));
    this.notify();
    return { user };
  }

  async signInWithGoogle() {
    return this.saveUser({
      uid: "mock-google-123",
      email: "guardian.guest@gmail.com",
      displayName: "Guest Guardian",
      photoURL: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=guardian-google",
      provider: "google",
    });
  }

  async signInWithGitHub() {
    return this.saveUser({
      uid: "mock-github-456",
      email: "guardian.guest@github.dev",
      displayName: "GitHub Guardian",
      photoURL: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=guardian-github",
      provider: "github",
    });
  }

  async signInWithEmail(email: string, password: string) {
    const stored = localStorage.getItem(`dg_email_${btoa(email)}`);
    if (!stored) throw new Error("No account found with this email. Please register first.");
    const storedData = JSON.parse(stored);
    if (storedData.password !== btoa(password)) throw new Error("Incorrect password. Please try again.");
    return this.saveUser(storedData.user);
  }

  async createWithEmail(email: string, password: string, displayName: string) {
    if (localStorage.getItem(`dg_email_${btoa(email)}`)) {
      throw new Error("An account already exists with this email. Try signing in.");
    }
    const user = {
      uid: `mock-email-${Date.now()}`,
      email,
      displayName: displayName || email.split("@")[0],
      photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(email)}`,
      provider: "email",
    };
    localStorage.setItem(`dg_email_${btoa(email)}`, JSON.stringify({ user, password: btoa(password) }));
    return this.saveUser(user);
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem("dg_user");
    this.notify();
  }

  private notify() {
    this.listeners.forEach((callback) => callback(this.currentUser));
  }
}

class MockFirestore {
  private getStorageKey(col: string) {
    return `dg_firestore_${col}`;
  }

  private getAll(col: string): any[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.getStorageKey(col));
    return data ? JSON.parse(data) : [];
  }

  private saveAll(col: string, items: any[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getStorageKey(col), JSON.stringify(items));
  }

  async doc(col: string, id: string) {
    return {
      get: async () => {
        const items = this.getAll(col);
        const item = items.find((i) => i.id === id);
        return { exists: () => !!item, data: () => item || null };
      },
      set: async (data: any, options?: { merge?: boolean }) => {
        const items = this.getAll(col);
        const index = items.findIndex((i) => i.id === id);
        const newDoc = { id, ...data };
        if (index > -1) {
          items[index] = options?.merge ? { ...items[index], ...data } : newDoc;
        } else {
          items.push(newDoc);
        }
        this.saveAll(col, items);
      },
      update: async (data: any) => {
        const items = this.getAll(col);
        const index = items.findIndex((i) => i.id === id);
        if (index > -1) {
          items[index] = { ...items[index], ...data };
          this.saveAll(col, items);
        } else {
          throw new Error("Document not found");
        }
      },
      delete: async () => {
        const items = this.getAll(col);
        this.saveAll(col, items.filter((i) => i.id !== id));
      },
    };
  }

  async getDocs(col: string, queryFn?: (items: any[]) => any[]) {
    let items = this.getAll(col);
    if (queryFn) items = queryFn(items);
    return {
      docs: items.map((item) => ({ id: item.id, data: () => item })),
      empty: items.length === 0,
    };
  }
}

const mockAuth = new MockAuth();
const mockDb = new MockFirestore();

export const firebaseAuth = isMock
  ? mockAuth
  : {
      onAuthStateChanged: (cb: any) => auth.onAuthStateChanged(cb),
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
      },
      signInWithGitHub: async () => {
        const provider = new GithubAuthProvider();
        provider.addScope("read:user");
        return signInWithPopup(auth, provider);
      },
      signInWithEmail: async (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
      },
      createWithEmail: async (email: string, password: string, displayName: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        return result;
      },
      signOut: () => auth.signOut(),
      get currentUser() { return auth?.currentUser; },
    };

export const firestoreDb = isMock
  ? mockDb
  : {
      doc: (col: string, id: string) => {
        const docRef = doc(db, col, id);
        return {
          get: () => getDoc(docRef),
          set: (data: any, options?: any) => setDoc(docRef, data, options),
          update: (data: any) => updateDoc(docRef, data),
          delete: () => deleteDoc(docRef),
        };
      },
      getDocs: async (col: string) => {
        const q = collection(db, col);
        return getDocs(q);
      },
    };

export { isMock };
