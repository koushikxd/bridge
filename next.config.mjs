import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  register: true,
  scope: "/",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== "production",
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withSerwist(nextConfig)
