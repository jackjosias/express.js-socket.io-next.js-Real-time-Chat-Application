import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useGetMessagesQuery } from '@/store/api/chatApi';

interface ChatWindowProps {
  selectedUser: {
    id: string;
    username: string;
    isOnline: boolean;
    lastSeenAt: string;
  } | undefined;
  currentUserId: string;
  messageInput: string;
  setMessageInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

type Message = import('@/store/slices/chatSlice').Message;

export default function ChatWindow({ selectedUser, currentUserId, messageInput, setMessageInput, handleSendMessage }: ChatWindowProps) {
  const { data: historicalMessages, isLoading } = useGetMessagesQuery(selectedUser?.id || '', {
    skip: !selectedUser?.id
  });

  const realtimeMessages = useAppSelector(state => state.chat.messages[selectedUser?.id || ''] || []);

  const allMessages = historicalMessages
    ? [...historicalMessages, ...realtimeMessages.filter((realtimeMsg: Message) => !historicalMessages.some(histMsg => histMsg.id === realtimeMsg.id))]
    : realtimeMessages;

  const sortedMessages = allMessages.toSorted((a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center">
        <div className="flex items-center flex-1">
          <div className="relative mr-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
              selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}></span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedUser.username}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedUser.isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {sortedMessages.map((message: Message) => {
              const isMine = message.senderId === currentUserId;
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow'
                  }`}>
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 text-right ${
                      isMine ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <form className="flex space-x-2" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
