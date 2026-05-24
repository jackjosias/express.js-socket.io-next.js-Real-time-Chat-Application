import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 🧬 CORRIGÉ: État initial maintenant totalement neutre et compatible SSR.
// La lecture du localStorage est déléguée à un composant client pour éviter les mismatches d'hydratation.
const initialState: AuthState = {
  token: null,
  userId: null,
  username: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; userId: string; username: string }>
    ) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.error = null;
      // Persister l'état dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('userId', action.payload.userId);
        localStorage.setItem('username', action.payload.username);
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.username = null;
      state.isAuthenticated = false;
      // Nettoyer localStorage lors de la déconnexion
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    // 🧬 NOUVEAU: Action pour réhydrater l'état côté client
    rehydrateAuthState: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        if (token && userId && username) {
          state.token = token;
          state.userId = userId;
          state.username = username;
          state.isAuthenticated = true;
        }
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  clearError,
  rehydrateAuthState,
} = authSlice.actions;

export default authSlice.reducer;