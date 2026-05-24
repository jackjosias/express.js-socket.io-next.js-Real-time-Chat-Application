import { User } from '@/store/slices/userSlice';

interface UserListProps {
  users: User[];
  isLoading: boolean;
  error: string | null;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export default function UserList({ users, isLoading, error, selectedUserId, onSelectUser }: UserListProps) {
  // Formater la date de dernière connexion
  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    if (diffDays === 1) return 'hier';

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-pulse flex flex-col space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-3">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 ml-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p className="mb-2">{error}</p>
        <button className="text-blue-500 hover:underline">Réessayer</button>
      </div>
    );
  }

  // Assurer que 'users' est un tableau avant d'appeler map
  if (!Array.isArray(users)) {
    // En cas d'erreur inattendue où 'users' n'est pas un tableau,
    // afficher un message d'erreur et loguer l'erreur pour débogage.
    console.error("Expected 'users' to be an array, but received:", users);
    return <div className="p-4 text-center text-red-500">Erreur interne lors du chargement des utilisateurs.</div>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {users.length === 0 ? (
        <li className="p-4 text-center text-gray-500">
          Aucun utilisateur disponible
        </li>
      ) : (
        users.map(user => (
          <li key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
            <button
              className={`w-full p-4 text-left flex items-center ${selectedUserId === user.id ? 'bg-indigo-50' : ''}`}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="flex-shrink-0 mr-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                      user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user.isOnline ? 'En ligne' : `Vu ${formatLastSeen(user.lastSeenAt)}`}
                </p>
              </div>
            </button>
          </li>
        ))
      )}
    </ul>
  );
}
