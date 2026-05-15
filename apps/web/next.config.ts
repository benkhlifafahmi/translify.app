import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  async redirects() {
    return [
      // Pages Google indexed that no longer exist
      { source: "/about", destination: "/manifesto", permanent: true },
      { source: "/waitlist", destination: "/join", permanent: true },
      { source: "/updates", destination: "/blog", permanent: true },
      // WordPress URLs inherited from the previous domain owner
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/index.php/:path*", destination: "/", permanent: true },
    ];
  },
};

export default config;
