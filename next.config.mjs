import withSerwistInit from "@serwist/next"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

function getConvexRemotePattern(url) {
  if (!url) {
    return null
  }

  try {
    const parsedUrl = new URL(url)

    return {
      protocol: parsedUrl.protocol.replace(":", ""),
      hostname: parsedUrl.hostname,
      pathname: "/api/storage/**",
    }
  } catch {
    return null
  }
}

const convexRemotePattern = getConvexRemotePattern(convexUrl)

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  register: true,
  scope: "/",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== "production",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: convexRemotePattern ? [convexRemotePattern] : [],
  },
}

export default withSerwist(nextConfig)
