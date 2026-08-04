import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import "./globals.css";

const fontHeading = Cormorant_Garamond({
  variable: "--font-heading",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const fontBody = Lora({
  variable: "--font-body",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Estoque",
  description: "Gerenciador de estoque, caixa e financeiro",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fontHeading.variable} ${fontBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
