-- Migration: Add product variations support
-- Execute this in the Supabase SQL Editor

-- 1. Add variation_group_name column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS variation_group_name TEXT DEFAULT '';

-- 2. Create product_variations table
CREATE TABLE IF NOT EXISTS product_variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT DEFAULT '',
  preco_venda NUMERIC DEFAULT NULL,
  estoque INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations(product_id);

-- 4. Enable RLS (Row Level Security) - match your existing policy style
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust to match your existing policies)
CREATE POLICY "Allow all for authenticated" ON product_variations
  FOR ALL
  USING (true)
  WITH CHECK (true);
