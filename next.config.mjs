// next.config.mjs
/** @type {import('next').NextConfig} */
const s3Base =
  process.env.NEXT_PUBLIC_S3_BASE ??
  "https://comandas-barlacteo.s3.us-east-2.amazonaws.com";
const s3Host = new URL(s3Base).hostname;

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: s3Host, pathname: "/**" },
    ],
  },
};

export default nextConfig;
