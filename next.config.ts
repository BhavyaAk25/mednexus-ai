import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  outputFileTracingIncludes: { "/api/sources/*": ["./data/originals/**/*"] },
};

export default config;
