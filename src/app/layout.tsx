import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G1-Chat Messenger",
  description: "Communication engine of the G1 ecosystem"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-g1-bg text-g1-text antialiased">{children}</body>
    </html>
  );
}