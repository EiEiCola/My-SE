import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { notificationAPI, type Notification } from "../services/http/notification";

// WebSocket message types
interface WSMessage {
    type: string;
    payload: any;
    target_id?: number;
}

interface WebSocketContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteReadNotifications: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within WebSocketProvider");
    }
    return context;
};

interface Props {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Calculate unread count
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Fetch notifications from API (initial load + manual refresh)
    const refreshNotifications = useCallback(async () => {
        try {
            const res = await notificationAPI.getAll();
            if (res.data && Array.isArray(res.data.data)) {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }, []);

    // Mark notification as read
    const markAsRead = useCallback(async (id: number) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.ID === id ? { ...n, is_read: true } : n))
            );
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    }, []);

    // ✅ อ่านทั้งหมด
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    }, []);

    // ✅ ลบ notification ที่อ่านแล้ว
    const deleteReadNotifications = useCallback(async () => {
        try {
            await notificationAPI.deleteRead();
            setNotifications((prev) => prev.filter((n) => !n.is_read));
        } catch (err) {
            console.error("Failed to delete read notifications", err);
        }
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        // ❌ ข้าม WebSocket สำหรับ Admin (endpoint เป็นของ member เท่านั้น)
        if (!token || role === "admin") {
            // Admin ยังใช้ API fetch notification ได้ปกติ
            if (token) refreshNotifications();
            return;
        }

        // ✅ ถ้ามี connection อยู่แล้ว ไม่ต้อง connect ใหม่ (แก้ปัญหา StrictMode)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("WebSocket already connected, skipping...");
            return;
        }

        // Determine WebSocket URL based on current location
        // ✅ ใช้ path ที่ถูกต้อง: /api/member/chat/ws
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname;
        const port = host === "localhost" ? ":8080" : "";
        const wsUrl = `${protocol}//${host}${port}/api/member/chat/ws?token=${token}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket connected");
                setIsConnected(true);
                // Fetch initial notifications when connected
                refreshNotifications();
            };

            ws.onmessage = (event) => {
                try {
                    const msg: WSMessage = JSON.parse(event.data);

                    // Handle notification messages
                    if (msg.type === "notification" || msg.type === "new_notification") {
                        const newNotif = msg.payload as Notification;
                        // ✅ เช็ค duplicate โดยใช้ ID ก่อนเพิ่ม
                        setNotifications((prev) => {
                            const exists = prev.some((n) => n.ID === newNotif.ID);
                            if (exists) return prev;
                            return [newNotif, ...prev];
                        });
                    }
                } catch (err) {
                    console.error("Failed to parse WS message", err);
                }
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected");
                setIsConnected(false);
                wsRef.current = null;

                // Auto-reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log("Attempting to reconnect...");
                    connect();
                }, 5000);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error", error);
            };
        } catch (err) {
            console.error("Failed to create WebSocket", err);
        }
    }, [refreshNotifications]);

    // Connect on mount
    useEffect(() => {
        connect();

        return () => {
            // Cleanup on unmount
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    // Reconnect when token changes (login/logout)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "token") {
                if (e.newValue) {
                    connect();
                } else {
                    wsRef.current?.close();
                    setNotifications([]);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [connect]);

    return (
        <WebSocketContext.Provider
            value={{
                notifications,
                unreadCount,
                isConnected,
                markAsRead,
                markAllAsRead,
                deleteReadNotifications,
                refreshNotifications,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketContext;
