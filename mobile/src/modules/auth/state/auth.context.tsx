import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { authReducer, initialState, AuthState } from './auth.reducer';
import authApi, { LoginDto, RegisterDto } from '../api/auth.api';
import { TokenStore } from '../../../core/storage/secure-store';

function getAuthErrorMessage(err: any, fallback: string): string {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  // Axios network errors have no response and usually indicate API down or CORS rejection.
  if (err?.code === 'ERR_NETWORK' || /Network Error/i.test(err?.message || '')) {
    return 'Unable to reach the server. Check API URL, backend status, and CORS settings.';
  }

  return fallback;
}

interface AuthContextValue extends AuthState {
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Restore session on app launch ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const token = await TokenStore.getAccessToken();
        if (token) {
          const user = await authApi.getMe();
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        await TokenStore.clearTokens();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authApi.login(dto);
      dispatch({ type: 'SET_USER', payload: res.data.user });
    } catch (err: any) {
      const message = getAuthErrorMessage(err, 'Login failed. Please try again.');
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  const register = useCallback(async (dto: RegisterDto) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authApi.register(dto);
      dispatch({ type: 'SET_USER', payload: res.data.user });
    } catch (err: any) {
      const message = getAuthErrorMessage(err, 'Registration failed. Please try again.');
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authApi.logout();
    } finally {
      dispatch({ type: 'CLEAR_USER' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout, clearError }),
    [state, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
