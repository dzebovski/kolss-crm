import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1 MB; lead form allows attachments up to 5 MB each (see MAX_ATTACHMENT_BYTES)
      bodySizeLimit: "25mb",
    },
  },
};

export default withNextIntl(nextConfig);
