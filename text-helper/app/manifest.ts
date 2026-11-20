import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Text Helper",
    short_name: "Text Helper",
    description: "Fix or write text messages and emails in natural English or French.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f1",
    theme_color: "#2f6f4f",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
