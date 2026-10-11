import type { NextConfig } from "next";

// Keeps the Next.js dev overlay (`nextjs-portal`) out of the page.
process.env.NEXT_PRIVATE_DISABLE_DEV_OVERLAY_UX = "1";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
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
