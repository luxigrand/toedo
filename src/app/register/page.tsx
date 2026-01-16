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

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

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
