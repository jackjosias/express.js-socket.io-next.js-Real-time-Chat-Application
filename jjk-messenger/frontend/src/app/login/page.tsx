'use client';

import { useState } from 'react';
import { useLoginMutation } from '@/store/api/authApi';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiErrorMessage } from '@/utils/apiError';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Nouvel état pour la visibilité du mot de passe
  const [error, setError] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login({ username, password }).unwrap();

      // Stocker les informations d'authentification dans Redux
      dispatch(loginSuccess({
        token: result.token,
        userId: result.userId,
        username: username
      }));

      // Rediriger vers le dashboard
      toast.success('Connexion réussie ! Bienvenue !');
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000); // Redirige après 3 secondes
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Une erreur est survenue lors de la connexion'));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Arrière-plan avec image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }} // Assurez-vous que l'image existe dans public/images/
      >
        {/* Overlay optionnel pour améliorer le contraste du texte */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>

      {/* Conteneur du formulaire - assuré d'être au-dessus de l'arrière-plan */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg animate-fadeIn"> {/* z-10, shadow-lg, et animate-fadeIn ajoutés */}
        <div className="text-center mb-6"> {/* Ajout de mb-6 */}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">JJK Messenger</h1> {/* Taille de police et gras ajustés */}
          <h2 className="text-xl font-semibold text-gray-700">Connexion</h2> {/* Espacement autour du sous-titre */}
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-6"> {/* Ajout de mb-6 */}
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nom d&apos;utilisateur</label>
            <div className="relative mt-1 rounded-md shadow-sm">
              {/* Placeholder pour l'icône utilisateur */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* Insérez votre icône utilisateur SVG ici, par exemple: */}
                {/* <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" fillRule="evenodd"></path></svg> */}
                {/* Assurez-vous d'avoir des icônes dans votre projet, par exemple dans public/icons/ */}
                {/* <img src="/icons/user-icon.svg" alt="user icon" className="h-5 w-5 text-gray-400" /> */}
                 <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative mt-1 rounded-md shadow-sm">
               {/* Icône de cadenas */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 1.5h9a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-6.75a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'} // Type dynamique
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {/* Bouton pour basculer la visibilité */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  // Icône œil ouvert
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                ) : (
                  // Icône œil barré
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.981 18.067A10.613 10.613 0 0 1 12 5.25c4.787 0 8.844 2.115 11.036 6.711a1.012 1.012 0 0 1 0 .639C20.844 18.821 16.787 21 12 21a10.613 10.613 0 0 1-8.019-2.933m0 0a1.012 1.012 0 0 0-.361-.639c-.981-.667-2.456-1.077-3.238-1.077a2.125 2.125 0 0 0-2.125 2.125c0 .771.624 1.396 1.396 1.396.486 0 .914-.249 1.171-.624a1.012 1.012 0 0 0-.36-.639m0 0a1.012 1.012 0 0 0-.361-.639c-.981-.667-2.456-1.077-3.238-1.077a2.125 2.125 0 0 0-2.125 2.125c0 .771.624 1.396 1.396 1.396.486 0 .914-.249 1.171-.624" /></svg>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6"> {/* Ajustement de mt-4 à mt-6 */}
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
