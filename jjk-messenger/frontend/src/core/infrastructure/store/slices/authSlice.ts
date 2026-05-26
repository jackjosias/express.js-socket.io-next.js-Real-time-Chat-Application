import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession } from "@/core/domain/types/auth";

export interface AuthState {
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  userId: null,
  username: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const applySession = (state: AuthState, session: AuthSession): void => {
  state.isLoading = false;
  state.isAuthenticated = true;
  state.userId = session.userId;
  state.username = session.username;
  state.error = null;
};

const clearSession = (state: AuthState): void => {
  state.userId = null;
  state.username = null;
  state.isAuthenticated = false;
  state.isLoading = false;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AuthSession>) => {
      applySession(state, action.payload);
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
    authSessionLoaded: (state, action: PayloadAction<AuthSession | null>) => {
      if (action.payload) {
        applySession(state, action.payload);
        return;
      }
      clearSession(state);
    },
    logout: (state) => {
      clearSession(state);
    },
    clearError: (state) => {
      state.error = null;
    },
    rehydrateAuthState: (state, action: PayloadAction<AuthSession | null>) => {
      if (action.payload) {
        applySession(state, action.payload);
        return;
      }
      clearSession(state);
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
  authSessionLoaded,
  logout,
  clearError,
  rehydrateAuthState,
} = authSlice.actions;

export default authSlice.reducer;
