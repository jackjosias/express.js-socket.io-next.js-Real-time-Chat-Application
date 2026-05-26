"use client";

import type { ChangeEvent } from "react";
import AuthPageShell from "@/core/presentation/components/auth/AuthPageShell";
import PasswordField from "@/core/presentation/components/auth/PasswordField";
import { useRegisterForm } from "@/core/presentation/hooks/auth/useRegisterForm";

export default function RegisterPage() {
  const {
    error,
    formState,
    handleSubmit,
    isLoading,
    showConfirmPassword,
    showPassword,
    toggleShowConfirmPassword,
    toggleShowPassword,
    updateField,
  } = useRegisterForm();

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateField("username", event.target.value);
  };

  return (
    <AuthPageShell
      title="JJK Messenger"
      subtitle="Inscription"
      variant="register"
      footerText="Deja un compte ?"
      footerHref="/login"
      footerLabel="Se connecter"
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
            value={formState.username}
            onChange={handleUsernameChange}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="Choisissez un nom d'utilisateur unique"
          />
        </div>

        <PasswordField
          id="password"
          label="Mot de passe"
          value={formState.password}
          isVisible={showPassword}
          placeholder="Minimum 6 caracteres"
          onChange={(value) => updateField("password", value)}
          onToggleVisibility={toggleShowPassword}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          value={formState.confirmPassword}
          isVisible={showConfirmPassword}
          placeholder="Repetez votre mot de passe"
          onChange={(value) => updateField("confirmPassword", value)}
          onToggleVisibility={toggleShowConfirmPassword}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </button>
      </form>
    </AuthPageShell>
  );
}
