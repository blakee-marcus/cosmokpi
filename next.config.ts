import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize CSS
  experimental: {
    optimizeCss: true,
  },
  // Enable compression
  compress: true,
  // Optimize images (though not used in this app)
  images: {
    unoptimized: true, // Since it's static, no need for Next.js image optimization
  },
  // Output static files for better performance
  output: 'export',
};

export default nextConfig;
