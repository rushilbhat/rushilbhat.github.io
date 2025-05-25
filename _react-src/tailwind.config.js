/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Jekyll layouts / includes
    '../_layouts/**/*.{html,liquid}',
    '../_includes/**/*.{html,liquid}',

    // Blog posts & pages
    '../_posts/**/*.{md,markdown,html,liquid}',
    '../*.{html,md,liquid}',               // root-level pages

    // React components you just added
    './src/**/*.{js,jsx}',                 // everything inside react-src/src
  ],
  theme: { extend: {} },
  plugins: [],
};
