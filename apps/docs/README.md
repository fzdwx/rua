# Rua Documentation

This is the documentation site for Rua, a modern command palette launcher for Linux. Built with [Fumadocs](https://fumadocs.dev) and Next.js.

## Features

- 📚 **Comprehensive Documentation**: Complete guides for users, developers, and contributors
- 🔍 **Full-text Search**: Advanced search functionality across all documentation
- 🎨 **Modern UI**: Beautiful, responsive design with dark/light theme support
- 📱 **Mobile Friendly**: Optimized for all devices and screen sizes
- 🔗 **Cross-references**: Intelligent linking between related documentation
- 🚀 **Fast Performance**: Static site generation for optimal loading speeds

## Development

Run the development server:

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
apps/docs/
├── app/                    # Next.js App Router
│   ├── (home)/            # Landing page
│   ├── docs/              # Documentation layout and pages
│   └── api/search/        # Search API endpoint
├── content/docs/          # MDX documentation content
├── lib/                   # Utilities and configurations
│   ├── source.ts          # Content source adapter
│   └── layout.shared.tsx  # Shared layout options
├── mdx-components.tsx     # Custom MDX components
├── source.config.ts       # Fumadocs MDX configuration
└── tailwind.config.ts     # Tailwind CSS configuration
```

## Content Organization

Documentation is organized into the following sections:

- **Getting Started**: Installation, quick start, and configuration
- **Architecture**: Project structure, tech stack, and design principles
- **Extension Development**: Creating and publishing Rua extensions
- **API Reference**: Complete API documentation for developers
- **User Guide**: End-user documentation and tutorials
- **Contributing**: Development setup and contribution guidelines

## Writing Documentation

### Adding New Pages

1. Create a new `.mdx` file in the appropriate `content/docs/` subdirectory
2. Add frontmatter with title and description:
   ```yaml
   ---
   title: Page Title
   description: Page description for SEO
   ---
   ```
3. Update `content/docs/meta.json` to include the new page in navigation

### Using Components

The documentation supports various Fumadocs UI components:

```mdx
<Callout type="info">
  This is an info callout
</Callout>

<Cards>
  <Card title="Card Title" href="/link">
    Card description
  </Card>
</Cards>

<Tabs items={['Tab 1', 'Tab 2']}>
  <Tab value="Tab 1">Content for tab 1</Tab>
  <Tab value="Tab 2">Content for tab 2</Tab>
</Tabs>
```

## Configuration

### Fumadocs Configuration

- `source.config.ts`: MDX processing and frontmatter schema
- `lib/source.ts`: Content loading and search configuration
- `lib/layout.shared.tsx`: Navigation and branding options

### Styling

- Uses Tailwind CSS with Fumadocs UI preset
- Custom components in `mdx-components.tsx`
- Global styles in `app/global.css`

## Deployment

The documentation is configured for static export:

```bash
bun run build
```

This generates a static site in the `.next` directory that can be deployed to any static hosting service.

## Learn More

- [Fumadocs Documentation](https://fumadocs.dev) - Learn about the documentation framework
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [MDX Documentation](https://mdxjs.com/) - Learn about MDX syntax and features
