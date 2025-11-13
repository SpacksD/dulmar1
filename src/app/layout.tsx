import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { StructuredData, generateLocalBusinessSchema, generateOrganizationSchema } from "@/lib/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.centrodulmar.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Centro Infantil DULMAR - Estimulación Temprana para Niños de 0 a 6 años",
    template: "%s | Centro Infantil DULMAR",
  },
  description: "Centro de estimulación temprana para niños de 0 a 6 años. Brindamos seguridad, aprendizaje y salud infantil con profesionales especializados.",
  keywords: [
    "estimulación temprana",
    "centro infantil",
    "educación inicial",
    "niños 0 a 6 años",
    "desarrollo infantil",
    "aprendizaje infantil",
    "cuidado infantil",
    "DULMAR",
  ],
  authors: [{ name: "Centro Infantil DULMAR" }],
  creator: "Centro Infantil DULMAR",
  publisher: "Centro Infantil DULMAR",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: baseUrl,
    title: "Centro Infantil DULMAR - Estimulación Temprana",
    description: "Centro de estimulación temprana para niños de 0 a 6 años. Brindamos seguridad, aprendizaje y salud infantil.",
    siteName: "Centro Infantil DULMAR",
    images: [
      {
        url: `${baseUrl}/media/logo.png`,
        width: 1200,
        height: 630,
        alt: "Centro Infantil DULMAR Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Centro Infantil DULMAR - Estimulación Temprana",
    description: "Centro de estimulación temprana para niños de 0 a 6 años. Brindamos seguridad, aprendizaje y salud infantil.",
    images: [`${baseUrl}/media/logo.png`],
  },
  verification: {
    // Agregar aquí los códigos de verificación cuando los tengas
    // google: "código-de-google-search-console",
    // yandex: "código-de-yandex",
    // bing: "código-de-bing",
  },
};

// Datos estructurados para el negocio local
const localBusinessData = generateLocalBusinessSchema({
  name: "Centro Infantil DULMAR",
  description: "Centro de estimulación temprana para niños de 0 a 6 años. Brindamos seguridad, aprendizaje y salud infantil.",
  url: baseUrl,
  telephone: "+51-XXX-XXX-XXX", // Reemplazar con el teléfono real
  email: "contacto@dulmar.com", // Reemplazar con el email real
  image: `${baseUrl}/media/logo.png`,
  priceRange: "$$",
  // Descomentar y completar cuando tengas la dirección
  // address: {
  //   streetAddress: "Calle Principal 123",
  //   addressLocality: "Ciudad",
  //   addressRegion: "Región",
  //   postalCode: "00000",
  //   addressCountry: "PE",
  // },
  // openingHours: [
  //   "Monday:08:00-18:00",
  //   "Tuesday:08:00-18:00",
  //   "Wednesday:08:00-18:00",
  //   "Thursday:08:00-18:00",
  //   "Friday:08:00-18:00",
  //   "Saturday:09:00-13:00",
  // ],
});

// Datos estructurados para la organización
const organizationData = generateOrganizationSchema({
  name: "Centro Infantil DULMAR",
  url: baseUrl,
  logo: `${baseUrl}/media/logo.png`,
  description: "Centro de estimulación temprana especializado en el desarrollo infantil de niños de 0 a 6 años.",
  // Agregar redes sociales cuando estén disponibles
  // sameAs: [
  //   "https://www.facebook.com/dulmar",
  //   "https://www.instagram.com/dulmar",
  // ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <StructuredData data={localBusinessData} />
        <StructuredData data={organizationData} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
