import { Flex, Heading, IconButton, Spacer } from '@chakra-ui/react'
import { useColorMode } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import useBrandColor from '../hooks/useBrandColor'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { card, border } = useBrandColor()
  return (
    <Flex
      as="nav"
      align="center"
      p={3}
      borderWidth="1px"
      borderColor={border}
      borderRadius="md"
      bg={card}
      mb={4}
      gap={4}
    >
      <Heading as={Link} to="/" size="md">ScreenShare Pro</Heading>
      <Spacer />
      <IconButton
        aria-label="Toggle color mode"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        variant="ghost"
      />
    </Flex>
  )
}


