'use client';

import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/store/endpoints/authApi';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '@/store/slices/authSlice';

export default function KisanDashboard() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(logoutAction());
      router.push('/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name || 'Kisan'}!</h1>
      <p className="text-gray-600 mb-6">This is your main dashboard.</p>
      
      <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
        <h2 className="font-semibold text-green-800">Your Profile</h2>
        <ul className="text-sm mt-2 space-y-1">
          <li><strong>Phone:</strong> {user?.phone}</li>
          <li><strong>Role:</strong> {user?.role}</li>
          <li><strong>Status:</strong> {user?.isVerified ? 'Verified ✓' : 'Pending Verification ⏳'}</li>
        </ul>
      </div>

      <button 
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
