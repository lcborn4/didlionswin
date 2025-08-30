/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        appDir: true,
    },
    // Static export configuration
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    images: {
        unoptimized: true, // Required for static export
    },
    // Disable server-side features for static export
    amp: {
        canonicalBase: '',
    },
};

export default nextConfig;
