import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import PostHogProvider from "@/components/PostHogProvider";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-source" });

export const metadata: Metadata = {
  title: { default: "MentorHub", template: "%s | MentorHub" },
  description: "One-to-one mentorship with chat, documents and video sessions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <PostHogProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
          <Footer />
        </PostHogProvider>
      </body>
    </html>
  );
}
