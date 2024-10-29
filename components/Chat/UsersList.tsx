"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";

interface UsersListProps {
  users: string[];
}

export function UsersList({ users }: UsersListProps) {
  return (
    <Card className="p-4 bg-white/10 backdrop-blur-lg">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Online Users ({users.length})</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user}
              className="px-3 py-2 rounded-md bg-secondary/50 text-sm"
            >
              {user}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
}