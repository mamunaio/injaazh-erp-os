import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
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
};

export default nextConfig;


