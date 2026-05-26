import { useEffect, useMemo, useRef } from "react";
import type { FormEvent } from "react";
import type { Message } from "@/core/domain/entities/message";
import type { User } from "@/core/domain/entities/user";
import { useAppSelector } from "@/core/infrastructure/store";
import { useGetMessagesQuery } from "@/core/infrastructure/store/api/chatApi";

interface ChatWindowProps {
  selectedUser: User | undefined;
  currentUserId: string;
  messageInput: string;
  setMessageInput: (value: string) => void;
  handleSendMessage: (event: FormEvent<HTMLFormElement>) => void;
}

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mergeMessages(
  historicalMessages: Message[] | undefined,
  realtimeMessages: Message[]
) {
  const historical = historicalMessages ?? [];
  const historicalIds = new Set(historical.map((message) => message.id));
  const mergedMessages = [
    ...historical,
    ...realtimeMessages.filter((message) => !historicalIds.has(message.id)),
  ];

  return mergedMessages.sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export default function ChatWindow({
  selectedUser,
  currentUserId,
  messageInput,
  setMessageInput,
  handleSendMessage,
}: ChatWindowProps) {
  const { data: historicalMessages, isLoading } = useGetMessagesQuery(
    selectedUser?.id || "",
    { skip: !selectedUser?.id }
  );
  const realtimeMessages = useAppSelector(
    (state) => state.chat.messages[selectedUser?.id || ""] || []
  );
  const sortedMessages = useMemo(
    () => mergeMessages(historicalMessages, realtimeMessages),
    [historicalMessages, realtimeMessages]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages]);

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 bg-white p-4">
        <div className="flex flex-1 items-center">
          <div className="relative mr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-600">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            <span
              className={
                "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white " +
                (selectedUser.isOnline ? "bg-green-500" : "bg-gray-400")
              }
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedUser.username}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedUser.isOnline ? "En ligne" : "Hors ligne"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {sortedMessages.map((message) => {
              const isMine = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={"flex " + (isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={
                      "max-w-xs rounded-lg px-4 py-2 md:max-w-md lg:max-w-lg " +
                      (isMine
                        ? "rounded-br-none bg-indigo-600 text-white"
                        : "rounded-bl-none bg-white text-gray-800 shadow")
                    }
                  >
                    <p>{message.content}</p>
                    <p
                      className={
                        "mt-1 text-right text-xs " +
                        (isMine ? "text-indigo-200" : "text-gray-500")
                      }
                    >
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

      <div className="border-t border-gray-200 bg-white p-4">
        <form className="flex space-x-2" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
