import { useAppSelector } from '../store/hooks';

export const useAuth = () => {
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    accessToken,
    role: user?.role,
    location: user?.location,
    isVerified: user?.isVerified,
    hasCompletedProfile: !!user?.name,
  };
};
