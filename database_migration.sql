-- Workspace tablosuna is_public ve password alanlarını ekleme
-- Supabase PostgreSQL için migration script

-- is_public alanını ekle (boolean, default: false)
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- password alanını ekle (text, nullable)
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Mevcut kayıtlar için is_public değerini false olarak ayarla (güvenlik için)
UPDATE workspace 
SET is_public = false 
WHERE is_public IS NULL;

-- İsteğe bağlı: is_public için NOT NULL constraint ekle (opsiyonel)
-- ALTER TABLE workspace 
-- ALTER COLUMN is_public SET NOT NULL;

-- İsteğe bağlı: Index ekle (public workspace'leri hızlı sorgulamak için)
CREATE INDEX IF NOT EXISTS idx_workspace_is_public ON workspace(is_public) WHERE is_public = true;
