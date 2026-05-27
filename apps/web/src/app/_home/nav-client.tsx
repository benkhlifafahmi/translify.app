"use client";

// Home page re-exports the shared marketing header. The full menu (How,
// Features, Pricing, FAQ) shows on home; pages that want the compact chrome
// import MarketingHeader directly and pass `compact`.
export { MarketingHeader as SiteNavClient } from "@/components/marketing-header";
