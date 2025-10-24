import { useColorModeValue } from '@chakra-ui/react'

export default function useBrandColor() {
  const bg = useColorModeValue('white', 'gray.800')
  const card = useColorModeValue('white', 'gray.700')
  const border = useColorModeValue('gray.200', 'gray.600')
  const brand = useColorModeValue('brand.500', 'brand.300')
  const textMuted = useColorModeValue('gray.600', 'gray.300')
  return { bg, card, border, brand, textMuted }
}


