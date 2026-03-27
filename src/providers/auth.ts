import { AuthBindings } from '@refinedev/core';
import * as Transcodes from '@bigstrider/transcodes-sdk';

const REFINE_API_URL = 'https://api.crm.refine.dev/graphql';
const REFINE_TOKEN_KEY = 'refine_access_token';
/** Refine CRM numeric user id (for GraphQL `users` resource — not Transcodes member id) */
const REFINE_CRM_USER_ID_KEY = 'refine_crm_user_id';
const REFINE_DEMO_EMAIL = 'michael.scott@dundermifflin.com';

/**
 * Auth provider using Transcodes SDK
 * - Login/Logout/Check: Transcodes only
 * - getIdentity: Transcodes member for display; `id` must be Refine CRM `me.id` (integer)
 *   so GraphQL `users` resource (Account Settings, etc.) does not receive a Transcodes string id.
 * - Refine demo token: companies/tasks GraphQL
 */
export const authProvider: AuthBindings = {
  login: async () => {
    try {
      const response = await Transcodes.openAuthLoginModal({
        webhookNotification: true,
      });

      if (response.success && response.payload?.length > 0) {
        // Refine demo API token for companies/tasks data (optional)
        try {
          const refineRes = await fetch(REFINE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation { login(loginInput: { email: "${REFINE_DEMO_EMAIL}" }) { accessToken } }`,
            }),
          });
          const refineData = await refineRes.json();
          if (refineData.data?.login?.accessToken) {
            const accessToken = refineData.data.login.accessToken;
            localStorage.setItem(REFINE_TOKEN_KEY, accessToken);
            const meRes = await fetch(REFINE_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ query: `query { me { id } }` }),
            });
            const meData = await meRes.json();
            const meId = meData.data?.me?.id;
            if (meId != null) {
              localStorage.setItem(REFINE_CRM_USER_ID_KEY, String(meId));
            }
          }
        } catch {
          // Refine demo optional - Transcodes auth succeeded
        }
        return { success: true, redirectTo: '/' };
      }

      return { success: false, error: { message: 'Login failed', name: 'Error' } };
    } catch (error) {
      return { success: false, error: { message: 'Login failed', name: 'Error' } };
    }
  },

  logout: async () => {
    await Transcodes.signOut({ webhookNotification: true });
    localStorage.removeItem(REFINE_TOKEN_KEY);
    localStorage.removeItem(REFINE_CRM_USER_ID_KEY);
    return { success: true, redirectTo: '/login' };
  },

  onError: async (error) => {
    if (error.statusCode === 'UNAUTHENTICATED') {
      return { logout: true };
    }
    return { error };
  },

  check: async () => {
    const isAuth = await Transcodes.isAuthenticated();
    return isAuth ? { authenticated: true } : { authenticated: false, redirectTo: '/login' };
  },

  getIdentity: async () => {
    const member = await Transcodes.getCurrentMember();
    if (!member) return null;

    const token = localStorage.getItem(REFINE_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch(REFINE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: `query { me { id name email avatarUrl } }`,
          }),
        });
        const data = await res.json();
        const me = data.data?.me;
        if (me) {
          localStorage.setItem(REFINE_CRM_USER_ID_KEY, String(me.id));
          return {
            id: String(me.id),
            name: member.name ?? me.name,
            email: member.email ?? me.email,
            avatar: me.avatarUrl,
            avatarUrl: me.avatarUrl,
            transcodesId: member.id,
          };
        }
      } catch {
        // Refine me failed; avoid using Transcodes id as Refine user PK
      }
    }

    const storedCrmId = localStorage.getItem(REFINE_CRM_USER_ID_KEY);
    if (storedCrmId && /^\d+$/.test(storedCrmId)) {
      return {
        id: storedCrmId,
        name: member.name ?? member.email,
        email: member.email,
        avatar: undefined,
        avatarUrl: undefined,
        transcodesId: member.id,
      };
    }

    // Transcodes only: do not put member.id into `id` — Refine CRM expects integer PKs
    return {
      id: '',
      name: member.name ?? member.email,
      email: member.email,
      avatar: undefined,
      avatarUrl: undefined,
      transcodesId: member.id,
    };
  },
};
