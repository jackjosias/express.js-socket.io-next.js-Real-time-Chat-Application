"use client";

import type { ChangeEvent } from "react";
import AuthPageShell from "@/core/presentation/components/auth/AuthPageShell";
import PasswordField from "@/core/presentation/components/auth/PasswordField";
import { useLoginForm } from "@/core/presentation/hooks/auth/useLoginForm";

export default function LoginPage() {
  const {
    credentials,
    error,
    handleSubmit,
    isLoading,
    showPassword,
    toggleShowPassword,
    updateField,
  } = useLoginForm();

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateField("username", event.target.value);
  };

  return (
    <AuthPageShell
      title="JJK Messenger"
      subtitle="Connexion"
      variant="login"
      footerText="Pas encore de compte ?"
      footerHref="/register"
      footerLabel="S'inscrire"
    >
      {error ? (
        <div className="mb-6 rounded-md bg-red-100 p-3 text-red-700">
          {error}
        </div>
      ) : null}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Nom d&apos;utilisateur
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={credentials.username}
            onChange={handleUsernameChange}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <PasswordField
          id="password"
          label="Mot de passe"
          value={credentials.password}
          isVisible={showPassword}
          onChange={(value) => updateField("password", value)}
          onToggleVisibility={toggleShowPassword}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </AuthPageShell>
  );
}
