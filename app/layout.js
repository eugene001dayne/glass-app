import "./globals.css";

export const metadata = {
  title: "Glass",
  description: "Visual interface for AI agents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}