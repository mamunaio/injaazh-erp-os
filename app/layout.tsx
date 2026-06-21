import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import { Toaster } from "react-hot-toast";

// Primary font - Outfit (premium, modern, geometric)
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Monospace font - JetBrains Mono (code, numbers)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Injaazh Global - ERP",
  description: "Enterprise Resource Planning for Injaazh Global",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full neu-base-bg text-slate-900 dark:text-slate-100 font-outfit antialiased transition-colors duration-300 selection:bg-indigo-500/30 dark:selection:bg-indigo-500/30" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Custom Electron Title Bar - Hidden on web, visible via CSS injection in Electron */}
          <div 
            id="electron-titlebar"
            className="hidden fixed top-0 left-0 right-0 h-[35px] z-[9999] bg-slate-900/40 backdrop-blur-md border-b border-white/5 items-center justify-center transition-all duration-300" 
          >
            <span className="text-xs font-semibold text-slate-400 tracking-wider">Injaazh ERP</span>
          </div>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
