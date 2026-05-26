import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/core/domain/entities/user";

export type { User };

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<User[]>) => {
      state.isLoading = false;
      state.users = action.payload;
      state.error = null;
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateUserStatus: (
      state,
      action: PayloadAction<{ userId: string; isOnline: boolean; lastSeenAt: string }>
    ) => {
      const { userId, isOnline, lastSeenAt } = action.payload;
      const user = state.users.find((candidate) => candidate.id === userId);
      if (user) {
        user.isOnline = isOnline;
        user.lastSeenAt = lastSeenAt;
      }
    },
    addUser: (state, action: PayloadAction<User>) => {
      const userExists = state.users.some((user) => user.id === action.payload.id);
      if (!userExists) {
        state.users.push(action.payload);
      }
    },
  },
});

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  updateUserStatus,
  addUser,
} = userSlice.actions;

export default userSlice.reducer;
