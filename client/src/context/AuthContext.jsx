import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage on app boot
    const storedToken = localStorage.getItem('ws_token');
    const storedUser = localStorage.getItem('ws_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginUser = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('ws_token', newToken);
    localStorage.setItem('ws_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ws_token');
    localStorage.removeItem('ws_user');
  };

  const updateProfile = (updatedData) => {
    setUser(prev => {
      const newProfile = { ...prev, ...updatedData };
      localStorage.setItem('ws_user', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
