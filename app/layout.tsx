// Location: app/layout.tsx

// 🌟 FIXED: Switching from a path alias (@/) to a relative directory lookup (./) 
// completely bypasses the tsconfig paths resolver loop that causes this error.
import "./globals.css"; 

import WhiteLabelLayoutProvider from "@/components/providers/WhiteLabelLayoutProvider"; 

export const metadata = {
  title: "Kitchen Cloud POS",
  description: "Next-Gen Multi-Tenant Fleet & Retail POS Engine",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        <WhiteLabelLayoutProvider colorScheme="dark">
          {children}
        </WhiteLabelLayoutProvider>
      </body>
    </html>
  );
}