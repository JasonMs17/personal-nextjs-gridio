import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gridio — Notes & Budget",
  description: "Daily notes organized in a grid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="bg-background text-slate-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              fontSize: '14px',
              boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)'
            },
            success: {
              iconTheme: { primary: '#2a9df4', secondary: '#ffffff' }
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#ffffff' }
            }
          }}
        />
      </body>
    </html>
  );
}
