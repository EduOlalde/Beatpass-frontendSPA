// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores corporativos (promotores/administradores)
        blue: {
          500: '#3b82f6', // Azul principal
        },
        purple: {
          700: '#9333ea', // Morado principal
        },
        indigo: {
          700: '#6759f0', // Índigo/Violeta para degradados
        },
        // Acento para el público
        orange: {
          500: '#FF8C00', // Naranja vibrante
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}