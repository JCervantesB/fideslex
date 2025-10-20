import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora ESLint durante el build para no bloquear por advertencias
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
