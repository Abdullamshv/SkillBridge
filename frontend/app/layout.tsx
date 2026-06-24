import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ApolloClientProvider } from "@/src/lib/apollo-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillBridge — Connect Students with SMEs",
  description:
    "Malaysia's marketplace connecting university students with local businesses for digital projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <ApolloClientProvider>{children}</ApolloClientProvider>
      </body>
    </html>
  );
}
