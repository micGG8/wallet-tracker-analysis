import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, pass: string) {
    if (!auth) throw new Error('Firebase non è configurato.');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      throw new Error(translateAuthError(err));
    }
  }

  async function register(email: string, pass: string) {
    if (!auth) throw new Error('Firebase non è configurato.');
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      throw new Error(translateAuthError(err));
    }
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
}

function translateAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Indirizzo email non valido.';
    case 'auth/user-disabled':
      return 'Questo account utente è stato disabilitato.';
    case 'auth/user-not-found':
      return 'Nessun account trovato con questa email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email o password non corretti.';
    case 'auth/email-already-in-use':
      return 'Esiste già un account registrato con questo indirizzo email.';
    case 'auth/weak-password':
      return 'La password è troppo debole. Inserisci almeno 6 caratteri.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi falliti. Riprova tra qualche minuto.';
    case 'auth/network-request-failed':
      return 'Errore di connessione. Controlla la tua rete internet.';
    default:
      return (err as Error)?.message || 'Errore durante l\'autenticazione.';
  }
}
