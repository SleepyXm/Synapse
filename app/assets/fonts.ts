import localFont from "next/font/local"

export const jetBrainsMono = localFont({
  src: [
    { path: "/fonts/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "/fonts/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Bold.woff2", weight: "700", style: "normal" },
    { path: "/fonts/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Italic.woff2", weight: "400", style: "italic" },
    // etc
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});