import type { NextConfig } from "next";

const s3Host = process.env.NEXT_PUBLIC_S3_BASE
  ? new URL(process.env.NEXT_PUBLIC_S3_BASE).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
      ...(s3Host ? [{ protocol: "https" as const, hostname: s3Host }] : []),
    ],
    // alternativa: domains: ["lh3.googleusercontent.com", ...(s3Host ? [s3Host] : [])],
  },
};

export default nextConfig;
