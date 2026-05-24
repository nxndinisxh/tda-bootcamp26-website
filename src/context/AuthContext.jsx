import React, { createContext, useState, useEffect, useContext } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded: clerkAuthLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  // domainError is set when the server rejects the session due to invalid email domain
  const [domainError, setDomainError] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!clerkAuthLoaded || !clerkUserLoaded) {
        return;
      }

      if (!isSignedIn || !clerkUser) {
        setUser(null);
        setToken(null);
        setIsOnboardingRequired(false);
        setDomainError(null);
        setLoading(false);
        return;
      }

      try {
        const clerkToken = await getToken();
        setToken(clerkToken);

        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${clerkToken}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsOnboardingRequired(false);
          setDomainError(null);
        } else if (res.status === 403) {
          // Server rejected this account due to email domain restriction
          const data = await res.json();
          setDomainError(data.message || 'Only learner.manipal.edu accounts are allowed.');
          setUser(null);
          setIsOnboardingRequired(false);
        } else if (res.status === 404) {
          const data = await res.json();
          if (data.onboardingRequired) {
            setIsOnboardingRequired(true);
            setUser(null);
            setDomainError(null);
          } else {
            setUser(null);
            setIsOnboardingRequired(false);
            setDomainError(null);
          }
        } else {
          console.error('Auth sync failed with status:', res.status);
          const errData = await res.text();
          console.error('Auth sync error data:', errData);
          setUser(null);
          // If it fails, assume they might need onboarding so they aren't kicked out
          setIsOnboardingRequired(true);
          setDomainError(null);
        }
      } catch (error) {
        console.error('Error syncing user with backend:', error);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isSignedIn, clerkUser, clerkAuthLoaded, clerkUserLoaded, getToken]);

  const onboard = async (domains, name) => {
    try {
      const clerkToken = await getToken();
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`
        },
        body: JSON.stringify({ domains, name })
      });

      const data = await res.json();
      if (!res.ok) {
        // Surface domain errors specially so Onboarding can show them
        if (res.status === 403 && data.domainError) {
          setDomainError(data.message);
        }
        throw new Error(data.message || 'Onboarding failed.');
      }

      setUser(data.user);
      setIsOnboardingRequired(false);
      setDomainError(null);
      return { success: true };
    } catch (error) {
      console.error('Onboarding failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setToken(null);
    setIsOnboardingRequired(false);
    setDomainError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading: loading || !clerkAuthLoaded || !clerkUserLoaded,
      isOnboardingRequired,
      domainError,
      onboard,
      logout,
      isSignedIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
