import { Navigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { isAdmin, isAuthenticated } from '../../utils/auth';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
    children: React.ReactNode;
}

/**
 * AdminRoute - Protects admin-only routes
 * - Allows: Admin users
 * - Blocks: Regular members (redirects to /User/Home)
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        // Check authentication
        if (!isAuthenticated()) {
            message.error('กรุณาเข้าสู่ระบบก่อน');
            setShouldRedirect(true);
            return;
        }

        // Check if user is admin
        if (!isAdmin()) {
            message.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับ Admin เท่านั้น)');
            setShouldRedirect(true);
            return;
        }
    }, [location.pathname]);

    // Redirect if not authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/auth/login" replace />;
    }

    // Redirect if not admin
    if (shouldRedirect || !isAdmin()) {
        return <Navigate to="/User/Home" replace />;
    }

    // Allow admin to access
    return <>{children}</>;
};

export default AdminRoute;
