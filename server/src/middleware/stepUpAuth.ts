import { Request, Response, NextFunction } from 'express';

/**
 * Step-up Session ID Prefix
 */
const STEP_UP_SESSION_PREFIX = 'ssid_';

/**
 * Auth API Base URL for step-up session verification
 */
const AUTH_API_URL = process.env.AUTH_API_URL || 'http://localhost:3500';

/**
 * API Key for Auth API requests
 */
const AUTH_API_KEY =
  'tc_live_ca30406e3c52e2bfa6603a67_7GbnDAJ2_16339f5d7f58725bec5861ddd33c2b40da54ef0b14c90f07305601223adafeff';

/**
 * Step-up session response from auth API
 */
interface StepUpSessionResponse {
  logId: string;
  success: boolean;
  statusCode: number;
  payload: {
    projectId: string;
    userId: string;
    action: string;
    role: string;
  }[];
}

/**
 * Step-up session data stored in request
 */
export interface StepUpSessionData {
  sessionId: string;
  projectId: string;
  userId: string;
  action: string;
  role: string;
}

/**
 * Extended Request with step-up session data
 */
export interface StepUpAuthRequest extends Request {
  stepUpSession?: StepUpSessionData;
}

/**
 * Step-up Session Verification Middleware
 *
 * Validates the sid from request body by calling the auth API.
 * 1. Extracts SID from request body (req.body.sid)
 * 2. Calls GET /v1/auth/temp-session/step-up/:sessionId
 * 3. If valid, stores session data in req.stepUpSession
 * 4. If invalid/expired, returns 401 Unauthorized
 */
export const verifyStepUpSession = async (
  req: StepUpAuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract sid from request body
  const sessionId = req.body?.sid as string | undefined;

  // Check if sid is present in body
  if (!sessionId) {
    return res.status(401).json({
      error: 'Step-up authentication required',
      message: 'Missing sid in request body',
    });
  }

  // Validate session ID format
  if (!sessionId.startsWith(STEP_UP_SESSION_PREFIX)) {
    return res.status(401).json({
      error: 'Invalid step-up session',
      message: 'Invalid session ID format',
    });
  }

  try {
    // Call auth API to verify step-up session
    console.log('');
    console.log('[StepUpAuth] 🔍 Verifying session with auth API...');
    console.log('  SID (from body):', sessionId);
    console.log(
      '  URL:',
      `${AUTH_API_URL}/v1/auth/temp-session/step-up/${sessionId}`
    );

    const response = await fetch(
      `${AUTH_API_URL}/v1/auth/temp-session/step-up/${sessionId}`,
      {
        headers: {
          'x-api-key': AUTH_API_KEY,
        },
      }
    );

    console.log('response', response);

    if (!response.ok) {
      console.log('[StepUpAuth] ❌ Session verification failed');
      console.log('  Status:', response.status);
      return res.status(401).json({
        error: 'Step-up session invalid or expired',
        message: 'Session not found or has expired',
      });
    }

    const sessionData = (await response.json()) as StepUpSessionResponse;

    console.log('[StepUpAuth] ✅ Session Verified');
    console.log('  projectId:', sessionData.payload[0].projectId);
    console.log('  userId:', sessionData.payload[0].userId);
    console.log('  action:', sessionData.payload[0].action);
    console.log('  role:', sessionData.payload[0].role);
    console.log('');

    // Store session data in request for downstream handlers
    req.stepUpSession = {
      sessionId,
      projectId: sessionData.payload[0].projectId,
      userId: sessionData.payload[0].userId,
      action: sessionData.payload[0].action,
      role: sessionData.payload[0].role,
    };

    next();
  } catch (error) {
    console.error('[StepUpAuth] ❌ Error verifying session:', error);
    return res.status(500).json({
      error: 'Step-up verification failed',
      message: 'Failed to verify step-up session with auth service',
    });
  }
};

/**
 * Optional step-up verification middleware
 *
 * Same as verifyStepUpSession but doesn't fail if sid is missing.
 * Useful for endpoints that optionally require step-up auth.
 */
export const optionalStepUpSession = async (
  req: StepUpAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const sessionId = req.body?.sid as string | undefined;

  if (sessionId && sessionId.startsWith(STEP_UP_SESSION_PREFIX)) {
    try {
      const response = await fetch(
        `${AUTH_API_URL}/v1/auth/temp-session/step-up/${sessionId}`,
        {
          headers: {
            'x-api-key': AUTH_API_KEY,
          },
        }
      );

      if (response.ok) {
        const sessionData = (await response.json()) as StepUpSessionResponse;
        req.stepUpSession = {
          sessionId,
          projectId: sessionData.payload[0].projectId,
          userId: sessionData.payload[0].userId,
          action: sessionData.payload[0].action,
          role: sessionData.payload[0].role,
        };
        console.log(`[StepUpAuth] Optional session verified: ${sessionId}`);
      }
    } catch (error) {
      console.error(
        '[StepUpAuth] Optional session verification failed:',
        error
      );
    }
  }

  next();
};
