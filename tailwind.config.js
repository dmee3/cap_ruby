/* eslint-disable no-undef */
// Design tokens live in app/javascript/stylesheets/tokens.css as CSS custom
// properties (light in :root, dark under @media prefers-color-scheme). The color
// scale below points at those variables so utilities resolve per-theme without
// any `dark:` prefixes in markup.
//
// Dark mode is `media` for now. To move to a manual toggle:
//   darkMode: ['class', '[data-theme="dark"]']
// and duplicate the dark block in tokens.css as :root[data-theme="dark"].

const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`

module.exports = {
  darkMode: 'media',
  content: [
    './app/views/**/*.{erb,html,haml}',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    // Flash classes are produced as strings by app/helpers/application_helper.rb
    // and app/javascript/utilities/flashes.ts; keep them even if a scan misses one.
    'flash',
    'flash-bar',
    'flash-base',
    'flash-close',
    'flash-success',
    'flash-error',
    'flash-info',
    'flash-default',
  ],
  theme: {
    extend: {
      colors: {
        raspberry: {
          dark: withAlpha('--color-raspberry-dark'),
          DEFAULT: withAlpha('--color-raspberry'),
          light: withAlpha('--color-raspberry-light'),
          lightest: withAlpha('--color-raspberry-lightest'),
        },
        ocean: {
          dark: withAlpha('--color-ocean-dark'),
          DEFAULT: withAlpha('--color-ocean'),
          light: withAlpha('--color-ocean-light'),
          lightest: withAlpha('--color-ocean-lightest'),
        },
        moss: {
          dark: withAlpha('--color-moss-dark'),
          DEFAULT: withAlpha('--color-moss'),
          light: withAlpha('--color-moss-light'),
          lightest: withAlpha('--color-moss-lightest'),
        },
        jet: { DEFAULT: withAlpha('--color-jet') },
        flash: { DEFAULT: withAlpha('--color-flash') },

        // Semantic surfaces / accents
        page: withAlpha('--bg-page'),
        surface: withAlpha('--bg-surface'),
        'surface-raised': withAlpha('--bg-surface-raised'),
        sunken: withAlpha('--bg-sunken'),
        nav: withAlpha('--bg-nav'),
        'accent-primary': withAlpha('--accent-primary'),
        'border-default': withAlpha('--border-default'),
        'border-strong': withAlpha('--border-strong'),

        // Status fg/bg pairs (used by StatusPill, Card tones, flashes)
        'success-fg': withAlpha('--status-success-fg'),
        'success-bg': withAlpha('--status-success-bg'),
        'danger-fg': withAlpha('--status-danger-fg'),
        'danger-bg': withAlpha('--status-danger-bg'),
        'warning-fg': withAlpha('--status-warning-fg'),
        'warning-bg': withAlpha('--status-warning-bg'),
        'neutral-fg': withAlpha('--status-neutral-fg'),
        'neutral-bg': withAlpha('--status-neutral-bg'),

        // Data-viz
        'viz-scheduled': withAlpha('--viz-scheduled'),
        'viz-actual': withAlpha('--viz-actual'),
        'viz-gap': withAlpha('--viz-gap'),
      },
      textColor: {
        primary: withAlpha('--text-primary'),
        secondary: withAlpha('--text-secondary'),
        'on-brand': withAlpha('--text-on-brand'),
      },
      borderColor: {
        DEFAULT: withAlpha('--border-default'),
      },
      ringColor: {
        DEFAULT: withAlpha('--focus-ring'),
      },
      fontFamily: {
        sans: [
          'Figtree',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'Roboto Mono',
          'SF Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      fontSize: {
        // design-system doc §3.4 — [size, { lineHeight, fontWeight }]
        display: ['32px', { lineHeight: '38px', fontWeight: '700' }],
        h1: ['28px', { lineHeight: '34px', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h3: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        metric: ['28px', { lineHeight: '32px', fontWeight: '700' }],
        body: ['15px', { lineHeight: '22px' }],
        'body-sm': ['13px', { lineHeight: '18px' }],
        label: ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.04em' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        e1: 'var(--elevation-1)',
        e2: 'var(--elevation-2)',
        e3: 'var(--elevation-3)',
      },
      transitionDuration: {
        // preserve the old windi.config.ts override — affects every bare `transition`
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
}
