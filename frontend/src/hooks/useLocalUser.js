import { useState, useEffect } from 'react';

/**
 * Hook to sync component with localStorage user data
 * Listens for manual updates from Profile page
 * Returns the latest user data from localStorage or props user
 */
export const useLocalUser = (propUser) => {
  const [localUser, setLocalUser] = useState(propUser);

  useEffect(() => {
    // Update on mount from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.id) {
      setLocalUser(storedUser);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'user' || !e.key) {
        const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (updatedUser && updatedUser.id) {
          setLocalUser(updatedUser);
        }
      }
    };

    const handleUserUpdated = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (updatedUser && updatedUser.id) {
        setLocalUser(updatedUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, []);

  return localUser && localUser.id ? localUser : propUser;
};
