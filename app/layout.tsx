import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import CommandCenter from "@/components/layout/CommandCenter";
import WorkTimeTracker from "@/components/layout/WorkTimeTracker";
import { Toaster } from "react-hot-toast";
import { getCurrentUser } from "@/app/actions/authActions";
import ChatWidget from "@/components/ui/ChatWidget";

// Primary UI & Headings font - Geist (Vercel's crisp, modern SaaS typography)
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Monospace font - Geist Mono (code, IDs, precision numbers, KPI tickers)
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://injaazh.com'),
  title: "Injaazh Global - ERP & Business OS",
  description: "Enterprise Resource Planning and Business Operations OS for Injaazh Global",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden relative font-sans antialiased transition-colors duration-500 selection:bg-[#6324FC]/30 selection:text-white" suppressHydrationWarning>
        {/* Ambient Lighting Meshes */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Top-Center Royal Violet Ambient Mesh */}
          <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[90vw] h-[55vw] max-w-[1200px] bg-gradient-to-b from-[#6324FC]/15 via-[#8B5CF6]/5 to-transparent blur-[160px] rounded-full pointer-events-none" />
          {/* Top-Right Cyber Cyan Accent Glow */}
          <div className="absolute top-[-5%] right-[-5%] w-[45vw] h-[40vw] max-w-[600px] bg-[#00E5FF]/[0.035] blur-[140px] rounded-full pointer-events-none" />
          {/* Bottom-Left Subtle Emerald Ambient */}
          <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[500px] bg-[#10B981]/[0.025] blur-[150px] rounded-full pointer-events-none" />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Custom Electron Title Bar */}
          <div 
            id="electron-titlebar"
            className="hidden fixed top-0 left-0 right-0 h-[35px] z-[9999] bg-[#07080b]/80 backdrop-blur-md border-b border-white/5 items-center justify-center transition-all duration-300" 
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
                background: '#0d0f17',
                color: '#f1f5f9',
                border: '1px solid rgba(99, 36, 252, 0.3)',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 20px rgba(99,36,252,0.15)',
              },
              success: {
                iconTheme: { primary: '#10B981', secondary: '#07080b' },
              },
              error: {
                iconTheme: { primary: '#F43F5E', secondary: '#07080b' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
