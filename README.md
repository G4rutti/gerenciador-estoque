# Gerenciador de Estoque

App Next.js (App Router + TypeScript) para gestão de produtos, estoque, caixa (vendas) e financeiro (recebimentos/gastos) de um pequeno comércio. Dados persistidos em `localStorage` no navegador.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

- `app/` — rotas (App Router), layout e estilos globais (tokens de design em `app/globals.css`).
- `components/InventoryApp.tsx` — componente raiz, alterna entre as views.
- `components/views/` — telas de Produtos, Estoque, Caixa e Financeiro.
- `lib/useInventoryStore.ts` — estado da aplicação e regras de negócio (equivalente ao antigo componente de classe).
- `lib/types.ts`, `lib/format.ts` — tipos e helpers de formatação.
- `legacy/` — export original em formato de artifact (HTML autocontido) que serviu de referência para esta migração; mantido apenas para consulta.
