import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PreferencesProvider } from "@/context/PreferencesContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitWe",
  description: "Administra tu gimnasio, rutinas y nutrición",
  icons: {
    icon: "/fitwe-icon.png",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/fitwe-icon.png" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        {/* Contenedor oculto para Google Translate */}
        <div id="google_translate_element" />

        <NextAuthProvider>
          <PreferencesProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </PreferencesProvider>
        </NextAuthProvider>

        {/* Google Translate: init + script externo */}
        <Script id="google-translate-init" strategy="afterInteractive">{`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement(
              { pageLanguage: 'es', autoDisplay: false },
              'google_translate_element'
            );
            // Restaurar idioma guardado en cookie
            var saved = document.cookie.match(/fitwe_lang=([^;]+)/);
            if (saved && saved[1] !== 'es') {
              setTimeout(function() {
                var sel = document.querySelector('.goog-te-combo');
                if (sel) { sel.value = saved[1]; sel.dispatchEvent(new Event('change')); }
              }, 1000);
            }
          }
        `}</Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
