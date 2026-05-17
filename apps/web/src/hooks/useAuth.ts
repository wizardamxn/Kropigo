import { useAppSelector } from '../store/hooks';

export const useAuth = () => {
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    isInitialized,
    role: user?.role,
    location: user?.location,
    isVerified: user?.isVerified,
    hasCompletedProfile: !!user?.name,
  };
};