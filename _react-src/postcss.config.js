// module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// }

module.exports = {
  plugins: [
    require('tailwindcss'),
    /* 👇 This plugin rewrites selectors that Tailwind just generated */
    require('postcss-prefix-selector')({
      prefix: '.fsdp-anim',
      /* keep Preflight working: map body/html selectors to the scope root */
      transform (prefix, selector, prefixed) {
        if (selector.startsWith('html') || selector.startsWith('body')) {
          return prefix;            // ⇒  .fsdp-anim { …reset… }
        }
        return prefixed;            // ⇒ .fsdp-anim h1 { … }
      }
    }),
    require('autoprefixer')
  ]
};
