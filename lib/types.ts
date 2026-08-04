export type Unidade = "un" | "kg" | "g" | "l" | "ml";

export type Product = {
  id: string;
  nome: string;
  unidade: Unidade;
  ncm: string;
  cest: string;
  precoVenda: number;
  custoAtual: number;
  estoque: number;
};

export type Purchase = {
  id: string;
  productId: string;
  data: string;
  local: string;
  preco: number;
  qtd: number;
};

export type PagamentoMetodo = "pix" | "dinheiro" | "cartao";

export type SaleItem = {
  productId: string;
  nome: string;
  qtd: number;
  precoVenda: number;
};

export type Sale = {
  id: string;
  data: string;
  itens: SaleItem[];
  total: number;
  pagamento: PagamentoMetodo;
};

export type ManualPayment = {
  id: string;
  data: string;
  tipo: PagamentoMetodo;
  valor: number;
  obs: string;
};

export type ExpenseTipo = "mercado" | "geral";

export type Expense = {
  id: string;
  data: string;
  tipo: ExpenseTipo;
  descricao: string;
  valor: number;
  pago: boolean;
};

export type AppData = {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  manualPagamentos: ManualPayment[];
  expenses: Expense[];
};

export type View = "produtos" | "estoque" | "caixa" | "financeiro";
export type FinTab = "recebimentos" | "gastos";

export type ProductForm = {
  nome: string;
  unidade: Unidade;
  ncm: string;
  cest: string;
  precoVenda: string;
  custoInicial: string;
  estoqueInicial: string;
  editingId: string | null;
};

export type PurchaseForm = {
  local: string;
  preco: string;
  qtd: string;
  somar: boolean;
};

export type ManualPayForm = {
  tipo: PagamentoMetodo;
  valor: string;
  obs: string;
};

export type ExpenseForm = {
  tipo: ExpenseTipo;
  descricao: string;
  valor: string;
  pago: boolean;
};

export const UNIT_LABELS: Record<Unidade, string> = {
  un: "un",
  kg: "kg",
  g: "g",
  l: "l",
  ml: "ml",
};

export const emptyAppData = (): AppData => ({
  products: [],
  purchases: [],
  sales: [],
  manualPagamentos: [],
  expenses: [],
});

export const emptyProductForm = (): ProductForm => ({
  nome: "",
  unidade: "un",
  ncm: "",
  cest: "",
  precoVenda: "",
  custoInicial: "",
  estoqueInicial: "",
  editingId: null,
});

export const emptyPurchaseForm = (): PurchaseForm => ({
  local: "",
  preco: "",
  qtd: "",
  somar: true,
});

export const emptyManualPayForm = (): ManualPayForm => ({
  tipo: "pix",
  valor: "",
  obs: "",
});

export const emptyExpenseForm = (): ExpenseForm => ({
  tipo: "mercado",
  descricao: "",
  valor: "",
  pago: false,
});
