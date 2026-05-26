import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "@/core/domain/entities/message";

export type { Message };

interface ChatState {
  selectedUserId: string | null;
  messages: Record<string, Message[]>;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  selectedUserId: null,
  messages: {},
  currentUserId: null,
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    selectUser: (state, action: PayloadAction<string>) => {
      state.selectedUserId = action.payload;
      if (!state.messages[action.payload]) {
        state.messages[action.payload] = [];
      }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const { senderId, receiverId } = action.payload;
      const currentUser = state.currentUserId;
      const otherUserId = senderId === currentUser ? receiverId : senderId;
      if (!state.messages[otherUserId]) {
        state.messages[otherUserId] = [];
      }
      const messageExists = state.messages[otherUserId].some(
        (message) => message.id === action.payload.id
      );
      if (!messageExists) {
        state.messages[otherUserId].push(action.payload);
      }
    },
    setCurrentUserId: (state, action: PayloadAction<string | null>) => {
      state.currentUserId = action.payload;
    },
  },
});

export const { selectUser, addMessage, setCurrentUserId } = chatSlice.actions;

export default chatSlice.reducer;
