/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only when building for Tauri desktop
  // Web (Vercel) builds work exactly as before
  ...(process.env.TAURI_BUILD === "true" ? { output: "export" } : {}),
};

export default nextConfig;
