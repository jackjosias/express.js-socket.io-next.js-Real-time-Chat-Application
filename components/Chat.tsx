"use client";

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface Message {
  username: string;
  message: string;
  timestamp: string;
}

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('userJoined', (data: { username: string; users: string[] }) => {
      setUsers(data.users);
      setMessages((prev) => [
        ...prev,
        {
          username: 'System',
          message: `${data.username} has joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    newSocket.on('userLeft', (data: { username: string; users: string[] }) => {
      setUsers(data.users);
      setMessages((prev) => [
        ...prev,
        {
          username: 'System',
          message: `${data.username} has left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    return () => {
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
      <Card className="p-6 max-w-md mx-auto bg-white/10 backdrop-blur-lg">
        <form onSubmit={handleJoin} className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Join the Chat
          </h2>
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-white/5"
          />
          <Button type="submit" className="w-full">
            Join
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
      <Card className="col-span-1 p-4 bg-white/10 backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="font-semibold">Online Users</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user}
                className="px-3 py-2 rounded-md bg-white/5 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {user}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Card>

      <Card className="col-span-3 p-4 bg-white/10 backdrop-blur-lg flex flex-col">
        <ScrollArea className="flex-grow mb-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.username === username
                    ? 'bg-blue-500/20 ml-auto'
                    : msg.username === 'System'
                    ? 'bg-gray-500/20 mx-auto text-center'
                    : 'bg-white/5'
                } max-w-[80%]`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{msg.username}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p>{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="bg-white/5"
          />
          <Button type="submit">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}