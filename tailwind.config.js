/** @type {import('tailwindcss').Config} */
module.exports = {
  // Not used for purging in v4, but still handy for tooling
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },

      screens: {
        '2xsm': '375px',
        'xsm': '425px',
        '3xl': '2000px',
      },
      colors: {
        'current': 'currentColor',
        'transparent': 'transparent',
        'white': '#FFFFFF',
        'background': 'rgb(var(--background) / <alpha-value>)',
        'foreground': 'rgb(var(--foreground) / <alpha-value>)',

        'card': 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',

        'popover': 'rgb(var(--popover) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--popover-foreground) / <alpha-value>)',

        'primary': 'rgb(var(--restaurant-primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',

        'secondary': 'rgb(var(--secondary) / <alpha-value>)',
        'secondary-foreground':
          'rgb(var(--secondary-foreground) / <alpha-value>)',

        'muted': 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',

        'accent': 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',

        'destructive': 'rgb(var(--destructive) / <alpha-value>)',
        'destructive-foreground':
          'rgb(var(--destructive-foreground) / <alpha-value>)',

        'border': 'rgb(var(--border) / <alpha-value>)',
        'input': 'rgb(var(--input) / <alpha-value>)',
        'ring': 'rgb(var(--ring) / <alpha-value>)',

        // Sidebar tokens (if you use them)
        'sidebar': 'rgb(var(--sidebar) / <alpha-value>)',
        'sidebar-foreground': 'rgb(var(--sidebar-foreground) / <alpha-value>)',
        'sidebar-primary': 'rgb(var(--sidebar-primary) / <alpha-value>)',
        'sidebar-primary-foreground':
          'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
        'sidebar-accent': 'rgb(var(--sidebar-accent) / <alpha-value>)',
        'sidebar-accent-foreground':
          'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
        'sidebar-border': 'rgb(var(--sidebar-border) / <alpha-value>)',
        'sidebar-ring': 'rgb(var(--sidebar-ring) / <alpha-value>)',

        // Restaurant namespace (optional but very clean)
        'restaurant': {
          'primary': 'rgb(var(--restaurant-primary) / <alpha-value>)',
          'primary-dark': 'rgb(var(--restaurant-primary-dark) / <alpha-value>)',
          'primary-light':
            'rgb(var(--restaurant-primary-light) / <alpha-value>)',
          'sidebar-bg': 'rgb(var(--restaurant-sidebar-bg) / <alpha-value>)',
          'sidebar-hover':
            'rgb(var(--restaurant-sidebar-hover) / <alpha-value>)',
          'success': 'rgb(var(--restaurant-success) / <alpha-value>)',
          'warning': 'rgb(var(--restaurant-warning) / <alpha-value>)',
          'error': 'rgb(var(--restaurant-error) / <alpha-value>)',
        },

        // ---- Legacy aliases (so old classes still work) ----
        // 'stroke': 'rgb(var(--border) / <alpha-value>)',
        // 'stroke-dark': 'rgb(var(--border) / <alpha-value>)',

        // Keep your old gray scale names (matches Tailwind gray, modern clean)
        'gray': {
          DEFAULT: '#F3F4F6', // gray-100
          dark: '#111827', // gray-900 (cleaner than older #122031)
          1: '#F9FAFB', // gray-50
          2: '#F3F4F6', // gray-100
          3: '#E5E7EB', // gray-200
          4: '#D1D5DB', // gray-300
          5: '#9CA3AF', // gray-400
          6: '#6B7280', // gray-500
          7: '#374151', // gray-700
        },

        // Your "dark" palette used like text-dark-5 etc (stable + professional)
        'dark': {
          DEFAULT: '#111827', // gray-900
          2: '#1F2937', // gray-800
          3: '#374151', // gray-700
          4: '#4B5563', // gray-600
          5: '#6B7280', // gray-500
          6: '#9CA3AF', // gray-400
          7: '#D1D5DB', // gray-300
          8: '#E5E7EB', // gray-200
        },

        // Status colors (modern defaults)
        'green': {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: {
            DEFAULT: '#34D399',
            1: '#10B981',
            2: '#57DE8F',
            3: '#82E6AC',
            4: '#ACEFC8',
            5: '#C2F3D6',
            6: '#DAF8E6',
            7: '#E9FBF0',
          },
        },
        'red': {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: {
            DEFAULT: '#F87171',
            2: '#FCA5A5',
            3: '#FECACA',
            4: '#FEE2E2',
            5: '#FEF2F2',
            6: '#FEF2F2',
          },
        },
        'blue': {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: {
            DEFAULT: '#60A5FA',
            2: '#93C5FD',
            3: '#BFDBFE',
            4: '#DBEAFE',
            5: '#EFF6FF',
          },
        },
        'yellow': {
          dark: {
            DEFAULT: '#F59E0B',
            2: '#D97706',
          },
          light: {
            DEFAULT: '#FCD34D',
            4: '#FFFBEB',
          },
        },

        'brand': {
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          800: '#1E40AF',
          950: '#172554',
        },

        'error': {
          500: '#EF4444',
        },
      },

      fontSize: {
        'heading-1': ['60px', '72px'],
        'heading-2': ['48px', '58px'],
        'heading-3': ['40px', '48px'],
        'heading-4': ['35px', '45px'],
        'heading-5': ['28px', '40px'],
        'heading-6': ['24px', '30px'],
        'body-2xlg': ['22px', '28px'],
        'body-sm': ['14px', '22px'],
        'body-xs': ['12px', '20px'],
        'title-sm': '1.5rem',
        'title-md': '2rem',
      },

      // Keep your existing custom scales (safe for existing UI)
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        6.5: '1.625rem',
        7.5: '1.875rem',
        8.5: '2.125rem',
        9.5: '2.375rem',
        10.5: '2.625rem',
        11: '2.75rem',
        11.5: '2.875rem',
        12.5: '3.125rem',
        13: '3.25rem',
        13.5: '3.375rem',
        14: '3.5rem',
        14.5: '3.625rem',
        15: '3.75rem',
        15.5: '3.875rem',
        16: '4rem',
        16.5: '4.125rem',
        17: '4.25rem',
        17.5: '4.375rem',
        18: '4.5rem',
        18.5: '4.625rem',
        19: '4.75rem',
        19.5: '4.875rem',
        21: '5.25rem',
        21.5: '5.375rem',
        22: '5.5rem',
        22.5: '5.625rem',
        24.5: '6.125rem',
        25: '6.25rem',
        25.5: '6.375rem',
        26: '6.5rem',
        27: '6.75rem',
        27.5: '6.875rem',
        28.5: '7.125rem',
        29: '7.25rem',
        29.5: '7.375rem',
        30: '7.5rem',
        31: '7.75rem',
        32.5: '8.125rem',
        33: '8.25rem',
        34: '8.5rem',
        34.5: '8.625rem',
        35: '8.75rem',
        36.5: '9.125rem',
        37.5: '9.375rem',
        39: '9.75rem',
        39.5: '9.875rem',
        40: '10rem',
        42.5: '10.625rem',
        44: '11rem',
        45: '11.25rem',
        46: '11.5rem',
        46.5: '11.625rem',
        47.5: '11.875rem',
        49: '12.25rem',
        50: '12.5rem',
        52: '13rem',
        52.5: '13.125rem',
        54: '13.5rem',
        54.5: '13.625rem',
        55: '13.75rem',
        55.5: '13.875rem',
        59: '14.75rem',
        60: '15rem',
        62.5: '15.625rem',
        65: '16.25rem',
        67: '16.75rem',
        67.5: '16.875rem',
        70: '17.5rem',
        72.5: '18.125rem',
        73: '18.25rem',
        75: '18.75rem',
        90: '22.5rem',
        94: '23.5rem',
        95: '23.75rem',
        100: '25rem',
        103: '25.75rem',
        115: '28.75rem',
        125: '31.25rem',
        132.5: '33.125rem',
        150: '37.5rem',
        171.5: '42.875rem',
        180: '45rem',
        187.5: '46.875rem',
        203: '50.75rem',
        230: '57.5rem',
        242.5: '60.625rem',
      },

      maxWidth: {
        2.5: '0.625rem',
        3: '0.75rem',
        4: '1rem',
        7: '1.75rem',
        9: '2.25rem',
        10: '2.5rem',
        10.5: '2.625rem',
        11: '2.75rem',
        13: '3.25rem',
        14: '3.5rem',
        15: '3.75rem',
        16: '4rem',
        22.5: '5.625rem',
        25: '6.25rem',
        30: '7.5rem',
        34: '8.5rem',
        35: '8.75rem',
        40: '10rem',
        42.5: '10.625rem',
        44: '11rem',
        45: '11.25rem',
        46.5: '11.625rem',
        60: '15rem',
        70: '17.5rem',
        90: '22.5rem',
        94: '23.5rem',
        100: '25rem',
        103: '25.75rem',
        125: '31.25rem',
        132.5: '33.125rem',
        142.5: '35.625rem',
        150: '37.5rem',
        180: '45rem',
        203: '50.75rem',
        230: '57.5rem',
        242.5: '60.625rem',
        270: '67.5rem',
        280: '70rem',
        292.5: '73.125rem',
      },

      maxHeight: {
        35: '8.75rem',
        70: '17.5rem',
        90: '22.5rem',
        300: '18.75rem',
        550: '34.375rem',
      },

      minWidth: {
        22.5: '5.625rem',
        42.5: '10.625rem',
        47.5: '11.875rem',
        75: '18.75rem',
      },

      zIndex: {
        999999: '999999',
        99999: '99999',
        9999: '9999',
        999: '999',
        99: '99',
        9: '9',
        1: '1',
      },

      opacity: {
        65: '.65',
      },

      aspectRatio: {
        '4/3': '4 / 3',
        '21/9': '21 / 9',
      },

      backgroundImage: {
        video: "url('../images/video/video.png')",
      },

      content: {
        'icon-copy': 'url("../images/icon/icon-copy-alt.svg")',
      },

      transitionProperty: { width: 'width', stroke: 'stroke' },

      borderWidth: {
        6: '6px',
        10: '10px',
        12: '12px',
      },

      /**
       * Cleaner, modern shadows (still keeps your old keys)
       */
      boxShadow: {
        'default': '0 1px 2px rgb(0 0 0 / 0.06), 0 2px 8px rgb(0 0 0 / 0.06)',
        'error': '0 12px 34px rgb(13 10 44 / 0.06)',
        'card': '0 1px 2px rgb(0 0 0 / 0.06)',
        'card-2': '0 12px 24px -12px rgb(0 0 0 / 0.18)',
        'card-3': '0 2px 10px rgb(0 0 0 / 0.06)',
        'card-4': '0 1px 3px rgb(0 0 0 / 0.10)',
        'card-5': '0 1px 3px rgb(0 0 0 / 0.12)',
        'card-6': '0 8px 20px -10px rgb(0 0 0 / 0.18)',
        'card-7': '0 1px 2px rgb(0 0 0 / 0.10)',
        'card-8': '0 1px 2px rgb(0 0 0 / 0.08)',
        'card-9': '0 1px 3px rgb(0 0 0 / 0.08)',
        'card-10': '0 2px 3px rgb(0 0 0 / 0.10)',
        'switcher':
          '0 2px 4px rgb(0 0 0 / 0.18), inset 0 2px 2px rgb(255 255 255 / 0.9), inset 0 -1px 1px rgb(0 0 0 / 0.06)',
        'switch-1': '0 0 4px rgb(0 0 0 / 0.10)',
        'switch-2': '0 0 5px rgb(0 0 0 / 0.15)',
        'datepicker': '-5px 0 0 #1f2a37, 5px 0 0 #1f2a37',
        '1': '0 1px 2px rgb(84 87 118 / 0.12)',
        '2': '0 2px 3px rgb(84 87 118 / 0.15)',
        '3': '0 8px 20px rgb(113 116 152 / 0.10)',
        '4': '0 16px 40px rgb(13 10 44 / 0.20)',
        '5': '0 10px 30px rgb(85 106 235 / 0.12)',
        '6': '0 12px 34px rgb(13 10 44 / 0.08)',
        '7': '0 18px 25px rgb(113 116 152 / 0.06)',
        'theme-xs': '0 1px 2px rgb(0 0 0 / 0.05)',
      },

      dropShadow: {
        card: '0 8px 13px rgb(0 0 0 / 0.07)',
        1: '0 1px 0 #E2E8F0',
        2: '0 1px 4px rgb(0 0 0 / 0.12)',
        3: '0 0 4px rgb(0 0 0 / 0.15)',
        4: '0 0 2px rgb(0 0 0 / 0.2)',
        5: '0 1px 5px rgb(0 0 0 / 0.2)',
      },

      keyframes: {
        'linspin': { '100%': { transform: 'rotate(360deg)' } },
        'easespin': {
          '12.5%': { transform: 'rotate(135deg)' },
          '25%': { transform: 'rotate(270deg)' },
          '37.5%': { transform: 'rotate(405deg)' },
          '50%': { transform: 'rotate(540deg)' },
          '62.5%': { transform: 'rotate(675deg)' },
          '75%': { transform: 'rotate(810deg)' },
          '87.5%': { transform: 'rotate(945deg)' },
          '100%': { transform: 'rotate(1080deg)' },
        },
        'left-spin': {
          '0%': { transform: 'rotate(130deg)' },
          '50%': { transform: 'rotate(-5deg)' },
          '100%': { transform: 'rotate(130deg)' },
        },
        'right-spin': {
          '0%': { transform: 'rotate(-130deg)' },
          '50%': { transform: 'rotate(5deg)' },
          '100%': { transform: 'rotate(-130deg)' },
        },
        'rotating': {
          '0%, 100%': { transform: 'rotate(360deg)' },
          '50%': { transform: 'rotate(0deg)' },
        },
        'topbottom': {
          '0%, 100%': { transform: 'translate3d(0, -100%, 0)' },
          '50%': { transform: 'translate3d(0, 0, 0)' },
        },
        'bottomtop': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -100%, 0)' },
        },
        'line': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(100%)' },
        },
        'line-revert': {
          '0%, 100%': { transform: 'translateY(100%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },

      animation: {
        'linspin': 'linspin 1568.2353ms linear infinite',
        'easespin':
          'easespin 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both',
        'left-spin':
          'left-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both',
        'right-spin':
          'right-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both',
        'ping-once': 'ping 5s cubic-bezier(0, 0, 0.2, 1)',
        'rotating': 'rotating 30s linear infinite',
        'topbottom': 'topbottom 60s infinite alternate linear',
        'bottomtop': 'bottomtop 60s infinite alternate linear',
        'spin-1.5': 'spin 1.5s linear infinite',
        'spin-2': 'spin 2s linear infinite',
        'spin-3': 'spin 3s linear infinite',
        'line1': 'line 10s infinite linear',
        'line2': 'line-revert 8s infinite linear',
        'line3': 'line 7s infinite linear',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
