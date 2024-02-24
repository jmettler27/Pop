/** @type {import('tailwindcss').Config} */
module.exports = {
  // https://mui.com/material-ui/guides/interoperability/#tailwind-css
  corePlugins: {
    preflight: false,
  },
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx,mdx}",
    "./out/**/*.{html,js,ts,jsx,tsx,mdx}"
  ],
  // important: '#__next',
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse_at_center, _var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'idle': 'inherit',
        'focus': 'cyan',
        'wrong': 'red',
        'correct': 'lightgreen',
        'ready': 'purple',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
