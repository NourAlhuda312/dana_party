import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // السماح باختبار الموقع من الهاتف داخل نفس الشبكة
  allowedDevOrigins: ["192.168.1.2"],
};

export default nextConfig;