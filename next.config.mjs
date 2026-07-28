/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sqlite3"],
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
