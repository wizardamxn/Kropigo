const isProd = process.env.NODE_ENV === 'production';

const raw = process.env.NEXT_PUBLIC_API_URL;

if (isProd && !raw) {
  throw new Error('NEXT_PUBLIC_API_URL must be set in production');
}

const BASE_URL = raw ?? 'http://localhost:5000/api/v1';

export const API_URL = BASE_URL;

// Strip the /api/v1 suffix to get the socket origin
export const SOCKET_URL = (() => {
  try {
    return new URL(BASE_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
})();
