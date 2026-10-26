import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "react-datepicker",
      "jspdf",
      "canvas-confetti",
      "react-hot-toast",
      "date-fns-tz",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value: "sandbox; default-src 'none'",
          },
          {
            key: "Content-Disposition",
            value: "attachment",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
