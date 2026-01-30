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
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { DeleteIcon, AddIcon, EditIcon, CheckIcon, CloseIcon, SettingsIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { supabase } from '@/lib/supabase'
import type { Todo, Workspace } from '@/lib/database.types'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { WorkspaceSettings } from '@/components/WorkspaceSettings'

function HomeContent() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const [newTodo, setNewTodo] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null)
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [updatingWorkspace, setUpdatingWorkspace] = useState(false)
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<number | null>(null)
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [settingsWorkspaceId, setSettingsWorkspaceId] = useState<number | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinWorkspaceId, setJoinWorkspaceId] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [showJoinPassword, setShowJoinPassword] = useState(false)
  const [joining, setJoining] = useState(false)
  const toast = useToast()
  const isInitialLoad = useRef(true)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const createDefaultWorkspace = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('workspace')
        .insert({ name: 'Adsız alan', user_id: user.id })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setWorkspaces([data])
        setSelectedWorkspaceId(data.id)
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Varsayılan workspace oluşturulurken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const initializeWorkspaces = async () => {
    if (!user?.id) return

    setLoadingWorkspaces(true)
    try {
      const { data, error } = await supabase
        .from('workspace')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setWorkspaces(data)
        setSelectedWorkspaceId(data[0].id)
      } else {
        // Auto-create default workspace if none exists
        await createDefaultWorkspace()
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Workspace\'ler yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingWorkspaces(false)
    }
  }

  // Fetch workspaces and set up workspace management
  useEffect(() => {
    if (user?.id) {
      initializeWorkspaces()
    }
  }, [user?.id])

  // Fetch todos when workspace changes
  useEffect(() => {
    if (selectedWorkspaceId && user?.id) {
      fetchTodos()

      // Set up interval to refresh todos every 1.5 seconds (between 1-2 seconds)
      const interval = setInterval(() => {
        fetchTodos()
      }, 1500)

      // Cleanup interval on unmount
      return () => clearInterval(interval)
    }
  }, [selectedWorkspaceId, user?.id])

  const fetchWorkspaces = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('workspace')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setWorkspaces(data || [])
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Workspace\'ler yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const createWorkspace = async () => {
    if (!user?.id || newWorkspaceName.trim() === '') return

    setCreatingWorkspace(true)
    try {
      const { data, error } = await supabase
        .from('workspace')
        .insert({ name: newWorkspaceName.trim() || 'Adsız alan', user_id: user.id })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setWorkspaces([...workspaces, data])
        setSelectedWorkspaceId(data.id)
        setNewWorkspaceName('')
        toast({
          title: 'Başarılı',
          description: 'Workspace oluşturuldu',
          status: 'success',
          duration: 2000,
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Workspace oluşturulurken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setCreatingWorkspace(false)
    }
  }

  const startEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspaceId(workspace.id)
    setEditingWorkspaceName(workspace.name || '')
  }

  const cancelEditWorkspace = () => {
    setEditingWorkspaceId(null)
    setEditingWorkspaceName('')
  }

  const updateWorkspace = async (workspaceId: number) => {
    if (!user?.id || editingWorkspaceName.trim() === '') return

    setUpdatingWorkspace(true)
    try {
      const { data, error } = await supabase
        .from('workspace')
        .update({ name: editingWorkspaceName.trim() || 'Adsız alan' })
        .eq('id', workspaceId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setWorkspaces(workspaces.map((w) => (w.id === workspaceId ? data : w)))
        setEditingWorkspaceId(null)
        setEditingWorkspaceName('')
        toast({
          title: 'Başarılı',
          description: 'Workspace adı güncellendi',
          status: 'success',
          duration: 2000,
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Workspace güncellenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setUpdatingWorkspace(false)
    }
  }

  const deleteWorkspace = async (workspaceId: number) => {
    if (!user?.id || workspaces.length <= 1) {
      toast({
        title: 'Uyarı',
        description: 'En az bir workspace olmalıdır',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setDeletingWorkspaceId(workspaceId)
    try {
      const { error } = await supabase
        .from('workspace')
        .delete()
        .eq('id', workspaceId)
        .eq('user_id', user.id)

      if (error) throw error

      const remainingWorkspaces = workspaces.filter((w) => w.id !== workspaceId)
      setWorkspaces(remainingWorkspaces)

      // If deleted workspace was selected, select the first available one
      if (selectedWorkspaceId === workspaceId) {
        setSelectedWorkspaceId(remainingWorkspaces[0]?.id || null)
      }

      toast({
        title: 'Başarılı',
        description: 'Workspace silindi',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Workspace silinirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setDeletingWorkspaceId(null)
    }
  }

  const fetchTodos = async () => {
    if (!selectedWorkspaceId) return

    try {
      const { data, error } = await supabase
        .from('todo')
        .select('*')
        .eq('workspace_id', selectedWorkspaceId)
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
    if (newTodo.trim() === '' || !selectedWorkspaceId || !user?.id) return

    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('todo')
        .insert({ 
          text: newTodo.trim(),
          workspace_id: selectedWorkspaceId,
          user_id: user.id // Kullanıcı bilgisi için saklanıyor ama filtreleme yapılmıyor
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
    if (!selectedWorkspaceId) return

    try {
      const { error } = await supabase
        .from('todo')
        .update({ completed: !completed })
        .eq('id', id)
        .eq('workspace_id', selectedWorkspaceId)

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
    if (!selectedWorkspaceId) return

    try {
      const { error } = await supabase
        .from('todo')
        .delete()
        .eq('id', id)
        .eq('workspace_id', selectedWorkspaceId)

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
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId)
  const settingsWorkspace = workspaces.find((w) => w.id === settingsWorkspaceId)

  const openWorkspaceSettings = (workspaceId: number) => {
    setSettingsWorkspaceId(workspaceId)
  }

  const closeWorkspaceSettings = () => {
    setSettingsWorkspaceId(null)
  }

  const refreshWorkspaces = async () => {
    await fetchWorkspaces()
  }

  const handleJoinWorkspace = async () => {
    const workspaceIdNum = parseInt(joinWorkspaceId)
    if (!workspaceIdNum || isNaN(workspaceIdNum)) {
      toast({
        title: 'Hata',
        description: 'Geçerli bir workspace ID girin',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setJoining(true)
    try {
      // Fetch workspace
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspace')
        .select('*')
        .eq('id', workspaceIdNum)
        .single()

      if (workspaceError) throw workspaceError

      if (!workspaceData) {
        toast({
          title: 'Hata',
          description: 'Workspace bulunamadı',
          status: 'error',
          duration: 3000,
        })
        return
      }

      // Check if workspace is public
      if (!workspaceData.is_public) {
        toast({
          title: 'Hata',
          description: 'Bu workspace public değil',
          status: 'error',
          duration: 3000,
        })
        return
      }

      // Check password if required
      if (workspaceData.password) {
        if (joinPassword.trim() !== workspaceData.password) {
          toast({
            title: 'Hata',
            description: 'Şifre yanlış',
            status: 'error',
            duration: 3000,
          })
          return
        }
        // Store password in localStorage
        localStorage.setItem(`workspace_access_${workspaceIdNum}`, joinPassword.trim())
      }

      // Redirect to public workspace page
      router.push(`/workspace/${workspaceIdNum}`)
      toast({
        title: 'Başarılı',
        description: 'Workspace\'e katıldınız',
        status: 'success',
        duration: 2000,
      })
      setShowJoinModal(false)
      setJoinWorkspaceId('')
      setJoinPassword('')
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error?.message || 'Workspace\'e katılırken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setJoining(false)
    }
  }

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
          <HStack spacing={3}>
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={() => setShowJoinModal(true)}
              size="md"
            >
              Workspace'e Katıl
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleLogout}
              size="md"
            >
              Çıkış Yap
            </Button>
          </HStack>
        </Flex>

        {/* Workspace Management */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="xl"
          boxShadow="lg"
          border="1px"
          borderColor={borderColor}
          mb={6}
        >
          <VStack spacing={4} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <Heading size="md" color="gray.700">
                Workspace'lerim
              </Heading>
              <HStack>
                <Input
                  placeholder="Yeni workspace adı..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  size="md"
                  maxW="250px"
                  borderRadius="lg"
                  focusBorderColor="teal.400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createWorkspace()
                    }
                  }}
                />
                <Button
                  colorScheme="teal"
                  size="md"
                  onClick={createWorkspace}
                  leftIcon={creatingWorkspace ? <Spinner size="sm" /> : <AddIcon />}
                  borderRadius="lg"
                  isLoading={creatingWorkspace}
                  loadingText="Oluşturuluyor"
                  isDisabled={!newWorkspaceName.trim()}
                >
                  Ekle
                </Button>
              </HStack>
            </Flex>

            {/* Workspace List */}
            {loadingWorkspaces ? (
              <Box py={8} textAlign="center">
                <Spinner size="lg" color="teal.400" />
                <Text color="gray.400" fontSize="sm" mt={2}>
                  Workspace'ler yükleniyor...
                </Text>
              </Box>
            ) : workspaces.length === 0 ? (
              <Box py={8} textAlign="center">
                <Text color="gray.400" fontSize="md">
                  Henüz workspace yok. Yukarıdan yeni bir workspace oluşturun.
                </Text>
              </Box>
            ) : (
              <VStack spacing={2} align="stretch">
                {workspaces.map((workspace) => (
                  <Box
                    key={workspace.id}
                    p={4}
                    borderRadius="lg"
                    border="2px"
                    borderColor={
                      selectedWorkspaceId === workspace.id
                        ? 'teal.400'
                        : borderColor
                    }
                    bg={
                      selectedWorkspaceId === workspace.id
                        ? useColorModeValue('teal.50', 'teal.900')
                        : 'transparent'
                    }
                    _hover={{
                      borderColor: 'teal.300',
                      bg: useColorModeValue('gray.50', 'gray.700'),
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => setSelectedWorkspaceId(workspace.id)}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack flex={1} spacing={3}>
                        {editingWorkspaceId === workspace.id ? (
                          <HStack flex={1} spacing={2}>
                            <Input
                              value={editingWorkspaceName}
                              onChange={(e) =>
                                setEditingWorkspaceName(e.target.value)
                              }
                              size="sm"
                              borderRadius="md"
                              focusBorderColor="teal.400"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateWorkspace(workspace.id)
                                } else if (e.key === 'Escape') {
                                  cancelEditWorkspace()
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            <IconButton
                              aria-label="Kaydet"
                              icon={<CheckIcon />}
                              size="sm"
                              colorScheme="teal"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateWorkspace(workspace.id)
                              }}
                              isLoading={updatingWorkspace}
                            />
                            <IconButton
                              aria-label="İptal"
                              icon={<CloseIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelEditWorkspace()
                              }}
                            />
                          </HStack>
                        ) : (
                          <>
                            <Box
                              w="12px"
                              h="12px"
                              borderRadius="full"
                              bg={
                                selectedWorkspaceId === workspace.id
                                  ? 'teal.400'
                                  : 'gray.300'
                              }
                            />
                            <HStack spacing={2}>
                            <Text
                              fontWeight={
                                selectedWorkspaceId === workspace.id
                                  ? 'semibold'
                                  : 'normal'
                              }
                              color={
                                selectedWorkspaceId === workspace.id
                                  ? 'teal.600'
                                  : 'gray.700'
                              }
                              fontSize="md"
                            >
                              {workspace.name || 'Adsız alan'} <Text as="span" fontSize="xs" color="gray.400">(ID: {workspace.id})</Text>
                            </Text>
                              {workspace.is_public && (
                                <Badge colorScheme="green" fontSize="xs">
                                  Public
                                </Badge>
                              )}
                              {workspace.password && (
                                <LockIcon color="orange.500" boxSize={3} />
                              )}
                            </HStack>
                          </>
                        )}
                      </HStack>
                      {editingWorkspaceId !== workspace.id && (
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Ayarlar"
                            icon={<SettingsIcon />}
                            size="sm"
                            colorScheme="teal"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              openWorkspaceSettings(workspace.id)
                            }}
                          />
                          <IconButton
                            aria-label="Düzenle"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditWorkspace(workspace)
                            }}
                          />
                          <IconButton
                            aria-label="Sil"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteWorkspace(workspace.id)
                            }}
                            isLoading={deletingWorkspaceId === workspace.id}
                            isDisabled={workspaces.length <= 1}
                          />
                        </HStack>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>

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
              placeholder={selectedWorkspaceId ? "Yeni görev ekle..." : "Workspace seçin..."}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              size="lg"
              borderRadius="lg"
              focusBorderColor="teal.400"
              disabled={adding || !selectedWorkspaceId}
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
              disabled={!selectedWorkspaceId}
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
              {selectedWorkspace ? `${selectedWorkspace.name || 'Adsız alan'} (ID: ${selectedWorkspace.id}) - Görevlerim` : 'Görevlerim'}
            </Text>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                {completedCount} / {todos.length} tamamlandı
              </Text>
            </HStack>
          </Flex>

          {/* Todo Items */}
          <VStack spacing={0} align="stretch">
            {loadingWorkspaces || loading ? (
              <Box py={12} textAlign="center">
                <Spinner size="lg" color="teal.400" />
                <Text color="gray.400" fontSize="lg" mt={4}>
                  {loadingWorkspaces ? 'Workspace\'ler yükleniyor...' : 'Görevler yükleniyor...'}
                </Text>
              </Box>
            ) : !selectedWorkspaceId ? (
              <Box py={12} textAlign="center">
                <Text color="gray.400" fontSize="lg">
                  Lütfen bir workspace seçin
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

      {/* Workspace Settings Drawer */}
      {settingsWorkspace && (
        <WorkspaceSettings
          isOpen={settingsWorkspaceId !== null}
          onClose={closeWorkspaceSettings}
          workspace={settingsWorkspace}
          onUpdate={refreshWorkspaces}
        />
      )}

      {/* Join Workspace Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Workspace'e Katıl</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Workspace ID</FormLabel>
                <Input
                  placeholder="Workspace ID girin"
                  value={joinWorkspaceId}
                  onChange={(e) => setJoinWorkspaceId(e.target.value)}
                  type="number"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Şifre (Eğer şifreli ise)</FormLabel>
                <InputGroup>
                  <Input
                    type={showJoinPassword ? 'text' : 'password'}
                    placeholder="Şifre girin (opsiyonel)"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinWorkspace()
                      }
                    }}
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      aria-label={showJoinPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      icon={showJoinPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowJoinPassword(!showJoinPassword)}
                      variant="ghost"
                      size="sm"
                      h="1.75rem"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowJoinModal(false)}>
              İptal
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleJoinWorkspace}
              isLoading={joining}
              isDisabled={!joinWorkspaceId.trim()}
            >
              Katıl
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
