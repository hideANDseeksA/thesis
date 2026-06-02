import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { connectSocket } from "@/utils/socket";
import { apiWithLoading } from "@/lib/axios";
import { getItem } from "@/utils/localStorageHelper";
import NotificationSound from "@/assets/audio/mixkit-confirmation-tone-2867.wav";
import { useAuth } from "@/auth/AuthContext";

// ───────────────────────────────────────────────────────────────
// Context
// ───────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside <NotificationProvider>"
    );
  }
  return ctx;
};

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────
export const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts.at(-1)[0]).toUpperCase();
};

export const formatTimestamp = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// ───────────────────────────────────────────────────────────────
// ✅ NEW: Service Worker Notification Helper
// Works on mobile (Android + iOS PWA) unlike new Notification()
// ───────────────────────────────────────────────────────────────
const showNotification = async (title, body, icon = "/icon.png") => {
  if (Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;

      // Use postMessage if SW controller is active (most compatible)
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body,
          icon,
        });
        return;
      }

      // Fallback: call showNotification directly on the registration
      await registration.showNotification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200], // vibrates on Android
      });
      return;
    }

    // Last resort: desktop-only fallback
    new Notification(title, { body, icon });
  } catch (err) {
    console.error("Failed to show notification:", err);
  }
};

// ───────────────────────────────────────────────────────────────
// Provider
// ───────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const location = useLocation();
  const resident_id = getItem("resident_id");

  // ✅ AUTH (single source of truth)
  const { accessToken, isLoggedIn, loading, user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("notificationsEnabled");
    return saved !== null ? saved === "true" : true;
  });

  const audioRef      = useRef(null);
  const hasFetchedRef = useRef(false);

  // ── Audio ────────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio(NotificationSound);
    audioRef.current.volume = 0.6;
  }, []);

  const playSound = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  // ── Browser Notification Permission ──────────────────────────
  useEffect(() => {
    if (!notificationsEnabled) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          setNotificationsEnabled(false);
          localStorage.setItem("notificationsEnabled", "false");
          toast("Notifications disabled", {
            description: "You can enable them anytime from settings",
            position: "top-center",
          });
        }
      });
    }

    if (Notification.permission === "denied") {
      setNotificationsEnabled(false);
      localStorage.setItem("notificationsEnabled", "false");
    }
  }, [notificationsEnabled]);

  // ── Fetch notifications (once per login) ─────────────────────
  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn || !resident_id || !user || !user.role || hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    const fetchNotifications = async () => {
      try {
        const url =
          user.role === "resident"
            ? `/notifications/resident/${resident_id}`
            : `/notifications/${user.role}`;

        const res  = await apiWithLoading.get(url);
        const data = res.data;
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.mark_read).length);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    fetchNotifications();
  }, [loading, isLoggedIn, resident_id, user]);

  // ── Socket connection (AUTH-SAFE) ────────────────────────────
  useEffect(() => {
    if (loading || !isLoggedIn || !accessToken) return;

    const socket = connectSocket(accessToken);

    socket.on("connect", () =>
      console.log("✅ Socket connected:", socket.id)
    );

    socket.on("new-notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);

      if (!notification.mark_read) {
        setUnreadCount((prev) => prev + 1);
      }

      if (notificationsEnabled) {
        playSound();
        // ✅ UPDATED: uses SW-based notification (works on mobile)
        showNotification(
          notification.content?.title || "New Notification",
          notification.content?.message
        );
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [loading, isLoggedIn, accessToken, notificationsEnabled]);

  // ── Reset on logout ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      hasFetchedRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn]);

  // ── Actions ─────────────────────────────────────────────────
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (Notification.permission === "denied") {
        toast.error("Notifications blocked", {
          description: "Enable them in browser settings",
          position: "top-center",
        });
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      setNotificationsEnabled(true);
      localStorage.setItem("notificationsEnabled", "true");
      playSound();
      toast.success("Notifications Enabled 🚀");
      // ✅ UPDATED: uses SW-based notification (works on mobile)
      showNotification(
        "Notifications Enabled",
        "You will now receive updates 🚀"
      );
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("notificationsEnabled", "false");
      toast("Notifications Disabled");
    }
  };

  // ── markAsRead ───────────────────────────────────────────────
  const markAsRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.mark_read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, mark_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiWithLoading.put(`/notifications/${id}`, { mark_read: true });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, mark_read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  // ── markAllAsRead ────────────────────────────────────────────
  const markAllAsRead = () => {
    notifications
      .filter((n) => !n.mark_read)
      .forEach((n) => markAsRead(n.id));
  };

  // ── dismissNotification ──────────────────────────────────────
  const dismissNotification = (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!target.mark_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        notificationsEnabled,
        handleToggleNotifications,
        dismissNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};