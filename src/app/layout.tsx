import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const zodiak = localFont({
  src: [
    { path: "../fonts/Zodiak-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Zodiak-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-zodiak",
  display: "swap",
  preload: true,
});

const general = localFont({
  src: [
    { path: "../fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "S.H. Shafin — Science teacher for SSC & HSC in Dhaka",
    template: "%s · S.H. Shafin",
  },
  description:
    "Samiul Haque Shafin teaches Biology, Physics, Chemistry and Math to SSC and HSC students in Dhaka. B.Sc. in Botany, Dhaka College. Teaching since 2022. Book a free trial class.",
  keywords: [
    "SSC Biology teacher Dhaka",
    "HSC Biology tutor",
    "science tutor Dhaka",
    "SSC Physics Chemistry Math",
    "HSC private tutor",
    "S.H. Shafin",
    "Samiul Haque Shafin",
  ],
  authors: [{ name: "Md. Samiul Haque Shafin" }],
  openGraph: {
    type: "website",
    locale: "en_BD",
    title: "S.H. Shafin — Science, taught until it clicks.",
    description: "Biology, Physics, Chemistry and Math for SSC and HSC students in Dhaka. Book a free trial class.",
    siteName: "S.H. Shafin",
    images: [{ url: "/shafin-portrait.webp", width: 800, height: 1000, alt: "Portrait of Samiul Haque Shafin" }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F3EFE4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before paint: enables JS-only hidden states, decides on the first-visit preloader,
// and restores visibility if the app bundle never boots.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!rm&&location.pathname==='/'&&!sessionStorage.getItem('shs-visited')){d.classList.add('preload');}}catch(e){}setTimeout(function(){if(!window.__shsReady){d.classList.remove('js','preload');}},5000);})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${zodiak.variable} ${general.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
