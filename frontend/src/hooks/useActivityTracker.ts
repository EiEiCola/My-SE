// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';

const INACTIVITY_WARNING_MS = 9 * 60 * 1000; // 9 นาที
const INACTIVITY_LOGOUT_MS = 10 * 60 * 1000; // 10 นาที
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 นาที

export const useActivityTracker = () => {
    const navigate = useNavigate();
    const { modal } = App.useApp();
    const lastActivityRef = useRef<number>(Date.now());
    const warningShownRef = useRef<boolean>(false);
    const logoutShownRef = useRef<boolean>(false); // ✅ ป้องกัน logout modal ซ้อน
    const heartbeatTimerRef = useRef<number | null>(null);
    const checkTimerRef = useRef<number | null>(null);

    // Update last activity timestamp
    const updateActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
        warningShownRef.current = false;
        logoutShownRef.current = false; // ✅ Reset ทั้งสอง flags
    }, []);

    // Send heartbeat to backend
    const sendHeartbeat = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            await fetch(`${apiUrl}/api/member/heartbeat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Failed to send heartbeat:', error);
        }
    }, []);

    // Handle auto-logout
    const handleAutoLogout = useCallback(() => {
        // ✅ ป้องกัน modal ซ้อน
        if (logoutShownRef.current) return;
        logoutShownRef.current = true;

        modal.warning({
            title: 'คุณถูกออกจากระบบ',
            content: 'เนื่องจากไม่มีการใช้งานเกิน 10 นาที',
            okText: 'เข้าสู่ระบบอีกครั้ง',
            onOk: () => {
                localStorage.removeItem('token');
                navigate('/login');
            },
        });
    }, [modal, navigate]);

    // Show warning before logout
    const showInactivityWarning = useCallback(() => {
        // ✅ ป้องกัน modal ซ้อน
        if (warningShownRef.current) return;

        warningShownRef.current = true;
        modal.warning({
            title: '⚠️ คำเตือน: ไม่มีการใช้งาน',
            content: 'คุณจะถูกออกจากระบบใน 1 นาที หากไม่มีการใช้งาน กรุณาขยับเม้าส์หรือกดปุ่มใดก็ได้',
            okText: 'ฉันยังใช้งานอยู่',
            onOk: updateActivity,
        });
    }, [modal, updateActivity]);

    // Check for inactivity
    const checkInactivity = useCallback(() => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityRef.current;

        if (timeSinceActivity >= INACTIVITY_LOGOUT_MS) {
            handleAutoLogout();
        } else if (timeSinceActivity >= INACTIVITY_WARNING_MS && !warningShownRef.current) {
            showInactivityWarning();
        }
    }, [handleAutoLogout, showInactivityWarning]);

    useEffect(() => {
        // Activity event listeners
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        events.forEach((event) => {
            window.addEventListener(event, updateActivity);
        });

        // Start heartbeat interval
        heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

        // Start inactivity check interval (check every 30 seconds)
        checkTimerRef.current = setInterval(checkInactivity, 30 * 1000);

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, updateActivity);
            });

            if (heartbeatTimerRef.current) {
                clearInterval(heartbeatTimerRef.current);
            }

            if (checkTimerRef.current) {
                clearInterval(checkTimerRef.current);
            }
        };
    }, [updateActivity, sendHeartbeat, checkInactivity]);

    return { updateActivity };
};
