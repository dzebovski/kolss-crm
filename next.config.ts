import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1 MB; lead form allows attachments up to 5 MB each (see MAX_ATTACHMENT_BYTES)
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
