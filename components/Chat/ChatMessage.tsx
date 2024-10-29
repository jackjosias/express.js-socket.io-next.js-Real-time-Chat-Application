"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
  currentUsername: string;
}

export function ChatMessage({ message, currentUsername }: ChatMessageProps) {
  const isCurrentUser = message.username === currentUsername;
  const isSystem = message.username === "System";

  return (
    <div
      className={cn("flex", {
        "justify-end": isCurrentUser,
        "justify-center": isSystem,
        "justify-start": !isCurrentUser && !isSystem,
      })}
    >
      <div
        className={cn("max-w-[80%] rounded-lg px-4 py-2", {
          "bg-primary text-primary-foreground": isCurrentUser,
          "bg-muted text-muted-foreground text-sm": isSystem,
          "bg-secondary": !isCurrentUser && !isSystem,
        })}
      >
        {!isSystem && (
          <div className="text-sm font-medium mb-1">
            {isCurrentUser ? "You" : message.username}
          </div>
        )}
        <div className="break-words">{message.message}</div>
        <div className="text-xs mt-1 opacity-70">
          {format(new Date(message.timestamp), "HH:mm")}
        </div>
      </div>
    </div>
  );
}