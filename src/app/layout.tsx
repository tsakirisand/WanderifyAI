import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wanderify - Smart AI Travel Planner",
  description: "Plan your next adventure in seconds with our AI-powered travel planner. Generate customized itineraries, budget estimates, and discover hidden gems.",
  metadataBase: new URL("https://wanderify.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Wanderify - Smart AI Travel Planner",
    description: "Customized travel itineraries generated in seconds using advanced AI.",
    url: "https://wanderify.vercel.app",
    siteName: "Wanderify",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Wanderify Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Wanderify - Smart AI Travel Planner",
    description: "AI-powered travel itineraries planner",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
