import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  variant: "login" | "register";
  footerText: string;
  footerHref: string;
  footerLabel: string;
  children: ReactNode;
};

export default function AuthPageShell({
  title,
  subtitle,
  variant,
  footerText,
  footerHref,
  footerLabel,
  children,
}: AuthPageShellProps) {
  const backgroundImage = variant === "login"
    ? "url('/images/login-bg.jpg')"
    : "url('/images/register-bg.jpg')";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <section className="relative z-10 w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg animate-fadeIn">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-4xl font-extrabold text-gray-900">
            {title}
          </h1>
          <h2 className="text-xl font-semibold text-gray-700">{subtitle}</h2>
        </div>

        {children}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {footerText}{" "}
            <Link href={footerHref} className="font-medium text-indigo-600 hover:text-indigo-500">
              {footerLabel}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
