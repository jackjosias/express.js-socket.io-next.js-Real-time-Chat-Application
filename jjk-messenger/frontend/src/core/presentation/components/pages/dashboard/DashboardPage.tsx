"use client";

import ChatWindow from "@/core/presentation/components/chat/ChatWindow";
import UserList from "@/core/presentation/components/chat/UserList";
import { useDashboardViewModel } from "@/core/presentation/hooks/dashboard/useDashboardViewModel";

export default function DashboardPage() {
  const viewModel = useDashboardViewModel();

  if (!viewModel.isClient) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="flex w-1/4 min-w-72 flex-col overflow-hidden border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-800">JJK Messenger</h2>
          <div className="flex items-center gap-2">
            <span className="max-w-32 truncate text-sm text-gray-600">
              {viewModel.username}
            </span>
            <button
              type="button"
              onClick={viewModel.handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Deconnexion
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <UserList
            users={viewModel.users}
            isLoading={viewModel.isUsersLoading}
            error={viewModel.usersError}
            selectedUserId={viewModel.selectedUserId}
            onSelectUser={viewModel.handleSelectUser}
            onRetry={viewModel.refetchUsers}
          />
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        {viewModel.selectedUserId ? (
          <ChatWindow
            selectedUser={viewModel.selectedUser}
            currentUserId={viewModel.currentUserId}
            messageInput={viewModel.messageInput}
            setMessageInput={viewModel.setMessageInput}
            handleSendMessage={viewModel.handleSendMessage}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <div className="max-w-md p-8 text-center text-gray-500">
              <h3 className="mb-4 text-2xl font-semibold">
                Bienvenue sur JJK Messenger
              </h3>
              <p className="mb-6 text-lg">
                Selectionnez un utilisateur dans la liste pour commencer a discuter
              </p>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <p className="text-sm text-gray-600">
                  Cette application de messagerie instantanee vous permet de
                  communiquer en temps reel avec d&apos;autres utilisateurs.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
