"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import type { Message } from "@/core/domain/entities/message";
import type { User } from "@/core/domain/entities/user";
import type { MessagesResponse, SendMessageRequest, UsersResponse } from "@/core/domain/types/chat";
import { getRestApiBaseUrl } from "@/core/infrastructure/config/api";
import { retainAuthenticatedSocket } from "@/core/infrastructure/realtime/socketClient";
import { createBaseQueryWithReauth } from "@/core/infrastructure/store/api/baseQuery";

function hasUsersResponse(response: unknown): response is UsersResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "users" in response &&
    Array.isArray((response as { users?: unknown }).users)
  );
}

function hasMessagesResponse(response: unknown): response is MessagesResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "messages" in response &&
    Array.isArray((response as { messages?: unknown }).messages)
  );
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: createBaseQueryWithReauth(getRestApiBaseUrl()),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      transformResponse: (response: unknown) => {
        if (hasUsersResponse(response)) {
          return response.users;
        }
        return [];
      },
      async onCacheEntryAdded(_arg, { updateCachedData, cacheEntryRemoved }) {
        const retainedSocket = retainAuthenticatedSocket();
        const handleUserStatusUpdate = (userStatus: User) => {
          updateCachedData((draft) => {
            const user = draft.find((candidate) => candidate.id === userStatus.id);
            if (user) {
              user.isOnline = userStatus.isOnline;
              user.lastSeenAt = userStatus.lastSeenAt;
            }
          });
        };

        retainedSocket.socket.on("userStatusUpdate", handleUserStatusUpdate);

        try {
          await cacheEntryRemoved;
        } finally {
          retainedSocket.socket.off("userStatusUpdate", handleUserStatusUpdate);
          retainedSocket.release();
        }
      },
    }),
    getMessages: builder.query<Message[], string>({
      query: (userId) => "/messages/" + userId,
      transformResponse: (response: unknown) => {
        if (hasMessagesResponse(response)) {
          return response.messages;
        }
        return [];
      },
      async onCacheEntryAdded(_arg, { updateCachedData, cacheEntryRemoved }) {
        const retainedSocket = retainAuthenticatedSocket();
        const handleNewMessage = (message: Message) => {
          updateCachedData((draft) => {
            if (!draft.some((candidate) => candidate.id === message.id)) {
              draft.push(message);
            }
          });
        };

        retainedSocket.socket.on("newMessage", handleNewMessage);

        try {
          await cacheEntryRemoved;
        } finally {
          retainedSocket.socket.off("newMessage", handleNewMessage);
          retainedSocket.release();
        }
      },
    }),
    sendMessage: builder.mutation<void, SendMessageRequest>({
      queryFn: () => ({ data: undefined }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;
