/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        appDir: true,
    },
    // Hybrid configuration: Static export with API support
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    images: {
        unoptimized: true, // Required for static export
    },
    // Environment variables for API endpoints
    env: {
        LIVE_SCORE_API: process.env.LIVE_SCORE_API || 'https://api.didlionswin.com',
        ESPN_API_BASE: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl',
    },
    // Disable server-side features for static pages
    amp: {
        canonicalBase: '',
    },
    // Enable static optimization
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

module.exports = nextConfig;
