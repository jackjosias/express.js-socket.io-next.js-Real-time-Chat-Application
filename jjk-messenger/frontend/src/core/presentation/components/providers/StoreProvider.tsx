"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { clearLegacyAuthStorage } from "@/core/infrastructure/browser/authStorage";
import { makeStore, useAppDispatch, useAppSelector } from "@/core/infrastructure/store";
import { useGetSessionQuery } from "@/core/infrastructure/store/api/authApi";
import { authSessionLoaded } from "@/core/infrastructure/store/slices/authSlice";
import { setCurrentUserId } from "@/core/infrastructure/store/slices/chatSlice";

function AuthSessionBootstrap() {
  const dispatch = useAppDispatch();
  const { data, isError, isSuccess } = useGetSessionQuery();

  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(authSessionLoaded(data));
      dispatch(setCurrentUserId(data.userId));
    }
  }, [data, dispatch, isSuccess]);

  useEffect(() => {
    if (isError) {
      dispatch(authSessionLoaded(null));
      dispatch(setCurrentUserId(null));
    }
  }, [dispatch, isError]);

  return null;
}

function AuthChatSync() {
  const dispatch = useAppDispatch();
  const authUserId = useAppSelector((state) => state.auth.userId);
  const chatUserId = useAppSelector((state) => state.chat.currentUserId);

  useEffect(() => {
    if (chatUserId !== authUserId) {
      dispatch(setCurrentUserId(authUserId));
    }
  }, [authUserId, chatUserId, dispatch]);

  return null;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthSessionBootstrap />
      <AuthChatSync />
      {children}
    </Provider>
  );
}
