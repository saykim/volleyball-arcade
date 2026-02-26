import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Volley Arcade",
    short_name: "VolleyArcade",
    description: "Offline-first volleyball stat tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#f5ecd8",
    theme_color: "#e94f37",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
