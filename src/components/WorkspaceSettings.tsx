'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Badge,
  useColorModeValue,
  Box,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon, CopyIcon, LockIcon } from '@chakra-ui/icons'
import { supabase } from '@/lib/supabase'
import type { Workspace } from '@/lib/database.types'
import { generateSecureToken } from '@/lib/token-utils'

interface WorkspaceSettingsProps {
  isOpen: boolean
  onClose: () => void
  workspace: Workspace
  onUpdate: () => void
}

export function WorkspaceSettings({
  isOpen,
  onClose,
  workspace,
  onUpdate,
}: WorkspaceSettingsProps) {
  const [isPublic, setIsPublic] = useState(workspace.is_public || false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [updating, setUpdating] = useState(false)
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Update state when workspace changes
  useEffect(() => {
    setIsPublic(workspace.is_public || false)
    setPassword('')
  }, [workspace])

  const copyWorkspaceLink = () => {
    const link = `${window.location.origin}/workspace/${workspace.id}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Başarılı',
      description: 'Link panoya kopyalandı',
      status: 'success',
      duration: 2000,
    })
  }

  const copySecureLink = () => {
    if (!workspace.password) {
      toast({
        title: 'Uyarı',
        description: 'Şifreli link oluşturmak için önce şifre belirlemelisiniz',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const token = generateSecureToken(workspace.id, workspace.password)
    const secureLink = `${window.location.origin}/workspace/${workspace.id}?token=${token}`
    navigator.clipboard.writeText(secureLink)
    toast({
      title: 'Başarılı',
      description: 'Şifreli link panoya kopyalandı (30 dakika geçerli)',
      status: 'success',
      duration: 3000,
    })
  }

  const togglePublic = async () => {
    const newIsPublic = !isPublic
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('workspace')
        .update({ is_public: newIsPublic })
        .eq('id', workspace.id)

      if (error) throw error

      setIsPublic(newIsPublic)
      onUpdate()
      toast({
        title: 'Başarılı',
        description: newIsPublic
          ? 'Workspace public yapıldı'
          : 'Workspace private yapıldı',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Workspace güncellenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setUpdating(false)
    }
  }

  const savePassword = async () => {
    setUpdating(true)
    try {
      const updateData: { password?: string | null } = {}
      if (password.trim() === '') {
        updateData.password = null
      } else {
        updateData.password = password.trim()
      }

      const { error } = await supabase
        .from('workspace')
        .update(updateData)
        .eq('id', workspace.id)

      if (error) throw error

      onUpdate()
      toast({
        title: 'Başarılı',
        description:
          password.trim() === ''
            ? 'Şifre kaldırıldı'
            : 'Şifre kaydedildi',
        status: 'success',
        duration: 2000,
      })
      setPassword('')
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Şifre kaydedilirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setUpdating(false)
    }
  }

  const removePassword = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('workspace')
        .update({ password: null })
        .eq('id', workspace.id)

      if (error) throw error

      onUpdate()
      setPassword('')
      toast({
        title: 'Başarılı',
        description: 'Şifre kaldırıldı',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Şifre kaldırılırken bir hata oluştu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px" borderColor={borderColor}>
          Workspace Ayarları
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch" pt={4}>
            {/* Workspace Name */}
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Workspace Adı
              </Text>
              <Text color="gray.500">{workspace.name || 'Adsız alan'}</Text>
            </Box>

            {/* Public/Private Toggle */}
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <VStack align="flex-start" spacing={1}>
                <FormLabel mb={0} fontWeight="semibold">
                  Public Workspace
                </FormLabel>
                <Text fontSize="sm" color="gray.500">
                  Workspace'i herkesin erişebileceği şekilde paylaş
                </Text>
              </VStack>
              <Switch
                isChecked={isPublic}
                onChange={togglePublic}
                colorScheme="teal"
                isDisabled={updating}
              />
            </FormControl>

            {/* Share Link */}
            {isPublic && (
              <Box
                p={4}
                borderRadius="lg"
                border="1px"
                borderColor={borderColor}
                bg={useColorModeValue('teal.50', 'teal.900')}
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Paylaşım Linki</Text>
                    <Badge colorScheme="green">Public</Badge>
                  </HStack>
                  <HStack>
                    <Input
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/workspace/${workspace.id}`}
                      isReadOnly
                      size="sm"
                      bg={useColorModeValue('white', 'gray.700')}
                    />
                    <IconButton
                      aria-label="Linki kopyala"
                      icon={<CopyIcon />}
                      onClick={copyWorkspaceLink}
                      colorScheme="teal"
                      size="sm"
                    />
                  </HStack>
                  {workspace.password && (
                    <VStack align="stretch" spacing={2} pt={2} borderTop="1px" borderColor={borderColor}>
                      <Text fontSize="sm" fontWeight="semibold" color="orange.600">
                        Şifreli Link (30 dakika geçerli)
                      </Text>
                      <Button
                        colorScheme="orange"
                        variant="outline"
                        size="sm"
                        leftIcon={<LockIcon />}
                        onClick={copySecureLink}
                      >
                        Şifreli Linki Kopyala
                      </Button>
                      <Text fontSize="xs" color="gray.500">
                        Bu link ile şifre sorulmadan direkt erişim sağlanır
                      </Text>
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}

            {/* Password Section */}
            {isPublic && (
              <Box
                p={4}
                borderRadius="lg"
                border="1px"
                borderColor={borderColor}
              >
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <VStack align="flex-start" spacing={1}>
                      <HStack>
                        <LockIcon />
                        <Text fontWeight="semibold">Erişim Şifresi</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        Opsiyonel: Workspace'e erişim için şifre belirle
                      </Text>
                    </VStack>
                    {workspace.password && (
                      <Badge colorScheme="orange">Şifreli</Badge>
                    )}
                  </HStack>

                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={
                        workspace.password
                          ? 'Yeni şifre girin (boş bırakırsanız şifre kaldırılır)'
                          : 'Şifre belirle'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="md"
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

                  <HStack>
                    <Button
                      colorScheme="teal"
                      onClick={savePassword}
                      isLoading={updating}
                      size="sm"
                      isDisabled={password.trim() === '' && !workspace.password}
                    >
                      {workspace.password ? 'Şifreyi Güncelle' : 'Şifre Ekle'}
                    </Button>
                    {workspace.password && (
                      <Button
                        colorScheme="red"
                        variant="outline"
                        onClick={removePassword}
                        isLoading={updating}
                        size="sm"
                      >
                        Şifreyi Kaldır
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Box>
            )}

            {!isPublic && (
              <Box
                p={4}
                borderRadius="lg"
                border="1px"
                borderColor={borderColor}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Workspace'i public yaparak paylaşım özelliklerini aktifleştirin
                </Text>
              </Box>
            )}
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTop="1px" borderColor={borderColor}>
          <Button variant="outline" mr={3} onClick={onClose}>
            Kapat
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
