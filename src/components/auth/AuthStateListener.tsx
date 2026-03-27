/**
 * Simple AuthStateListener - listens to Transcodes auth events
 */
import { on } from '@bigstrider/transcodes-sdk';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthStateListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = on('AUTH_STATE_CHANGED', (payload) => {
      console.log('[AuthStateListener] Auth state changed:', payload);
      console.log('  - isAuthenticated:', payload.isAuthenticated);
      console.log('  - member:', payload.member);
      console.log(
        '  - accessToken:',
        payload.accessToken ? `${payload.accessToken.substring(0, 20)}...` : null,
      );
      console.log(
        '  - expiresAt:',
        payload.expiresAt ? new Date(payload.expiresAt).toLocaleString() : null,
      );

      if (!payload.isAuthenticated) {
        // User logged out - go to login page
        const publicPaths = ['/login', '/register', '/forgot-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return null;
};

export default AuthStateListener;
