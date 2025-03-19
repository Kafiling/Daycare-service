/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        white: "#fff",
        black: "#3B3A3A",
        primary: {
          DEFAULT: "#DB5F8E",
          light: "#FEC8D8",
        },
        yellow: "#FFD166",
        green: "#06D6A0",
        red: "#F78686",
      },
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
};
