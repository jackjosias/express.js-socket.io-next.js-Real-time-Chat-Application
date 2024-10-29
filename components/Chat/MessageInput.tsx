"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MessageInput({
  message,
  onMessageChange,
  onSubmit,
}: MessageInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit" disabled={!message.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}