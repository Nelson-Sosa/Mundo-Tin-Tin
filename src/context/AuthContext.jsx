import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import {
  loginWithEmailPassword,
  loginWithGoogle as googleLogin,
  registerWithEmailPassword,
  logout as authLogout,
  getUserData,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authOperationRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (authOperationRef.current) {
          setLoading(false);
          return;
        }
        try {
          const userData = await getUserData(firebaseUser.uid);
          setUser(userData ? { ...firebaseUser, ...userData } : firebaseUser);
        } catch (err) {
          console.error("[Auth] Error fetching user data:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    authOperationRef.current = true;
    try {
      const userData = await loginWithEmailPassword(email, password);
      const firebaseUser = auth.currentUser;
      setUser({ ...firebaseUser, ...userData });
      return userData;
    } finally {
      authOperationRef.current = false;
    }
  }

  async function loginWithGoogle() {
    authOperationRef.current = true;
    try {
      const userData = await googleLogin();
      const firebaseUser = auth.currentUser;
      setUser({ ...firebaseUser, ...userData });
      return userData;
    } finally {
      authOperationRef.current = false;
    }
  }

  async function register(email, password) {
    authOperationRef.current = true;
    try {
      const userData = await registerWithEmailPassword(email, password);
      const firebaseUser = auth.currentUser;
      setUser({ ...firebaseUser, ...userData });
      return userData;
    } finally {
      authOperationRef.current = false;
    }
  }

  async function logout() {
    await authLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
