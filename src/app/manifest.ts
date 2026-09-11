import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kendali — Job & Finance Tracker",
    short_name: "Kendali",
    description: "Kendalikan lamaran kerja dan arus kas dari satu tempat.",
    start_url: "/hari-ini",
    scope: "/",
    display: "standalone",
    background_color: "#f7f3ef",
    theme_color: "#f7f3ef",
    lang: "id-ID",
    categories: ["productivity", "finance"],
    icons: [
      { src: "/kendali-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/kendali-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
