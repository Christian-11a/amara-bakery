import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OrderProvider } from "@/context/order-context";
import { MotionProvider } from "@/context/motion-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
const lora = localFont({
  src: "../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2",
  variable: "--font-lora",
  weight: "400 700",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const dmSans = localFont({
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
  adjustFontFallback: "Arial",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.AMARA_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3102")),
  title: { default: "Amara Bakery · Warmth worth remembering", template: "%s · Amara Bakery" },
  description: "Everyday breads, buttery pastries, and little treats made for sharing. Explore Amara Bakery, a fictional frontend portfolio experience.",
  applicationName: "Amara Bakery", icons: { icon: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Amara Bakery",
    title: "Amara Bakery · A frontend portfolio experience",
    description: "A cozy fictional bakery storefront with responsive design, accessible shopping interactions, and purposeful motion.",
  },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${lora.variable} ${dmSans.variable}`} data-motion="reduced"><body><MotionProvider><OrderProvider><a className="skip-link" href="#main">Skip to content</a><SiteHeader />{children}<SiteFooter /></OrderProvider></MotionProvider></body></html>;
}
