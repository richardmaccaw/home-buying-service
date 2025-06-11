import "./globals.css";
import { Public_Sans } from "next/font/google";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const publicSans = Public_Sans({ subsets: ["latin"] });

const Logo = () => (
  <div className="text-2xl font-bold text-brand">🏠 PropertySearch</div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Property Search - UK Home Analysis</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="Comprehensive property analysis for UK homes - get instant valuations, local insights, and market data."
        />
        <meta
          property="og:title"
          content="Property Search - UK Home Analysis"
        />
        <meta
          property="og:description"
          content="Comprehensive property analysis for UK homes - get instant valuations, local insights, and market data."
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Property Search - UK Home Analysis"
        />
        <meta
          name="twitter:description"
          content="Comprehensive property analysis for UK homes - get instant valuations, local insights, and market data."
        />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border">
              <div className="container mx-auto px-4 py-4">
                <Link href="/" className="inline-block">
                  <Logo />
                </Link>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
