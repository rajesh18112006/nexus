/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Design Tokens ──────────────────────────────────────────────
      colors: {
        // Accent — Signal Orange
        accent: {
          DEFAULT: '#E05C28',
          hover: '#C44E20',
          muted: '#F5DDD4',
          foreground: '#FFFFFF',
        },
        // Surface — warm off-white (light) / near-black (dark)
        surface: {
          DEFAULT: '#F6F4EF',
          raised: '#EDEAE3',
          overlay: '#E5E1D8',
          inverse: '#111010',
        },
        // Ink
        ink: {
          DEFAULT: '#141210',
          secondary: '#3D3830',
          muted: '#5C5750',
          faint: '#8C877E',
          inverse: '#F0EDE6',
        },
        // Border
        border: {
          DEFAULT: '#D8D4CC',
          strong: '#B8B3AA',
          focus: '#E05C28',
        },
        // Status — semantic only
        critical: { DEFAULT: '#C0392B', bg: '#FDF2F0', border: '#E8A49F' },
        warning:  { DEFAULT: '#D4820A', bg: '#FDF6EC', border: '#F0C882' },
        healthy:  { DEFAULT: '#2E7D32', bg: '#EFF6EF', border: '#A3C8A5' },
        info:     { DEFAULT: '#1565C0', bg: '#EEF3FB', border: '#93B8E8' },
        // Dark mode surfaces
        dark: {
          bg:       '#111010',
          raised:   '#1A1917',
          overlay:  '#232220',
          border:   '#2E2C28',
          'border-strong': '#3D3B36',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        ui: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],  // 10px
        xs:   ['0.6875rem', { lineHeight: '1rem' }],       // 11px
        sm:   ['0.75rem', { lineHeight: '1.125rem' }],     // 12px
        base: ['0.8125rem', { lineHeight: '1.25rem' }],    // 13px
        md:   ['0.875rem', { lineHeight: '1.375rem' }],    // 14px
        lg:   ['1rem', { lineHeight: '1.5rem' }],          // 16px
        xl:   ['1.125rem', { lineHeight: '1.75rem' }],     // 18px
        '2xl':['1.375rem', { lineHeight: '2rem' }],        // 22px
        '3xl':['1.75rem', { lineHeight: '2.25rem' }],      // 28px
        '4xl':['2.25rem', { lineHeight: '2.75rem' }],      // 36px
        '5xl':['3rem', { lineHeight: '3.5rem' }],          // 48px
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.06)',
        sm: '0 1px 2px rgba(0,0,0,0.08)',
        DEFAULT: '0 2px 6px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
        'focus-ring': '0 0 0 2px #E05C28',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        sidebar: '15rem',      // 240px sidebar width
        'sidebar-collapsed': '3.5rem',  // 56px collapsed
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
