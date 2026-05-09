/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#21334E",
        "navy-deep": "#1a2840",
        "navy-soft": "#2a4063",
        teal: "#63FCE2",
        "teal-dim": "#3fc5b0",
        magenta: "#EB586D",
        "magenta-dim": "#BC4656",
        cloud: "#F2F7FD",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "wordmark": "-0.04em",
        "tag": "0.18em",
      },
      borderWidth: {
        "0.5": "0.5px",
      },
    },
  },
  plugins: [],
};
