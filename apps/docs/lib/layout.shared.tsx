import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Rua",
      url: "/",
    },
    links: [
      {
        text: "Documentation",
        url: "/docs",
        active: "nested-url",
      },
      {
        text: "GitHub",
        url: "https://github.com/fzdwx/rua",
        external: true,
      },
    ],
  };
}
