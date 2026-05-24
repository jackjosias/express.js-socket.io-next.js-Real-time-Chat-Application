'use client';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';
import { io, Socket } from 'socket.io-client';

// Définition des types
interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeenAt: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt: string | null;
}

interface SendMessageRequest {
  receiverId: string;
  content: string;
}

function hasUsersResponse(response: unknown): response is { users: User[] } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'users' in response &&
    Array.isArray((response as { users?: unknown }).users)
  );
}

function hasMessagesResponse(response: unknown): response is { messages: Message[] } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'messages' in response &&
    Array.isArray((response as { messages?: unknown }).messages)
  );
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api`
      : 'http://localhost:3002/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      transformResponse: (response: unknown) => {
        if (hasUsersResponse(response)) {
          return response.users;
        }
        console.warn(
          "API /users did not return expected format (object with users array), received:",
          response
        );
        return [];
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheEntryRemoved, getState }
      ) {
        const state = getState() as RootState;
        const token = state.auth.token;
        if (!token) return;
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!, {
          auth: { token },
        });
        socket.on('connect', () =>
          console.log('[RTK-WS] Socket.IO connecté pour les statuts')
        );
        socket.on('userStatusUpdate', (userStatus: User) => {
          console.log('[RTK-WS] Mise à jour statut reçue:', userStatus);
          updateCachedData((draft) => {
            const user = draft.find((u) => u.id === userStatus.id);
            if (user) {
              user.isOnline = userStatus.isOnline;
              user.lastSeenAt = userStatus.lastSeenAt;
            }
          });
        });
        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),
    getMessages: builder.query<Message[], string>({
      query: (userId) => `/messages/${userId}`,
      transformResponse: (response: unknown) => {
        if (hasMessagesResponse(response)) {
          return response.messages;
        }
        return [];
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheEntryRemoved, getState }
      ) {
        const state = getState() as RootState;
        const token = state.auth.token;
        if (!token) return;
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!, {
          auth: { token },
        });
        socket.on('connect', () =>
          console.log('[RTK-WS] Socket.IO connecté pour les messages')
        );
        socket.on('newMessage', (message: Message) => {
          console.log('[RTK-WS] Nouveau message reçu:', message);
          updateCachedData((draft) => {
            if (!draft.some((m) => m.id === message.id)) {
              draft.push(message);
            }
          });
        });
        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),
    sendMessage: builder.mutation<void, SendMessageRequest>({
      // Corrige l'erreur "queryFn returned an object containing neither a valid error and result".
      // Utilise `query` pour déclencher un appel API via le baseQuery.
      query: (messageDetails) => ({
        url: '/messages',
        method: 'POST',
        body: messageDetails,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;
