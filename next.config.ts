import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [{
      source: "/dashboard/:path+",
      destination: "/:path+",
      permanent: true,
    }];
  },
};

export default nextConfig;
