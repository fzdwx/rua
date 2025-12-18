import defaultMdxComponents from "fumadocs-ui/mdx";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TypeTable,
    Accordion,
    Accordions,
    Callout,
    Card,
    Cards,
    Tab,
    Tabs,
    ...components,
  };
}
