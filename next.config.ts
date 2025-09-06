import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      // { protocol: "https", hostname: "avatars.githubusercontent.com" }, // <- si usas GitHub también
    ],
  },
};

export default nextConfig;
