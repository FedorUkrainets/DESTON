import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import { CartProvider } from "@/components/providers/CartProvider";
import { env } from "@/lib/env";
import "./globals.css";

const siteName = env.NEXT_PUBLIC_SITE_NAME;

// Resolve a guaranteed-valid base URL — falls back to localhost on any parse error.
function resolveSiteUrl(): URL {
  try {
    return new URL(env.NEXT_PUBLIC_SITE_URL);
  } catch {
    return new URL("http://localhost:3000");
  }
}

const siteUrl = resolveSiteUrl().toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Streetwear`,
    template: `%s — ${siteName}`,
  },
  description: "Интернет-магазин одежды DESTON. Худи, тишэрты, спортивные костюмы.",
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName,
    url: siteUrl,
    title: siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
