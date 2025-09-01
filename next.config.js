/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    experimental: {
        appDir: true,
    },
    // Conditional configuration based on environment
    // Use static export only for production builds
    ...(process.env.NODE_ENV === 'production' && {
        output: 'export',
        trailingSlash: true,
        skipTrailingSlashRedirect: true,
        images: {
            unoptimized: true, // Required for static export
        },
    }),
    // Image configuration for both development and production
    images: {
        unoptimized: true, // Required for static export
        domains: [],
        remotePatterns: [],
    },
    // Environment variables for API endpoints
    env: {
        LIVE_SCORE_API: process.env.LIVE_SCORE_API || 'https://api.didlionswin.com',
        ESPN_API_BASE: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl',
    },
    // Enable static optimization
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

export default nextConfig;
