"use client";

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JoinForm } from './JoinForm';
import { UsersList } from './UsersList';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { Message, UserJoinedData, UserLeftData } from './types';

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);

    const handleConnect = () => {
      console.log('Connected to server');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    };

    const handleMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);
    
    const handleUserJoined = (data: UserJoinedData) => {
      setUsers(data.users);
      setMessages((prev) => [
        ...prev,
        {
          username: 'System',
          message: `${data.username} has joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const handleUserLeft = (data: UserLeftData) => {
      setUsers(data.users);
      if (data.username) {
        setMessages((prev) => [
          ...prev,
          {
            username: 'System',
            message: `${data.username} has left the chat`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('message', handleMessage);
    newSocket.on('userJoined', handleUserJoined);
    newSocket.on('userLeft', handleUserLeft);

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.off('message', handleMessage);
      newSocket.off('userJoined', handleUserJoined);
      newSocket.off('userLeft', handleUserLeft);
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit('join', username);
      setIsConnected(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('message', { message });
      setMessage('');
    }
  };

  if (!isConnected || !username) {
    return (
      <JoinForm
        username={username}
        onUsernameChange={setUsername}
        onSubmit={handleJoin}
      />
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
      <UsersList users={users} />

      <Card className="col-span-3 p-4 bg-white/10 backdrop-blur-lg flex flex-col">
        <ScrollArea className="flex-grow mb-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={`${msg.username}-${index}-${msg.timestamp}`}
                message={msg}
                currentUsername={username}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <MessageInput
          message={message}
          onMessageChange={setMessage}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}