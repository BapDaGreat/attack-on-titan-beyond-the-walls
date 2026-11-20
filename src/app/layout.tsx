import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cinzel",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Attack on Titan — Beyond the Walls | 3D Paradis Archive",
  description:
    "Interactive 1:1 meter real-time Three.js exploration of Paradis Island, Wall Maria, Rose & Sina, Shiganshina District, the Nine Titans, and Survey Corps characters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body className="antialiased selection:bg-[#B8965A] selection:text-[#121311]">
        {children}
      </body>
    </html>
  );
}
