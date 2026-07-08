import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ApolloClientProvider } from "@/src/lib/apollo-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <ApolloClientProvider>{children}</ApolloClientProvider>
      </body>
    </html>
  );
}
