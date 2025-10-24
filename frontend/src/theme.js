import { extendTheme, theme as base } from '@chakra-ui/react'

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const styles = {
  global: ({ colorMode }) => ({
    body: {
      bg: colorMode === 'dark' ? 'gray.900' : 'gray.50',
    },
  }),
}

const fonts = {
  heading: `Inter, ${base.fonts.heading}`,
  body: `Inter, ${base.fonts.body}`,
}

const colors = {
  brand: {
    50: '#e6f1ff',
    100: '#cce3ff',
    200: '#99c7ff',
    300: '#66aaff',
    400: '#338eff',
    500: '#006fff',
    600: '#0057cc',
    700: '#004299',
    800: '#002c66',
    900: '#001733',
  },
}

const components = {
  Button: {
    defaultProps: { colorScheme: 'brand' },
  },
  Container: {
    baseStyle: { maxW: '6xl' },
  },
}

const theme = extendTheme({ config, styles, fonts, colors, components })
export default theme


