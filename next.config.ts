import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, devIndicators: false, distDir: process.env.AMARA_BUILD_DIR || ".next", turbopack: { root: process.cwd() } };
export default config;
