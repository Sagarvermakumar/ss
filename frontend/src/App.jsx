import { Container, Box, Heading, Flex, Text, Link as ChakraLink } from '@chakra-ui/react'
import { Routes, Route, Link } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import ChildPage from './pages/ChildPage'
import AdminPage from './pages/AdminPage'
import Navbar from './components/Navbar'
import useBrandColor from './hooks/useBrandColor'

export default function App() {
  const { card } = useBrandColor()
  return (
    <SocketProvider>
      <Container maxW="6xl" py={6}>
        <Navbar />
        <Flex justify="space-between" align="center" mb={4}>
          <Flex gap={4}>
            <ChakraLink as={Link} to="/child">Child</ChakraLink>
            <ChakraLink as={Link} to="/admin">Admin</ChakraLink>
          </Flex>
        </Flex>
        <Box bg={card} borderRadius="md" boxShadow="sm" p={4}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/child" element={<ChildPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Box>
      </Container>
    </SocketProvider>
  )
}

function Home() {
  return (
    <Box>
      <Heading size="md" mb={2}>Welcome</Heading>
      <Text>Choose a role above to begin.</Text>
    </Box>
  )
}


