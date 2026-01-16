'use client'

import { useState, useEffect, useRef } from 'react'
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
  Checkbox,
  IconButton,
  Flex,
  useColorModeValue,
  Spinner,
  useToast,
} from '@chakra-ui/react'
import { DeleteIcon, AddIcon } from '@chakra-ui/icons'
import { supabase } from '@/lib/supabase'
import type { Todo } from '@/lib/database.types'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

function HomeContent() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const toast = useToast()
  const isInitialLoad = useRef(true)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Fetch todos on mount and set up interval for realtime updates
  useEffect(() => {
    fetchTodos()

    // Set up interval to refresh todos every 1.5 seconds (between 1-2 seconds)
    const interval = setInterval(() => {
      fetchTodos()
    }, 1500)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      // Only show error toast if it's not the initial load (to avoid spam)
      if (isInitialLoad.current) {
        toast({
          title: 'Hata',
          description: 'Görevler yüklenirken bir hata oluştu',
          status: 'error',
          duration: 3000,
        })
      }
    } finally {
      // Only set loading to false on initial load
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    }
  }

  const addTodo = async () => {
    if (newTodo.trim() === '') return

    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({ text: newTodo.trim() })
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
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

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
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id)

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const completedCount = todos.filter((t) => t.completed).length

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Başarılı',
        description: 'Çıkış yapıldı',
        status: 'success',
        duration: 2000,
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Box minH="100vh" bg={bgColor} py={10}>
      <Container maxW="container.md">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <VStack spacing={2} align="flex-start">
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, teal.400, blue.500)"
              bgClip="text"
              fontWeight="extrabold"
            >
              toedo
            </Heading>
            <Text color="gray.500" fontSize="lg">
              Basit ve şık yapılacaklar listesi
            </Text>
            {user && (
              <Text color="gray.400" fontSize="sm">
                {user.email}
              </Text>
            )}
          </VStack>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={handleLogout}
            size="md"
          >
            Çıkış Yap
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
              onKeyPress={handleKeyPress}
              size="lg"
              borderRadius="lg"
              focusBorderColor="teal.400"
              disabled={adding}
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
              Görevlerim
            </Text>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                {completedCount} / {todos.length} tamamlandı
              </Text>
            </HStack>
          </Flex>

          {/* Todo Items */}
          <VStack spacing={0} align="stretch">
            {loading ? (
              <Box py={12} textAlign="center">
                <Spinner size="lg" color="teal.400" />
                <Text color="gray.400" fontSize="lg" mt={4}>
                  Görevler yükleniyor...
                </Text>
              </Box>
            ) : todos.length === 0 ? (
              <Box py={12} textAlign="center">
                <Text color="gray.400" fontSize="lg">
                  Henüz görev eklenmemiş 📝
                </Text>
                <Text color="gray.400" fontSize="sm" mt={2}>
                  Yukarıdaki alana yazarak yeni görev ekleyebilirsin
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
          toedo ile görevlerini takip et ✨
        </Text>
      </Container>
    </Box>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}
