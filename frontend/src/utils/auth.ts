// Utility functions for authentication and authorization

/**
 * Get the user's role from JWT token stored in localStorage
 * @returns 'admin' | 'member' | null
 */
export const getUserRole = (): string | null => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        // Check if token has valid format (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn('Invalid token format');
            localStorage.removeItem('token');
            return null;
        }

        // Decode JWT token (simple base64 decode, not verification)
        const payload = JSON.parse(atob(parts[1]));

        // Return role from token payload
        return payload.role || null;
    } catch (error) {
        console.error('Error decoding token:', error);
        // Clear invalid token to prevent repeated errors
        localStorage.removeItem('token');
        return null;
    }
};

/**
 * Check if the current user is an admin
 * @returns boolean
 */
export const isAdmin = (): boolean => {
    const role = getUserRole();
    return role === 'admin';
};

/**
 * Check if the current user is a member
 * @returns boolean
 */
export const isMember = (): boolean => {
    const role = getUserRole();
    return role === 'member';
};

/**
 * Check if user is authenticated (has valid token)
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
};

/**
 * Get user info from localStorage
 * @returns user data object or null
 */
export const getUserData = (): any => {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) return null;
        return JSON.parse(userData);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};
