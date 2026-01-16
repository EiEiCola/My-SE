// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';

const INACTIVITY_WARNING_MS = 4 * 60 * 1000; // 4 minutes
const INACTIVITY_LOGOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute

export const useActivityTracker = () => {
    const navigate = useNavigate();
    const { modal } = App.useApp();
    const lastActivityRef = useRef<number>(Date.now());
    const warningShownRef = useRef<boolean>(false);
    const heartbeatTimerRef = useRef<number | null>(null);
    const checkTimerRef = useRef<number | null>(null);

    // Update last activity timestamp
    const updateActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
        warningShownRef.current = false;
    }, []);

    // Send heartbeat to backend
    const sendHeartbeat = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/member/heartbeat`, {
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
        modal.warning({
            title: 'Session Expired',
            content: 'You have been logged out due to inactivity.',
            onOk: () => {
                localStorage.removeItem('token');
                navigate('/login');
            },
        });
    }, [modal, navigate]);

    // Show warning before logout
    const showInactivityWarning = useCallback(() => {
        if (warningShownRef.current) return;

        warningShownRef.current = true;
        modal.warning({
            title: 'Inactive Warning',
            content: 'You will be logged out in 1 minute due to inactivity. Move your mouse or press any key to stay logged in.',
            okText: 'Stay Logged In',
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
