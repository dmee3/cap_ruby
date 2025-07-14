# Design System

This is the design system for the application, built with React and SCSS.

## Structure

The design system is organized into three main categories:

### Atoms
Basic building blocks that can't be broken down further:

- **Button** - Interactive buttons with various variants and sizes
- **Text** - Typography component with semantic variants
- **Badge** - Small status indicators
- **Input** - Form input fields
- **Icon** - Icon wrapper component

### Molecules
Combinations of atoms that work together:

- **FormField** - Complete form field with label, input, and validation
- **SearchBar** - Search input with icon and clear functionality

### Tokens
Design tokens for consistent styling:

- **Colors** - Color palette and semantic colors
- **Typography** - Font sizes, weights, and line heights
- **Spacing** - Consistent spacing values

## Component Structure

Each component is organized in its own folder with the following structure:

```
ComponentName/
├── ComponentName.tsx    # React component
├── ComponentName.scss   # Component styles
└── index.ts            # Exports
```

## Usage

### Importing Components

```typescript
import { Button, Text, FormField } from '@/design-system'
```

### Importing Styles

The styles are automatically imported when you import the design system:

```typescript
import '@/design-system' // This includes all styles
```

Or import specific component styles:

```typescript
import '@/design-system/atoms/Button/Button.scss'
```

### Using Components

```typescript
// Button with different variants
<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" size="lg">Secondary</Button>

// Text with semantic variants
<Text variant="h1">Heading</Text>
<Text variant="body" color="secondary">Body text</Text>

// Form field with validation
<FormField
  label="Email"
  type="email"
  required
  error="Please enter a valid email"
/>
```

## Styling

All styles use Tailwind CSS classes and are organized in SCSS files for better maintainability. The SCSS files use Tailwind's `@apply` directive to maintain consistency with the design system.

### Custom Styling

For custom styling overrides, use the `sx` prop (for Text components) or `className` prop:

```typescript
<Text sx={{ marginTop: '1rem' }}>Custom styled text</Text>
<Button className="custom-button-class">Custom button</Button>
```

## Development

When adding new components:

1. Create a new folder in the appropriate category (atoms/molecules/organisms)
2. Create the component file (ComponentName.tsx)
3. Create the styles file (ComponentName.scss)
4. Create an index.ts file for exports
5. Update the category's index.ts file
6. Update this README if needed

## Design Tokens

The design tokens are defined in TypeScript and provide type safety for design values. They're used throughout the components to ensure consistency.
