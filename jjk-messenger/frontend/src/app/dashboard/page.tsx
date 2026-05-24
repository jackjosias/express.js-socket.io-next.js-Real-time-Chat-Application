'use client';
import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser } from '@/store/slices/chatSlice';
import { useGetUsersQuery, useSendMessageMutation } from '@/store/api/chatApi';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';
import UserList from '../../components/chat/UserList';
import ChatWindow from '../../components/chat/ChatWindow';
import type { RootState } from '@/store';
import { io, Socket } from 'socket.io-client';

const subscribeClientSnapshot = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function DashboardPage() {
  const isClient = useSyncExternalStore(
    subscribeClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, token, userId, username } = useAppSelector(
    (state: RootState) => state.auth
  );
  const { selectedUserId } = useAppSelector((state: RootState) => state.chat);
  const { data: users, isLoading, error } = useGetUsersQuery(undefined, {
    skip: !isAuthenticated || !token,
  });

  // 🧬 Remplacement de useWebSocket par une gestion via RTK Mutation et un socket local au composant
  const socketRef = useRef<Socket | null>(null);
  const [sendMessageMutation] = useSendMessageMutation();

  useEffect(() => {
    if (token) {
      const apiURL = process.env.NEXT_PUBLIC_API_URL!;
      socketRef.current = io(apiURL, { auth: { token } });
      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [token]);

  const sendMessage = (content: string, receiverId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', { content, receiverId });
      // Déclenche la mutation pour la cohérence (même si queryFn est vide), et pour d'éventuels side-effects futurs.
      sendMessageMutation({ content, receiverId });
    }
  };

  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (isClient && (!isAuthenticated || !token)) {
      router.push('/login');
    }
  }, [isClient, isAuthenticated, token, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && selectedUserId) {
      sendMessage(messageInput, selectedUserId);
      setMessageInput('');
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">JJK Messenger</h2>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">{username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <UserList
            users={users && Array.isArray(users) ? users : []}
            isLoading={isLoading}
            error={error ? 'Erreur lors du chargement des utilisateurs' : null}
            selectedUserId={selectedUserId}
            onSelectUser={(userId: string) => dispatch(selectUser(userId))}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <ChatWindow
            selectedUser={users?.find((user) => user.id === selectedUserId)}
            currentUserId={userId || ''}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500 p-8 max-w-md">
              <h3 className="text-2xl font-semibold mb-4">
                Bienvenue sur JJK Messenger
              </h3>
              <p className="text-lg mb-6">
                Sélectionnez un utilisateur dans la liste pour commencer à
                discuter
              </p>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <p className="text-sm text-gray-600">
                  Cette application de messagerie instantanée vous permet de
                  communiquer en temps réel avec d&apos;autres utilisateurs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
