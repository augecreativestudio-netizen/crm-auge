import type { Metadata } from "next";
import { Calistoga, Poppins, Caveat } from "next/font/google";
import "./globals.css";

const calistoga = Calistoga({
  variable: "--font-calistoga",
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Auge CRM",
  description: "CRM comercial da Auge Creative Studio",
  icons: {
    icon: "/auge-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${calistoga.variable} ${poppins.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
