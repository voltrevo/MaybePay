/** @type {import('tailwindcss').Config} */


module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    
  ],
  theme: {
    extend: {
      cursor: {
        
      },
      fontFamily: {
        // 'sans': ['Proxima Nova', ...defaultTheme.fontFamily.sans],
        'bebas': ['Bebas Neue', 'cursive'],
        'nato':['Noto Sans JP', 'sans-serif'],
        'ProtoMono-Light':['ProtoMono-Light', 'Helvetica', 'Arial', 'Sans-Serif'],
        'ProtoMono-LightShadow':['ProtoMono-LightShadow', 'Helvetica', 'Arial', 'Sans-Serif'],
        'ProtoMono-SemiBold':['ProtoMono-SemiBold', 'Helvetica', 'Arial', 'Sans-Serif'],
        
      },
      borderRadius:{
        'twistBorder':'255px 15px 225px 15px/15px 225px 15px 255px;'
      },
      keyframes: {
        wiggle: {
          '0%': { transform: 'translateY(-300vw)' },
          // '50%': { transform: 'translateY(-0vw)' },
          '100%': { transform: 'translateY(-10vw)' },
        },
        wiggle2: {
          '0%': { transform: 'translateX(-10vw)' },
          '50%': { transform: 'translateX(50vw)' },
          '100%': { transform: 'translateX(-10vw)' },
        },
        animation: {
          wiggle: 'wiggle 15s ease-in infinite',
          wiggle2:'wiggle2 12s ease-in infinite'
        }
  
      }
    },
  },
  plugins: [
   
]
,
}
