import "./globals.css";

export const metadata = {
  title: "S&C Menu Admin",
  description: "Stars N’ Cacio Menu Administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
