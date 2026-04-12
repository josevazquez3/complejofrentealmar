/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  /** Evita la ruta compilada interna `/favicon.ico` (a veces rompe webpack en dev). */
  async rewrites() {
    return {
      beforeFiles: [{ source: "/favicon.ico", destination: "/favicon.svg" }],
    };
  },
  images: {
    remotePatterns: [
      /* Next 14: un solo `*` por segmento; `**` en hostname suele no matchear y provoca 400 en /_next/image */
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
