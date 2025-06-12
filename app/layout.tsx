import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>AI Property Police - No Estate Agent Waffle, No Mercy</title>
        <link rel="icon" type="image/png" href="/images/Ross.png" />
        <link rel="shortcut icon" href="/images/Ross.png" />
        <meta
          name="description"
          content="Our crack squad of AI Property Police combs through the photos, floorplans and sold-price data, exposing hidden flaws and telling you what the place is really worth—no estate-agent waffle, no mercy."
        />
        <meta
          property="og:title"
          content="AI Property Police - No Estate Agent Waffle, No Mercy"
        />
        <meta
          property="og:description"
          content="Our crack squad of AI Property Police combs through the photos, floorplans and sold-price data, exposing hidden flaws and telling you what the place is really worth—no estate-agent waffle, no mercy."
        />
        <meta property="og:image" content="/images/Ross.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="AI Property Police - No Estate Agent Waffle, No Mercy"
        />
        <meta
          name="twitter:description"
          content="Our crack squad of AI Property Police combs through the photos, floorplans and sold-price data, exposing hidden flaws and telling you what the place is really worth—no estate-agent waffle, no mercy."
        />
        <meta name="twitter:image" content="/images/Ross.png" />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <div className="min-h-screen bg-background text-foreground">
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
