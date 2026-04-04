import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { env } from "@/lib/env";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://complejofrentealmar.com.ar"),
  icons: {
    icon: "/favicon.svg",
  },
  title: {
    default: `${env.complexName} | Alquiler Costa Atlántica`,
    template: `%s | ${env.complexName}`,
  },
  description:
    "Casas de alquiler turístico en la Costa Atlántica Argentina. Exclusividad, confort y vistas al mar.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: env.complexName,
    title: env.complexName,
    description: "Casas de alquiler turístico frente al mar en Argentina.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${inter.variable} font-body antialiased`}
    >
      <body className="min-h-screen bg-fm-bg text-fm-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
