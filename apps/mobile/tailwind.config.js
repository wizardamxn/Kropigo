const plugin = require('tailwindcss/plugin');

/**
 * React Native has no font synthesis: a `fontWeight` alone will not make a
 * custom family render bold, each weight is its own font file. So the weight
 * utilities are redefined to pick the matching Geist face as well. Use
 * `font-serif` / `font-script` on their own (without a weight class) — those
 * families are registered at a single weight.
 */
const geistWeights = plugin(({ addUtilities }) => {
  const faces = {
    'font-thin': ['Geist_100Thin', '100'],
    'font-extralight': ['Geist_200ExtraLight', '200'],
    'font-light': ['Geist_300Light', '300'],
    'font-normal': ['Geist_400Regular', '400'],
    'font-medium': ['Geist_500Medium', '500'],
    'font-semibold': ['Geist_600SemiBold', '600'],
    'font-bold': ['Geist_700Bold', '700'],
    'font-extrabold': ['Geist_800ExtraBold', '800'],
    'font-black': ['Geist_900Black', '900'],
  };

  addUtilities(
    Object.fromEntries(
      Object.entries(faces).map(([className, [fontFamily, fontWeight]]) => [
        `.${className}`,
        { fontFamily, fontWeight },
      ]),
    ),
  );
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#166534',
        secondary: '#F59E0B',
      },
      fontFamily: {
        sans: ['Geist_400Regular'],
        serif: ['Fraunces_600SemiBold'],
        script: ['Caveat_600SemiBold'],
      },
    },
  },
  plugins: [geistWeights],
};
