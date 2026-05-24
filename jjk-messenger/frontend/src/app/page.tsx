import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  // Rediriger vers la page de login
  redirect('/login');

  // Ce code ne sera jamais exécuté à cause de la redirection
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">JJK Messenger</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connexion
        </Link>

        <Link
          href="/register"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Inscription
        </Link>
      </div>
    </main>
  );
}
