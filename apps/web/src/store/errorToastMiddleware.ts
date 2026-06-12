import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';
import { toast } from 'sonner';

/**
 * Surfaces failed RTK Query *mutations* as toasts so users get feedback instead
 * of silent failures. Queries are skipped (they have their own inline error UI),
 * and the /auth/me 401 is ignored since "not logged in" is an expected state.
 */
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const meta: any = (action as any).meta;
    const endpointName = meta?.arg?.endpointName;
    const isMutation = meta?.arg?.type === 'mutation';

    // Only toast mutations; never the silent session probe.
    if (isMutation && endpointName !== 'getMe') {
      const payload: any = (action as any).payload;
      const message =
        payload?.data?.message ||
        payload?.error ||
        'Something went wrong. Please try again.';
      toast.error(message);
    }
  }

  return next(action);
};
