import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PosthogProvider from "@/components/PosthogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://festly.de'),
  title: {
    default: 'Festly – Schausteller, Imbisswagen & Eventausrüstung mieten',
    template: '%s | Festly',
  },
  description: 'Festly ist der Marktplatz für Eventdienstleistungen in Deutschland. Imbisswagen, Hüpfburgen, Fahrgeschäfte, Toilettenwagen und mehr – einfach finden, sicher buchen.',
  openGraph: {
    siteName: 'Festly',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PosthogProvider>
          <Nav />
          {children}
          <Footer />
        </PosthogProvider>
      </body>
    </html>
  );
}
