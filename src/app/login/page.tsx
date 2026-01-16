'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  VStack,
  Text,
  useColorModeValue,
  useToast,
  Link,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: 'Hata',
        description: 'Lütfen email ve şifre girin',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Giriş yapıldı',
        status: 'success',
        duration: 2000,
      })

      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Giriş yapılırken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg={bgColor} py={10}>
      <Container maxW="container.sm">
        <Box
          bg={cardBg}
          p={8}
          borderRadius="xl"
          boxShadow="lg"
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            <Heading
              as="h1"
              size="xl"
              bgGradient="linear(to-r, teal.400, blue.500)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Giriş Yap
            </Heading>

            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    size="lg"
                    borderRadius="lg"
                    focusBorderColor="teal.400"
                    disabled={loading}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Şifre</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifrenizi girin"
                      size="lg"
                      borderRadius="lg"
                      focusBorderColor="teal.400"
                      disabled={loading}
                    />
                    <InputRightElement height="100%">
                      <IconButton
                        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        h="100%"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  size="lg"
                  width="100%"
                  borderRadius="lg"
                  isLoading={loading}
                  loadingText="Giriş yapılıyor..."
                >
                  Giriş Yap
                </Button>
              </VStack>
            </form>

            <Text>
              Hesabınız yok mu?{' '}
              <Link
                href="/register"
                color="teal.400"
                fontWeight="semibold"
                _hover={{ textDecoration: 'underline' }}
              >
                Kayıt ol
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
