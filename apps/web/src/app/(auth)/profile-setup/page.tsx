'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation } from '@/store/endpoints/authApi';

export default function ProfileSetupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  // role comes from the JWT already stored in Redux — no need to ask again
  const { isAuthenticated, hasCompletedProfile, role } = useAuth();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    // Already completed — skip to dashboard
    if (hasCompletedProfile && role) {
      router.replace(`/${role}/dashboard`);
    }
  }, [isAuthenticated, hasCompletedProfile, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // role is already set from registration; pass it through unchanged
      await updateProfile({ name, role: role!, location }).unwrap();
      // Sync Redux so RoleGuard picks up hasCompletedProfile = true immediately
      dispatch(updateUser({ name, location }));
      router.push(`/${role}/dashboard`);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to save profile. Please try again.');
    }
  };

  // Don't render while redirecting
  if (!isAuthenticated || hasCompletedProfile) return null;

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: 24 }}>
      <h1>Complete Your Profile</h1>
      <p>You're almost in — just tell us your name.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <div>
          <label htmlFor="name">Full Name *</label>
          <br />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Ramesh Kumar"
            disabled={isLoading}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div>
          <label htmlFor="location">Location (optional)</label>
          <br />
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nashik, Maharashtra"
            disabled={isLoading}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Saving...' : 'Enter the Marketplace'}
        </button>
      </form>
    </div>
  );
}
