import { GraphQLFormattedError } from 'graphql';

const REFINE_TOKEN_KEY = 'refine_access_token';

type Error = {
  message: string;
  statusCode: string;
};

/**
 * Custom fetch wrapper for GraphQL requests
 * Uses Refine demo API token from localStorage
 */
const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem(REFINE_TOKEN_KEY);
  const headers = options.headers as Record<string, string>;

  return await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
      'Apollo-Require-Preflight': 'true',
    },
  });
};

const getGraphQLErrors = (
  body: Record<'errors', GraphQLFormattedError[] | undefined>,
): Error | null => {
  if (!body) {
    return {
      message: 'Unknown error',
      statusCode: 'INTERNAL_SERVER_ERROR',
    };
  }

  if ('errors' in body) {
    const errors = body?.errors;

    const messages = errors?.map((error) => error?.message)?.join('');
    const code = errors?.[0]?.extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500,
    };
  }

  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);

  const responseClone = response.clone();
  const body = await responseClone.json();

  const error = getGraphQLErrors(body);

  if (error) {
    throw error;
  }

  return response;
};
