import type { Metadata } from "next";
import "./globals.css";
import { ExtensionDomSanitizer } from "@/core/presentation/components/providers/ExtensionDomSanitizer";
import { extensionDomSanitizerBootstrapScript } from "@/core/presentation/components/providers/extensionDomSanitizerBootstrap";
import StoreProvider from "@/core/presentation/components/providers/StoreProvider";

export const metadata: Metadata = {
  title: "JJK Messenger",
  description: "Real-time Chat Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script
          id="extension-dom-sanitizer-bootstrap"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: extensionDomSanitizerBootstrapScript }}
        />
        <ExtensionDomSanitizer />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
