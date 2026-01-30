'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Checkbox,
  IconButton,
  Flex,
  useColorModeValue,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  InputGroup,
  InputRightElement,
  Badge,
} from '@chakra-ui/react'
import { DeleteIcon, ViewIcon, ViewOffIcon, LockIcon, AddIcon } from '@chakra-ui/icons'
import { supabase } from '@/lib/supabase'
import type { Todo, Workspace } from '@/lib/database.types'
import { verifySecureToken } from '@/lib/token-utils'

export default function PublicWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = parseInt(params.id as string)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [newTodo, setNewTodo] = useState('')
  const [adding, setAdding] = useState(false)
  const [updatingTodoId, setUpdatingTodoId] = useState<number | null>(null)
  const toast = useToast()

  // Get token from URL
  const getTokenFromUrl = () => {
    if (typeof window === 'undefined') return null
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('token')
  }

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    if (workspaceId && !isNaN(workspaceId)) {
      checkAccessAndLoadWorkspace()
    } else {
      toast({
        title: 'Hata',
        description: 'Geçersiz workspace ID',
        status: 'error',
        duration: 3000,
      })
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  }, [workspaceId])

  const checkAccessAndLoadWorkspace = async () => {
    setLoading(true)
    try {
      console.log('Loading workspace:', workspaceId)
      
      // Check for secure token in URL first
      const urlToken = getTokenFromUrl()
      let tokenValid = false
      if (urlToken) {
        const tokenResult = verifySecureToken(urlToken)
        if (tokenResult.valid && tokenResult.workspaceId === workspaceId && tokenResult.password) {
          // Token is valid, store password and grant access
          localStorage.setItem(`workspace_access_${workspaceId}`, tokenResult.password)
          tokenValid = true
          // Remove token from URL
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', `/workspace/${workspaceId}`)
          }
        } else if (tokenResult.expired) {
          toast({
            title: 'Link Süresi Doldu',
            description: 'Bu link 30 dakika geçerliydi. Yeni bir link isteyin.',
            status: 'error',
            duration: 4000,
          })
          setTimeout(() => {
            router.push('/')
          }, 2000)
          return
        } else {
          toast({
            title: 'Geçersiz Link',
            description: 'Bu link geçersiz veya bozuk.',
            status: 'error',
            duration: 3000,
          })
        }
      }
      
      // Check if password is stored in localStorage
      const storedPassword = localStorage.getItem(`workspace_access_${workspaceId}`)
      
      // Fetch workspace
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspace')
        .select('*')
        .eq('id', workspaceId)
        .single()

      if (workspaceError) {
        console.error('Workspace error:', workspaceError)
        throw workspaceError
      }

      if (!workspaceData) {
        console.error('Workspace not found:', workspaceId)
        toast({
          title: 'Hata',
          description: 'Workspace bulunamadı',
          status: 'error',
          duration: 3000,
        })
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      console.log('Workspace data:', workspaceData)
      console.log('Is public:', workspaceData.is_public)

      // Check if workspace is public
      if (!workspaceData.is_public || workspaceData.is_public === null) {
        console.log('Workspace is not public')
        toast({
          title: 'Erişim Reddedildi',
          description: 'Bu workspace public değil. Workspace sahibi workspace\'i public yapmalı.',
          status: 'error',
          duration: 4000,
        })
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      setWorkspace(workspaceData)

      // Check if password is required
      if (workspaceData.password) {
        // If password is stored and matches, grant access
        if (storedPassword === workspaceData.password || tokenValid) {
          setHasAccess(true)
          loadTodos()
        } else {
          // Show password modal
          setShowPasswordModal(true)
        }
      } else {
        // No password required, grant access
        setHasAccess(true)
        loadTodos()
      }
    } catch (error: any) {
      console.error('Workspace load error:', error)
      toast({
        title: 'Hata',
        description: error?.message || 'Workspace yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const verifyPassword = async () => {
    if (!workspace || !password.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen şifre girin',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setVerifying(true)
    try {
      if (password.trim() === workspace.password) {
        // Store password in localStorage
        localStorage.setItem(`workspace_access_${workspaceId}`, password.trim())
        setHasAccess(true)
        setShowPasswordModal(false)
        setPassword('')
        loadTodos()
        toast({
          title: 'Başarılı',
          description: 'Erişim sağlandı',
          status: 'success',
          duration: 2000,
        })
      } else {
        toast({
          title: 'Hata',
          description: 'Şifre yanlış',
          status: 'error',
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Şifre doğrulanırken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setVerifying(false)
    }
  }

  const loadTodos = async () => {
    if (!workspaceId) return

    try {
      // For public workspaces, show all todos (no user_id filter)
      const { data, error } = await supabase
        .from('todo')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görevler yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const addTodo = async () => {
    if (newTodo.trim() === '' || !workspaceId) return

    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('todo')
        .insert({ 
          text: newTodo.trim(),
          workspace_id: workspaceId,
          user_id: null // Public workspace'te user_id null olabilir
        })
        .select()
        .single()

      if (error) throw error
      setTodos([data, ...todos])
      setNewTodo('')
      toast({
        title: 'Başarılı',
        description: 'Görev eklendi',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görev eklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setAdding(false)
    }
  }

  const toggleTodo = async (id: number, completed: boolean) => {
    if (!workspaceId) return

    try {
      const { error } = await supabase
        .from('todo')
        .update({ completed: !completed })
        .eq('id', id)
        .eq('workspace_id', workspaceId)

      if (error) throw error
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      )
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görev güncellenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const deleteTodo = async (id: number) => {
    if (!workspaceId) return

    try {
      const { error } = await supabase
        .from('todo')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)

      if (error) throw error
      setTodos(todos.filter((todo) => todo.id !== id))
      toast({
        title: 'Başarılı',
        description: 'Görev silindi',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görev silinirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const completedCount = todos.filter((t) => t.completed).length

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} py={10}>
        <Container maxW="container.md">
          <Flex justify="center" align="center" minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="teal.400" />
              <Text color="gray.500">Yükleniyor...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  // Show loading or password modal, don't return null
  if (!workspace) {
    return (
      <Box minH="100vh" bg={bgColor} py={10}>
        <Container maxW="container.md">
          <Flex justify="center" align="center" minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="teal.400" />
              <Text color="gray.500">Workspace yükleniyor...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  if (!hasAccess && !showPasswordModal) {
    return (
      <Box minH="100vh" bg={bgColor} py={10}>
        <Container maxW="container.md">
          <Flex justify="center" align="center" minH="50vh">
            <VStack spacing={4}>
              <Text color="gray.500">Erişim kontrol ediliyor...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg={bgColor} py={10}>
      <Container maxW="container.md">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <VStack spacing={2} align="flex-start">
            <HStack>
              <Heading
                as="h1"
                size="2xl"
                bgGradient="linear(to-r, teal.400, blue.500)"
                bgClip="text"
                fontWeight="extrabold"
              >
                toedo
              </Heading>
              <Badge colorScheme="green">Public</Badge>
            </HStack>
            <Text color="gray.500" fontSize="lg">
              {workspace.name || 'Adsız alan'}
            </Text>
          </VStack>
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={() => router.push('/')}
            size="md"
          >
            Ana Sayfaya Dön
          </Button>
        </Flex>

        {/* Add Todo Form */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="xl"
          boxShadow="lg"
          border="1px"
          borderColor={borderColor}
          mb={6}
        >
          <HStack>
            <Input
              placeholder="Yeni görev ekle..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTodo()
                }
              }}
              size="lg"
              borderRadius="lg"
              focusBorderColor="teal.400"
              disabled={adding || !hasAccess}
            />
            <Button
              colorScheme="teal"
              size="lg"
              onClick={addTodo}
              leftIcon={adding ? <Spinner size="sm" /> : <AddIcon />}
              borderRadius="lg"
              px={6}
              variant="solid"
              isLoading={adding}
              loadingText="Ekleniyor"
              disabled={!hasAccess}
            >
              Ekle
            </Button>
          </HStack>
        </Box>

        {/* Todo List */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          {/* Stats Header */}
          <Flex
            px={6}
            py={4}
            borderBottom="1px"
            borderColor={borderColor}
            justify="space-between"
            align="center"
          >
            <Text fontWeight="semibold" color="gray.600">
              Görevler
            </Text>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                {completedCount} / {todos.length} tamamlandı
              </Text>
            </HStack>
          </Flex>

          {/* Todo Items */}
          <VStack spacing={0} align="stretch">
            {todos.length === 0 ? (
              <Box py={12} textAlign="center">
                <Text color="gray.400" fontSize="lg">
                  Henüz görev eklenmemiş 📝
                </Text>
              </Box>
            ) : (
              todos.map((todo, index) => (
                <HStack
                  key={todo.id}
                  px={6}
                  py={4}
                  borderBottom={index < todos.length - 1 ? '1px' : 'none'}
                  borderColor={borderColor}
                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                  transition="background 0.2s"
                  justify="space-between"
                >
                  <HStack spacing={4} flex={1}>
                    <Checkbox
                      isChecked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                      colorScheme="teal"
                      size="lg"
                    />
                    <Text
                      fontSize="md"
                      textDecoration={todo.completed ? 'line-through' : 'none'}
                      color={todo.completed ? 'gray.400' : 'inherit'}
                      transition="all 0.2s"
                    >
                      {todo.text}
                    </Text>
                  </HStack>
                  <IconButton
                    aria-label="Görevi sil"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                    _hover={{ bg: 'red.100' }}
                  />
                </HStack>
              ))
            )}
          </VStack>
        </Box>

        {/* Footer */}
        <Text textAlign="center" mt={8} color="gray.400" fontSize="sm">
          Bu bir public workspace'tir - Sadece görüntüleme modu
        </Text>
      </Container>

      {/* Password Modal */}
      <Modal 
        isOpen={showPasswordModal} 
        onClose={() => {
          // Don't allow closing without password
        }} 
        isCentered
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Şifre Gerekli</ModalHeader>
          <ModalCloseButton isDisabled />
          <ModalBody>
            <VStack spacing={4}>
              <HStack>
                <LockIcon />
                <Text>Bu workspace şifre korumalıdır</Text>
              </HStack>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifre girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && password.trim()) {
                      verifyPassword()
                    }
                  }}
                  autoFocus
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                    h="1.75rem"
                  />
                </InputRightElement>
              </InputGroup>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              onClick={verifyPassword}
              isLoading={verifying}
              isDisabled={!password.trim()}
            >
              Giriş Yap
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
