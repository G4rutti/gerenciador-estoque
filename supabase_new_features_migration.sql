-- Migration: New features - stock exits, expense scheduling, balance tracking, recipe production
-- Execute this in the Supabase SQL Editor

-- 1. Create stock_exits table (consumo pessoal, doação, perda)
CREATE TABLE IF NOT EXISTS stock_exits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
  data TEXT NOT NULL,
  qtd NUMERIC NOT NULL,
  motivo TEXT NOT NULL, -- 'consumo_pessoal', 'doacao', 'perda'
  obs TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_exits_product ON stock_exits(product_id);

ALTER TABLE stock_exits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for stock_exits" ON stock_exits
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Add data_vencimento to expenses (agendamento de pagamento)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS data_vencimento TEXT;

-- 3. Add metodo_pagamento to expenses (para balanço recebido vs pago)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;

-- 4. Add produto_final_id and rendimento_qtd to recipes (produção → produto final)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS produto_final_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rendimento_qtd NUMERIC DEFAULT 0;
