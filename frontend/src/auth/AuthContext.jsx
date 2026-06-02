import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api } from "../lib/axios";
import { setAccessToken as setMemoryToken } from "@/lib/tokenService";
import { decodeToken } from "@/lib/jwt";
import { setItem, removeItem,clearStorage } from "@/utils/localStorageHelper";


const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [resident_data, setResident_Data] = useState(null);
  const [loading, setLoading] = useState(true);

  const didInitRef = useRef(false);
  const refreshPromiseRef = useRef(null);

  const applyToken = useCallback((token) => {
    setAccessTokenState(token);
    setMemoryToken(token);
    removeItem("resident_id");
    if (!token) {
      setUser(null);
      setResident_Data(null);
      
      return;
    }

    const decoded = decodeToken(token);

    if (!decoded) {
      setUser(null);
      setResident_Data(null);
      removeItem("resident_id");
      return;
    }

    setUser({
      id: decoded.id,
      role: decoded.role,
    });

    if (decoded.resident_id) {
      setItem("resident_id", decoded.resident_id);
    } else {
      removeItem("resident_id");
    }

    setResident_Data(decoded.data ?? null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const res = await api.post("/auth/refresh", {},);
        const { accessToken: newAccessToken } = res.data;

        if (!newAccessToken) {
          throw new Error("No access token returned");
        }

        applyToken(newAccessToken);
        return newAccessToken;
      } catch (err) {
        applyToken(null);
        throw err;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [applyToken]);

const logout = useCallback(async () => {
  try {
    await api.post("/auth/logout", {}, { withCredentials: true });
    applyToken(null);
    clearStorage();  // ← clears localStorage
  } catch (err) {
    console.error("Logout request failed:", err);
    // ← if the request fails, clearStorage() is never called!
  } finally {
    applyToken(null);  // ← only token is cleared in finally
  }
}, [applyToken]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const initAuth = async () => {
      console.log("🔄 Auth refresh started");

      try {
        await refreshAccessToken();
      } catch (err) {
        if (err.response?.status === 401) {
          applyToken(null);
        } else {
          console.error("Auth init failed:", err);
          applyToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshAccessToken, applyToken]);

  useEffect(() => {
    if (!accessToken) return;

    const decoded = decodeToken(accessToken);
    if (!decoded?.exp) return;

    const expiresAt = decoded.exp * 1000;
    const timeLeft = expiresAt - Date.now();
    const refreshBuffer = 60 * 1000;
    const refreshIn = timeLeft - refreshBuffer;

    let timer;

    const scheduleRefresh = async () => {
      try {
        console.log("🔄 Refreshing access token before expiry...");
        await refreshAccessToken();
      } catch (err) {
        console.log("❌ Refresh failed, logging out");
        await logout();
      }
    };

    if (timeLeft <= 0 || refreshIn <= 0) {
      scheduleRefresh();
      return;
    }

    timer = setTimeout(scheduleRefresh, refreshIn);

    return () => clearTimeout(timer);
  }, [accessToken, refreshAccessToken, logout]);

  const setAccessToken = (token) => {
    applyToken(token);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        user,
        setUser,
        resident_data,
        setResident_Data,
        logout,
        loading,
        isLoggedIn: !!accessToken,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};