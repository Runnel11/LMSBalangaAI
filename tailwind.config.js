/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0026E6",
        secondary: "#FFCB05",
        background: "#FFFFFF",
        surface: "#F8F9FC",
        border: "#E0E0E0",
        textPrimary: "#1E1E1E",
        textSecondary: "#707070",
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#F44336",
        info: "#2196F3",
      },
    },
  },
  plugins: [],
}