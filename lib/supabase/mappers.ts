import { Expense, ManualPayment, Product, Purchase, Sale } from "../types";

export type ProductRow = {
  id: string;
  nome: string;
  unidade: string;
  ncm: string;
  cest: string;
  preco_venda: number;
  custo_atual: number;
  estoque: number;
};

export type PurchaseRow = {
  id: string;
  product_id: string;
  data: string;
  local: string;
  preco: number;
  qtd: number;
};

export type SaleRow = {
  id: string;
  data: string;
  itens: Sale["itens"];
  total: number;
  pagamento: Sale["pagamento"];
};

export type ManualPaymentRow = {
  id: string;
  data: string;
  tipo: ManualPayment["tipo"];
  valor: number;
  obs: string;
};

export type ExpenseRow = {
  id: string;
  data: string;
  tipo: Expense["tipo"];
  descricao: string;
  valor: number;
  pago: boolean;
};

export const productFromRow = (r: ProductRow): Product => ({
  id: r.id,
  nome: r.nome,
  unidade: r.unidade as Product["unidade"],
  ncm: r.ncm,
  cest: r.cest,
  precoVenda: Number(r.preco_venda),
  custoAtual: Number(r.custo_atual),
  estoque: Number(r.estoque),
});

export const purchaseFromRow = (r: PurchaseRow): Purchase => ({
  id: r.id,
  productId: r.product_id,
  data: r.data,
  local: r.local,
  preco: Number(r.preco),
  qtd: Number(r.qtd),
});

export const saleFromRow = (r: SaleRow): Sale => ({
  id: r.id,
  data: r.data,
  itens: r.itens,
  total: Number(r.total),
  pagamento: r.pagamento,
});

export const manualPaymentFromRow = (r: ManualPaymentRow): ManualPayment => ({
  id: r.id,
  data: r.data,
  tipo: r.tipo,
  valor: Number(r.valor),
  obs: r.obs,
});

export const expenseFromRow = (r: ExpenseRow): Expense => ({
  id: r.id,
  data: r.data,
  tipo: r.tipo,
  descricao: r.descricao,
  valor: Number(r.valor),
  pago: r.pago,
});
