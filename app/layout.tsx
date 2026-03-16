import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "📝 Grid Notes",
  description: "Daily notes organized in a grid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-gray-100">
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151'
            }
          }}
        />
      </body>
    </html>
  );
}
