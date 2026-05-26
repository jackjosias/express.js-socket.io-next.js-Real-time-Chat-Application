import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { chatApi } from "./api/chatApi";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import userReducer from "./slices/userSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      users: userReducer,
      chat: chatReducer,
      [authApi.reducerPath]: authApi.reducer,
      [chatApi.reducerPath]: chatApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, chatApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export { useAppDispatch, useAppSelector, useAppStore } from "./hooks";
