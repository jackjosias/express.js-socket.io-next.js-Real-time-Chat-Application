import type { User } from "@/core/domain/entities/user";

interface UserListProps {
  users: User[];
  isLoading: boolean;
  error: string | null;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  onRetry?: () => void;
}

function formatLastSeen(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "date inconnue";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 1) {
    return "a l'instant";
  }
  if (diffMins < 60) {
    return "il y a " + diffMins + " min";
  }
  if (diffHours < 24) {
    return "il y a " + diffHours + " h";
  }
  if (diffDays === 1) {
    return "hier";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UserListSkeleton() {
  return (
    <div className="p-4 text-center text-gray-500">
      <div className="flex animate-pulse flex-col space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center p-3">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="ml-3 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserList({
  users,
  isLoading,
  error,
  selectedUserId,
  onSelectUser,
  onRetry,
}: UserListProps) {
  if (isLoading) {
    return <UserListSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p className="mb-2">{error}</p>
        {onRetry ? (
          <button type="button" className="text-blue-500 hover:underline" onClick={onRetry}>
            Reessayer
          </button>
        ) : null}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Aucun utilisateur disponible
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {users.map((user) => (
        <li key={user.id} className="transition-colors duration-150 hover:bg-gray-50">
          <button
            type="button"
            className={
              "flex w-full items-center p-4 text-left " +
              (selectedUserId === user.id ? "bg-indigo-50" : "")
            }
            onClick={() => onSelectUser(user.id)}
          >
            <div className="mr-3 flex-shrink-0">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-600">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span
                  className={
                    "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white " +
                    (user.isOnline ? "bg-green-500" : "bg-gray-400")
                  }
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.username}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user.isOnline ? "En ligne" : "Vu " + formatLastSeen(user.lastSeenAt)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
