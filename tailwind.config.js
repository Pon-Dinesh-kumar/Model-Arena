/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        'cyber-dark': '#0a0a1f',
        'cyber-primary': '#1a1a3a',
        'cyber-secondary': '#2a2a4a',
        'cyber-accent': '#00ff9d',
        'cyber-accent-2': '#ff00ff',
        'cyber-light': '#e0e0ff',
        'cyber-glow': '#00ff9d',
        'cyber-warning': '#ff3d00',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a1f 0%, #1a1a3a 100%)',
        'cyber-grid': 'linear-gradient(rgba(0, 255, 157, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.1) 1px, transparent 1px)',
        'cyber-glow': 'radial-gradient(circle at center, rgba(0, 255, 157, 0.2) 0%, transparent 70%)',
      },
      boxShadow: {
        'cyber': '0 0 10px rgba(0, 255, 157, 0.5), 0 0 20px rgba(0, 255, 157, 0.3)',
        'cyber-inner': 'inset 0 0 10px rgba(0, 255, 157, 0.5)',
        'cyber-glow': '0 0 20px rgba(0, 255, 157, 0.8)',
        'cyber-glow-pink': '0 0 20px rgba(255, 0, 255, 0.8)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "cyber-pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "cyber-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "cyber-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "cyber-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0, 255, 157, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 255, 157, 0.8)" },
        },
        "cyber-glow-pink": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(255, 0, 255, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 0, 255, 0.8)" },
        },
        "win-pulse-x": {
          "0%, 100%": { 
            transform: "scale(1)",
            boxShadow: "0 0 20px rgba(0, 255, 157, 0.8)"
          },
          "50%": { 
            transform: "scale(1.1)",
            boxShadow: "0 0 40px rgba(0, 255, 157, 1)"
          }
        },
        "win-pulse-o": {
          "0%, 100%": { 
            transform: "scale(1)",
            boxShadow: "0 0 20px rgba(255, 0, 255, 0.8)"
          },
          "50%": { 
            transform: "scale(1.1)",
            boxShadow: "0 0 40px rgba(255, 0, 255, 1)"
          }
        },
        "victory-text": {
          "0%": { 
            transform: "scale(0)",
            opacity: 0
          },
          "50%": { 
            transform: "scale(1.2)",
            opacity: 1
          },
          "100%": { 
            transform: "scale(1)",
            opacity: 1
          }
        },
        "confetti": {
          "0%": { 
            transform: "translateY(-100%) rotate(0deg)",
            opacity: 1
          },
          "100%": { 
            transform: "translateY(100vh) rotate(360deg)",
            opacity: 0
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "cyber-pulse": "cyber-pulse 2s ease-in-out infinite",
        "cyber-float": "cyber-float 3s ease-in-out infinite",
        "cyber-spin": "cyber-spin 20s linear infinite",
        "cyber-glow": "cyber-glow 2s ease-in-out infinite",
        "cyber-glow-pink": "cyber-glow-pink 2s ease-in-out infinite",
        "win-pulse-x": "win-pulse-x 1s ease-in-out infinite",
        "win-pulse-o": "win-pulse-o 1s ease-in-out infinite",
        "victory-text": "victory-text 0.5s ease-out forwards",
        "confetti": "confetti 3s linear infinite"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 