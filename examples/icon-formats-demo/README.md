# Icon Formats Demo

This example demonstrates the different icon formats supported by `DynamicAction`:

1. **Iconify icon names** - e.g., `tabler:puzzle`, `mdi:heart`
2. **Data URIs** - e.g., `data:image/svg+xml;base64,...`
3. **SVG strings** - e.g., `<svg>...</svg>`
4. **Extension asset paths** - e.g., `./icon.png`

## Usage

1. Build the extension:
   ```bash
   npm install
   npm run build
   ```

2. Load the extension in Rua

3. Open the command palette and search for "Icon Demo" to see the different icon formats in action

## Icon Formats

### Iconify Icons
The easiest way to use icons. Browse available icons at [icon-sets.iconify.design](https://icon-sets.iconify.design/).

```typescript
icon: 'tabler:puzzle'
```

### Data URI
Useful for embedding small SVG icons directly:

```typescript
const svg = '<svg>...</svg>';
const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
icon: dataUri
```

### SVG String
Directly use SVG markup:

```typescript
icon: '<svg width="24" height="24">...</svg>'
```

### Asset Path
Reference images in your extension folder:

```typescript
icon: './icon.png'
```

## See Also

- [Dynamic Action Icons Documentation](../../docs/dynamic-action-icons.md)
