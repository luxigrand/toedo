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
  HStack,
  Text,
  useColorModeValue,
  useToast,
  Link,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
  Divider,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const dividerTextColor = useColorModeValue('gray.500', 'gray.400')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Lütfen tüm alanları doldurun',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Şifreler eşleşmiyor',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Hata',
        description: 'Şifre en az 6 karakter olmalıdır',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Kayıt başarıyla oluşturuldu',
        status: 'success',
        duration: 2000,
      })

      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kayıt olurken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) throw error
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Google ile kayıt olurken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
      setGoogleLoading(false)
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
              Kayıt Ol
            </Heading>

            <form onSubmit={handleRegister} style={{ width: '100%' }}>
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
                      placeholder="Şifrenizi girin (min. 6 karakter)"
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

                <FormControl isRequired>
                  <FormLabel>Şifre Tekrar</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Şifrenizi tekrar girin"
                      size="lg"
                      borderRadius="lg"
                      focusBorderColor="teal.400"
                      disabled={loading}
                    />
                    <InputRightElement height="100%">
                      <IconButton
                        aria-label={
                          showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'
                        }
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  loadingText="Kayıt yapılıyor..."
                >
                  Kayıt Ol
                </Button>
              </VStack>
            </form>

            <HStack width="100%" spacing={4}>
              <Divider />
              <Text fontSize="sm" color={dividerTextColor}>
                veya
              </Text>
              <Divider />
            </HStack>

            <Button
              onClick={handleGoogleRegister}
              size="lg"
              width="100%"
              borderRadius="lg"
              isLoading={googleLoading}
              loadingText="Yönlendiriliyor..."
              disabled={loading || googleLoading}
              variant="outline"
              borderColor={borderColor}
              _hover={{
                bg: hoverBg,
              }}
            >
              <HStack spacing={3}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <Text>Google ile Kayıt Ol</Text>
              </HStack>
            </Button>

            <Text>
              Zaten hesabınız var mı?{' '}
              <Link
                href="/login"
                color="teal.400"
                fontWeight="semibold"
                _hover={{ textDecoration: 'underline' }}
              >
                Giriş yap
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
