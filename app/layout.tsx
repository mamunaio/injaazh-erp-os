import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import { Toaster } from "react-hot-toast";

// Primary font - Inter (clean, modern, professional)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Display font - Plus Jakarta Sans (headings, bold text)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-inter antialiased transition-colors duration-300 selection:bg-indigo-500/30 dark:selection:bg-indigo-500/30" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
