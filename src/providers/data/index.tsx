import graphqlDataProvider, {
  GraphQLClient,
  liveProvider as graphqlLiveProvider,
} from '@refinedev/nestjs-query';
import { createClient } from 'graphql-ws';
import { fetchWrapper } from './fetch-wrapper';

export const API_BASE_URL = 'https://api.crm.refine.dev';
export const API_URL = `${API_BASE_URL}/graphql`;
export const WS_URL = 'wss://api.crm.refine.dev/graphql';

export const client = new GraphQLClient(API_URL, {
  fetch: (url: string, options: RequestInit) => {
    try {
      return fetchWrapper(url, options);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  },
});

const REFINE_TOKEN_KEY = 'refine_access_token';

export const wsClient =
  typeof window !== 'undefined'
    ? createClient({
        url: WS_URL,
        connectionParams: () => {
          // Use Refine demo API token from localStorage
          const accessToken = localStorage.getItem(REFINE_TOKEN_KEY);
          return {
            headers: {
              ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
          };
        },
      })
    : undefined;

export const dataProvider = graphqlDataProvider(client);
export const liveProvider = wsClient ? graphqlLiveProvider(wsClient) : undefined;
