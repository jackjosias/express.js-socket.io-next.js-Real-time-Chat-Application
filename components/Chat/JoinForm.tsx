"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface JoinFormProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function JoinForm({ username, onUsernameChange, onSubmit }: JoinFormProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center space-y-4">
          <MessageSquare className="w-12 h-12 text-primary" />
          <h2 className="text-2xl font-bold text-center">Join the Chat</h2>
          <form onSubmit={onSubmit} className="w-full space-y-4">
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="w-full"
              required
              minLength={2}
              maxLength={20}
            />
            <Button type="submit" className="w-full">
              Join Chat
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}