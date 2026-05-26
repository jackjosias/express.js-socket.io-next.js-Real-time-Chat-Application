"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { clearLegacyAuthStorage } from "@/core/infrastructure/browser/authStorage";
import { retainAuthenticatedSocket } from "@/core/infrastructure/realtime/socketClient";
import { useAppDispatch, useAppSelector } from "@/core/infrastructure/store";
import { useLogoutSessionMutation } from "@/core/infrastructure/store/api/authApi";
import {
  useGetUsersQuery,
  useSendMessageMutation,
} from "@/core/infrastructure/store/api/chatApi";
import { logout } from "@/core/infrastructure/store/slices/authSlice";
import { selectUser, setCurrentUserId } from "@/core/infrastructure/store/slices/chatSlice";
import { useIsClient } from "@/core/presentation/hooks/common/useIsClient";

export function useDashboardViewModel() {
  const isClient = useIsClient();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendMessageMutation] = useSendMessageMutation();
  const [logoutSession] = useLogoutSessionMutation();
  const { isAuthenticated, isLoading, userId, username } = useAppSelector(
    (state) => state.auth
  );
  const { selectedUserId } = useAppSelector((state) => state.chat);
  const {
    data: usersResult,
    error: usersError,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useGetUsersQuery(undefined, {
    skip: !isAuthenticated,
  });

  const users = useMemo(
    () => (Array.isArray(usersResult) ? usersResult : []),
    [usersResult]
  );
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [selectedUserId, users]
  );

  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isClient, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current = null;
      return;
    }

    const retainedSocket = retainAuthenticatedSocket();
    socketRef.current = retainedSocket.socket;

    return () => {
      socketRef.current = null;
      retainedSocket.release();
    };
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    void logoutSession().unwrap().catch(() => undefined);
    clearLegacyAuthStorage();
    dispatch(logout());
    dispatch(setCurrentUserId(null));
    router.push("/login");
  }, [dispatch, logoutSession, router]);

  const handleSelectUser = useCallback(
    (nextUserId: string) => {
      dispatch(selectUser(nextUserId));
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    (content: string, receiverId: string) => {
      const trimmedContent = content.trim();

      if (!trimmedContent || !socketRef.current?.connected) {
        return;
      }

      socketRef.current.emit("sendMessage", {
        content: trimmedContent,
        receiverId,
      });
      sendMessageMutation({ content: trimmedContent, receiverId });
    },
    [sendMessageMutation]
  );

  const handleSendMessage = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedUserId) {
        return;
      }

      sendMessage(messageInput, selectedUserId);
      setMessageInput("");
    },
    [messageInput, selectedUserId, sendMessage]
  );

  return {
    currentUserId: userId ?? "",
    handleLogout,
    handleSelectUser,
    handleSendMessage,
    isClient,
    isUsersLoading,
    messageInput,
    refetchUsers,
    selectedUser,
    selectedUserId,
    setMessageInput,
    username,
    users,
    usersError: usersError ? "Erreur lors du chargement des utilisateurs" : null,
  };
}
