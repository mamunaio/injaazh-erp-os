import type { Metadata, Viewport } from "next";
import { DM_Sans, Cabin, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import CommandCenter from "@/components/layout/CommandCenter";
import WorkTimeTracker from "@/components/layout/WorkTimeTracker";
import { Toaster } from "react-hot-toast";
import { getCurrentUser } from "@/app/actions/authActions";
import ChatWidget from "@/components/ui/ChatWidget";

// Primary Body font - DM Sans (Clean, elegant, brutalist luxury body font)
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// Heading & Interactive font - Cabin (Geometric, bold, stylish)
const cabin = Cabin({
  subsets: ["latin"],
  variable: "--font-cabin",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Monospace font - JetBrains Mono (code, numbers)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://injaazh.com'),
  title: "Injaazh Global - ERP & Business OS",
  description: "Enterprise Resource Planning and Business Operations OS for Injaazh Global",
  icons: {
    icon: "/fav.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const res = await getCurrentUser();
  const initialUser = res.success ? res.data : null;
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cabin.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden relative font-sans antialiased transition-colors duration-500 selection:bg-[#6324FC]/30 selection:text-white" suppressHydrationWarning>
        {/* Top Ambient Glow matching injaazh-global */}
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[80vw] h-[50vw] max-w-[1000px] bg-[#6324FC] opacity-[0.05] dark:opacity-[0.08] pointer-events-none blur-[150px] rounded-full z-0" />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Custom Electron Title Bar */}
          <div 
            id="electron-titlebar"
            className="hidden fixed top-0 left-0 right-0 h-[35px] z-[9999] bg-[#060608]/80 backdrop-blur-md border-b border-primary/10 items-center justify-center transition-all duration-300" 
          >
            <span className="text-xs font-heading font-semibold text-secondary tracking-wider">Injaazh ERP OS</span>
          </div>
          <AppLayoutWrapper initialUser={initialUser}>
            {children}
            {initialUser && (
              <>
                <CommandCenter />
                <WorkTimeTracker />
                <ChatWidget />
              </>
            )}
          </AppLayoutWrapper>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#0a0a0d',
                color: '#edeae2',
                border: '1px solid rgba(99, 36, 252, 0.2)',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
              },
              success: {
                iconTheme: { primary: '#6324FC', secondary: '#060608' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#060608' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
