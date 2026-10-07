import type { NextConfig } from "next";

// Photos de la galerie servies par le stockage public Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

const nextConfig: NextConfig = {
  // Développement : autorise un téléphone du réseau local (ex. http://192.168.1.104:3000)
  allowedDevOrigins: ["192.168.1.*"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/gallery/**`)] : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
