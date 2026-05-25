'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation, useLogoutMutation } from '@/store/endpoints/authApi';
import { useAppDispatch } from '@/store/hooks';
import { clearUser, updateUser } from '@/store/slices/authSlice';
import { disconnectSocket } from '@/lib/socket';

export default function KisanProfile() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setLocation(user.location ?? '');
    setProfilePhoto(user.profilePhoto ?? '');
  }, [user]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await updateProfile({ name, role: user!.role, location, profilePhoto }).unwrap();
      dispatch(updateUser({ name, location, profilePhoto }));
      setMessage('Profile updated successfully.');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (e) {
      console.error('Logout request failed, proceeding with local clearing', e);
    } finally {
      disconnectSocket();
      sessionStorage.removeItem('accessToken');
      dispatch(clearUser());
      router.replace('/login');
    }
  };

  // Helper for consistent input styling
  const inputBaseClass = "h-12 w-full rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all shadow-sm";
  const labelBaseClass = "block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-1.5 ml-1";

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          Profile Settings
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-lg">
          Manage your account details and public presence.
        </p>
      </div>

      {/* Alerts */}
      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 flex gap-3 shadow-sm animate-in slide-in-from-top-2">
          <svg className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-sans text-sm font-medium text-green-800 dark:text-green-300">{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex gap-3 shadow-sm animate-in slide-in-from-top-2">
          <svg className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="font-sans text-sm font-medium text-red-800 dark:text-red-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: Account Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center text-center">
            
            {/* Avatar Display */}
            <div className="w-24 h-24 rounded-full bg-stone-100 dark:bg-stone-800 border-4 border-white dark:border-stone-900 shadow-sm overflow-hidden mb-4 flex items-center justify-center text-stone-400">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              )}
            </div>
            
            <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">{user?.name || 'Farmer User'}</h2>
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mb-4 capitalize">{user?.role}</p>
            
            {user?.isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-sans text-xs font-medium border border-blue-200 dark:border-blue-800/50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Verified Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-sans text-xs font-medium border border-amber-200 dark:border-amber-800/50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Pending Verification
              </span>
            )}

            <div className="w-full mt-6 space-y-3 text-left border-t border-stone-100 dark:border-stone-800 pt-6">
              <div>
                <span className="block text-xs font-sans text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">Email Address</span>
                <span className="block font-sans text-sm font-medium text-stone-800 dark:text-stone-200">{user?.email}</span>
              </div>
              <div>
                <span className="block text-xs font-sans text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">Phone Number</span>
                <span className="block font-sans text-sm font-medium text-stone-800 dark:text-stone-200">{user?.phone}</span>
              </div>
            </div>

          </section>

          {/* Danger Zone */}
          <section className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
            <h3 className="font-sans font-semibold text-stone-800 dark:text-stone-200">Session Management</h3>
            <button 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="h-12 w-full rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-sans font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {isLoggingOut ? 'Logging out...' : 'Sign Out Securely'}
            </button>
          </section>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
              Edit Public Information
            </h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="name" className={labelBaseClass}>Full Name *</label>
                <input 
                  id="name" 
                  type="text" 
                  minLength={2} 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Your full name"
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label htmlFor="location" className={labelBaseClass}>Primary Location</label>
                <input 
                  id="location" 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Jabalpur, MP"
                  className={inputBaseClass}
                />
                <p className="text-xs text-stone-500 mt-1.5 ml-1">This helps local buyers find you more easily.</p>
              </div>

              <div>
                <label htmlFor="profilePhoto" className={labelBaseClass}>Profile Photo URL</label>
                <input 
                  id="profilePhoto" 
                  type="url" 
                  value={profilePhoto} 
                  onChange={(e) => setProfilePhoto(e.target.value)} 
                  placeholder="https://example.com/your-photo.jpg"
                  className={inputBaseClass}
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-12 px-8 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

      </div>
    </div>
  );
}