import { Request, Response, NextFunction } from 'express';
import { importJWK, jwtVerify, JWTPayload } from 'jose';
import publicKeyJson from '../public_key.json';

/**
 * Verified JWT payload stored in request
 */
export interface AuthenticatedUser extends JWTPayload {
  sub?: string;
  email?: string;
  role?: string;
  projectId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extended Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Import the EC public key from JWK once at startup
const publicKeyPromise = importJWK(publicKeyJson, 'ES256');

/**
 * JWT Auth Middleware
 *
 * Verifies the Bearer token in the Authorization header
 * using the EC P-256 public key (ES256).
 *
 * Usage: app.use('/api/protected', verifyToken, handler)
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const route = `${req.method} ${req.originalUrl}`;
  console.log('');
  console.log('='.repeat(60));
  console.log(`[Auth] 🔐 Incoming request: ${route}`);

  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] ❌ No Bearer token in Authorization header');
    console.log('='.repeat(60));
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  console.log('[Auth] 📨 Token received (first 40 chars):', token.slice(0, 40) + '...');

  try {
    const publicKey = await publicKeyPromise;
    console.log('[Auth] 🔑 Public key loaded (kid):', publicKeyJson.kid);

    const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
    });

    console.log('[Auth] ✅ Signature verified successfully!');
    console.log('  alg (header)  :', protectedHeader.alg);
    console.log('  kid (header)  :', protectedHeader.kid);
    console.log('  sub           :', payload.sub);
    console.log('  email         :', (payload as AuthenticatedUser).email ?? '-');
    console.log('  role          :', (payload as AuthenticatedUser).role ?? '-');
    console.log('  projectId     :', (payload as AuthenticatedUser).projectId ?? '-');
    console.log('  iat           :', payload.iat ? new Date(payload.iat * 1000).toISOString() : '-');
    console.log('  exp           :', payload.exp ? new Date(payload.exp * 1000).toISOString() : '-');
    console.log('='.repeat(60));

    req.user = payload as AuthenticatedUser;
    next();
  } catch (error: any) {
    console.log('[Auth] ❌ Verification FAILED');
    console.log('  error code    :', error.code ?? '-');
    console.log('  error message :', error.message);
    console.log('='.repeat(60));

    if (error.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'JWT has expired',
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed',
    });
  }
};

/**
 * Optional JWT Auth Middleware
 *
 * Same as verifyToken but doesn't fail if token is missing.
 * req.user will be undefined if no valid token provided.
 */
export const optionalVerifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const publicKey = await publicKeyPromise;
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
    });
    req.user = payload as AuthenticatedUser;
  } catch (error: any) {
    console.warn('[Auth] Optional token invalid:', error.message);
  }

  next();
};
