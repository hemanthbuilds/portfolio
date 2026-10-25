import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cover images of Medium articles (shown on the Articles page and section).
    remotePatterns: [new URL("https://cdn-images-1.medium.com/**")],
  },
};

export default nextConfig;
