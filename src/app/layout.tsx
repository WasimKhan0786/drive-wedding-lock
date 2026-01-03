import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import LoginScreen from "@/components/LoginScreen";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forever & Always | Wedding Video Portal",
  description: "A premium portal for your cherished wedding memories.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("auth_token")?.value === "unlocked";

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
        {!isAuthenticated ? (
            <LoginScreen />
        ) : (
            <>
                <PageLoader />
                {children}
                <Footer />
            </>
        )}
      </body>
    </html>
  );
}
