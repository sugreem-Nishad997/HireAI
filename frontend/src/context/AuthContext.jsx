import { createContext, useContext, useState } from 'react';
import { authApi, TOKEN_STORAGE_KEY } from '../api/client';

const USER_STORAGE_KEY = 'hireai_user';
const AuthContext = createContext(null);

const getStoredAuth = () => {
  for (const storage of [localStorage, sessionStorage]) {
    const token = storage.getItem(TOKEN_STORAGE_KEY);
    const serializedUser = storage.getItem(USER_STORAGE_KEY);

    if (token && serializedUser) {
      try {
        const user = JSON.parse(serializedUser);
        if (user && typeof user === 'object' && user.id) {
          return {token, user};
        }
      } catch {
        // Clear invalid persisted auth data below.
      }
    }

    storage.removeItem(TOKEN_STORAGE_KEY);
    storage.removeItem(USER_STORAGE_KEY);
  }

  return {token: null, user: null};
};

const getSafeUser = (user) => {
  const { _id, id, name, email, role } = user;
  const displayName = name || '';

  return {
    id: String(_id || id),
    _id: String(_id || id),
    name: displayName,
    email,
    role,
    initials: displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  };
};

export const AuthProvider = ({ children }) => {
  const [storedAuth, setStoredAuth] = useState(getStoredAuth);
  const [user, setUserState] = useState(storedAuth.user);
  const [activePortal, setActivePortal] = useState('hireai');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const setUser = (nextUser) => {
    const updatedUser = typeof nextUser === 'function'
      ? nextUser(user)
      : nextUser;
    const safeUser = updatedUser ? getSafeUser(updatedUser) : null;
    const storage = localStorage.getItem(TOKEN_STORAGE_KEY)
      ? localStorage
      : sessionStorage;

    if (safeUser) {
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }

    setUserState(safeUser);
  };

  const login = async (email, password, rememberMe = false) => {
    let result;
    try {
      ({data: result} = await authApi.login({email, password}));
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Unable to sign in.',
        {cause: error},
      );
    }

    if (!result.token || !result.existingUser) {
      throw new Error('The server response is missing login credentials.');
    }

    const authenticatedUser = getSafeUser(result.existingUser);
    const storage = rememberMe ? localStorage : sessionStorage;

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    storage.setItem(TOKEN_STORAGE_KEY, result.token);
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));

    setStoredAuth({token: result.token, user: authenticatedUser});
    setUserState(authenticatedUser);
    setFeedbackMessage('Logged in successfully.');

    return authenticatedUser;
  };

  const register = async (name, email, password, role = 'candidate', otp = '') => {
    try {
      await authApi.register({name, email, password, role, otp});
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Unable to register.',
        {cause: error},
      );
    }
    const authenticatedUser = await login(email, password);
    setFeedbackMessage('Account created and logged in successfully.');
    return authenticatedUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    setStoredAuth({token: null, user: null});
    setUserState(null);
    setFeedbackMessage('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: Boolean(storedAuth.token),
        activePortal,
        setActivePortal,
        feedbackMessage,
        setFeedbackMessage,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
