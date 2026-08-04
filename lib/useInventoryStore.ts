"use client";

import { useEffect, useState } from "react";
import { todayStr } from "./format";
import { supabase } from "./supabase/client";
import {
  expenseFromRow,
  manualPaymentFromRow,
  productFromRow,
  purchaseFromRow,
  saleFromRow,
} from "./supabase/mappers";
import {
  AppData,
  Expense,
  ExpenseForm,
  FinTab,
  ManualPayForm,
  ManualPayment,
  PagamentoMetodo,
  Product,
  ProductForm,
  PurchaseForm,
  View,
  emptyAppData,
  emptyExpenseForm,
  emptyManualPayForm,
  emptyProductForm,
  emptyPurchaseForm,
} from "./types";

export function useInventoryStore() {
  const [view, setView] = useState<View>("produtos");
  const [data, setDataRaw] = useState<AppData>(emptyAppData());
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm());
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm());
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockEditValue, setStockEditValue] = useState("");
  const [cart, setCart] = useState<{ productId: string; qtd: number }[]>([]);
  const [caixaSearch, setCaixaSearch] = useState("");
  const [pagamentoMetodo, setPagamentoMetodo] = useState<PagamentoMetodo>("pix");
  const [finTab, setFinTab] = useState<FinTab>("recebimentos");
  const [manualPayForm, setManualPayForm] = useState<ManualPayForm>(emptyManualPayForm());
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [products, purchases, sales, manualPagamentos, expenses] = await Promise.all([
        supabase.from("products").select("*").order("created_at"),
        supabase.from("purchases").select("*").order("created_at"),
        supabase.from("sales").select("*").order("created_at"),
        supabase.from("manual_pagamentos").select("*").order("created_at"),
        supabase.from("expenses").select("*").order("created_at"),
      ]);
      if (cancelled) return;
      setDataRaw({
        products: (products.data ?? []).map(productFromRow),
        purchases: (purchases.data ?? []).map(purchaseFromRow),
        sales: (sales.data ?? []).map(saleFromRow),
        manualPagamentos: (manualPagamentos.data ?? []).map(manualPaymentFromRow),
        expenses: (expenses.data ?? []).map(expenseFromRow),
      });
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function field<F>(setter: React.Dispatch<React.SetStateAction<F>>, key: keyof F) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setter((s) => ({ ...s, [key]: e.target.value }));
  }
  function fieldChecked<F>(setter: React.Dispatch<React.SetStateAction<F>>, key: keyof F) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter((s) => ({ ...s, [key]: e.target.checked }));
  }

  // — navigation —
  const goProdutos = () => setView("produtos");
  const goEstoque = () => setView("estoque");
  const goCaixa = () => setView("caixa");
  const goFinanceiro = () => setView("financeiro");

  // — produtos —
  async function submitProductForm() {
    const f = productForm;
    if (!f.nome.trim()) return;
    if (f.editingId) {
      const { data: row, error } = await supabase
        .from("products")
        .update({
          nome: f.nome,
          unidade: f.unidade,
          ncm: f.ncm,
          cest: f.cest,
          preco_venda: Number(f.precoVenda) || 0,
        })
        .eq("id", f.editingId)
        .select()
        .single();
      if (error) {
        console.error(error);
        return;
      }
      const updated = productFromRow(row);
      setDataRaw((d) => ({ ...d, products: d.products.map((p) => (p.id === updated.id ? updated : p)) }));
    } else {
      const custo = Number(f.custoInicial) || 0;
      const estoque = Number(f.estoqueInicial) || 0;
      const { data: row, error } = await supabase
        .from("products")
        .insert({
          nome: f.nome,
          unidade: f.unidade,
          ncm: f.ncm,
          cest: f.cest,
          preco_venda: Number(f.precoVenda) || 0,
          custo_atual: custo,
          estoque,
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        return;
      }
      const novo = productFromRow(row);
      setDataRaw((d) => ({ ...d, products: [...d.products, novo] }));
      if (custo > 0) {
        const { data: pRow, error: pErr } = await supabase
          .from("purchases")
          .insert({ product_id: novo.id, data: todayStr(), local: "Cadastro inicial", preco: custo, qtd: estoque })
          .select()
          .single();
        if (pErr) {
          console.error(pErr);
        } else {
          const newPurchase = purchaseFromRow(pRow);
          setDataRaw((d) => ({ ...d, purchases: [...d.purchases, newPurchase] }));
        }
      }
    }
    setProductForm(emptyProductForm());
  }

  function startEditProduct(id: string) {
    const p = data.products.find((x) => x.id === id);
    if (!p) return;
    setProductForm({
      nome: p.nome,
      unidade: p.unidade,
      ncm: p.ncm,
      cest: p.cest,
      precoVenda: String(p.precoVenda),
      custoInicial: "",
      estoqueInicial: "",
      editingId: id,
    });
  }
  const cancelEditProduct = () => setProductForm(emptyProductForm());

  async function deleteProduct(id: string) {
    if (!window.confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    setDataRaw((d) => ({
      ...d,
      products: d.products.filter((p) => p.id !== id),
      purchases: d.purchases.filter((pu) => pu.productId !== id),
    }));
  }

  function toggleExpand(id: string) {
    setExpandedProductId(expandedProductId === id ? null : id);
    setPurchaseForm(emptyPurchaseForm());
  }

  async function submitPurchase(productId: string) {
    const f = purchaseForm;
    const preco = Number(f.preco) || 0;
    const qtd = Number(f.qtd) || 0;
    if (preco <= 0) return;
    const current = data.products.find((p) => p.id === productId);
    if (!current) return;
    const novoEstoque = f.somar ? current.estoque + qtd : current.estoque;
    const [{ data: prodRow, error: prodErr }, { data: purRow, error: purErr }] = await Promise.all([
      supabase.from("products").update({ custo_atual: preco, estoque: novoEstoque }).eq("id", productId).select().single(),
      supabase
        .from("purchases")
        .insert({ product_id: productId, data: todayStr(), local: f.local || "—", preco, qtd })
        .select()
        .single(),
    ]);
    if (prodErr || purErr) {
      console.error(prodErr || purErr);
      return;
    }
    const updatedProduct = productFromRow(prodRow);
    const newPurchase = purchaseFromRow(purRow);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === productId ? updatedProduct : p)),
      purchases: [...d.purchases, newPurchase],
    }));
    setPurchaseForm(emptyPurchaseForm());
  }

  // — estoque —
  async function adjustStock(id: string, delta: number) {
    const current = data.products.find((p) => p.id === id);
    if (!current) return;
    const novoEstoque = Math.max(0, current.estoque + delta);
    const { data: row, error } = await supabase.from("products").update({ estoque: novoEstoque }).eq("id", id).select().single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = productFromRow(row);
    setDataRaw((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? updated : p)) }));
  }
  function startSetStock(id: string, current: number) {
    setStockEditId(id);
    setStockEditValue(String(current));
  }
  const onStockEditChange = (e: React.ChangeEvent<HTMLInputElement>) => setStockEditValue(e.target.value);
  async function confirmSetStock() {
    const id = stockEditId;
    const val = Math.max(0, Number(stockEditValue) || 0);
    setStockEditId(null);
    if (!id) return;
    const { data: row, error } = await supabase.from("products").update({ estoque: val }).eq("id", id).select().single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = productFromRow(row);
    setDataRaw((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? updated : p)) }));
  }

  // — caixa —
  const onCaixaSearch = (e: React.ChangeEvent<HTMLInputElement>) => setCaixaSearch(e.target.value);
  function addToCart(productId: string) {
    const existing = cart.find((c) => c.productId === productId);
    if (existing) setCart(cart.map((c) => (c.productId === productId ? { ...c, qtd: c.qtd + 1 } : c)));
    else setCart([...cart, { productId, qtd: 1 }]);
  }
  const cartInc = (productId: string) => setCart(cart.map((c) => (c.productId === productId ? { ...c, qtd: c.qtd + 1 } : c)));
  const cartDec = (productId: string) =>
    setCart(cart.map((c) => (c.productId === productId ? { ...c, qtd: c.qtd - 1 } : c)).filter((c) => c.qtd > 0));
  const cartRemove = (productId: string) => setCart(cart.filter((c) => c.productId !== productId));
  const setPagamento = (m: PagamentoMetodo) => setPagamentoMetodo(m);

  async function finalizeSale() {
    if (cart.length === 0) return;
    const itens = cart.map((c) => {
      const p = data.products.find((x) => x.id === c.productId);
      return { productId: c.productId, nome: p ? p.nome : "?", qtd: c.qtd, precoVenda: p ? p.precoVenda : 0 };
    });
    const total = itens.reduce((sum, i) => sum + i.qtd * i.precoVenda, 0);
    const { data: saleRow, error: saleErr } = await supabase
      .from("sales")
      .insert({ data: todayStr(), itens, total, pagamento: pagamentoMetodo })
      .select()
      .single();
    if (saleErr) {
      console.error(saleErr);
      return;
    }
    const venda = saleFromRow(saleRow);
    const updates = await Promise.all(
      itens.map((i) => {
        const p = data.products.find((x) => x.id === i.productId);
        const novoEstoque = Math.max(0, (p ? p.estoque : 0) - i.qtd);
        return supabase.from("products").update({ estoque: novoEstoque }).eq("id", i.productId).select().single();
      })
    );
    const updatedProducts = new Map<string, Product>();
    updates.forEach((u) => {
      if (u.error) {
        console.error(u.error);
        return;
      }
      const prod = productFromRow(u.data);
      updatedProducts.set(prod.id, prod);
    });
    setDataRaw((d) => ({
      ...d,
      sales: [...d.sales, venda],
      products: d.products.map((p) => updatedProducts.get(p.id) ?? p),
    }));
    setCart([]);
  }

  // — financeiro —
  async function submitManualPayment() {
    const f = manualPayForm;
    const valor = Number(f.valor) || 0;
    if (valor <= 0) return;
    const { data: row, error } = await supabase
      .from("manual_pagamentos")
      .insert({ data: todayStr(), tipo: f.tipo, valor, obs: f.obs })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const pagamento: ManualPayment = manualPaymentFromRow(row);
    setDataRaw((d) => ({ ...d, manualPagamentos: [...d.manualPagamentos, pagamento] }));
    setManualPayForm(emptyManualPayForm());
  }
  async function deleteManualPayment(id: string) {
    const { error } = await supabase.from("manual_pagamentos").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    setDataRaw((d) => ({ ...d, manualPagamentos: d.manualPagamentos.filter((m) => m.id !== id) }));
  }

  async function submitExpense() {
    const f = expenseForm;
    const valor = Number(f.valor) || 0;
    if (valor <= 0 || !f.descricao.trim()) return;
    const { data: row, error } = await supabase
      .from("expenses")
      .insert({ data: todayStr(), tipo: f.tipo, descricao: f.descricao, valor, pago: f.pago })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const expense: Expense = expenseFromRow(row);
    setDataRaw((d) => ({ ...d, expenses: [...d.expenses, expense] }));
    setExpenseForm(emptyExpenseForm());
  }
  async function toggleExpensePaid(id: string) {
    const current = data.expenses.find((e) => e.id === id);
    if (!current) return;
    const { data: row, error } = await supabase
      .from("expenses")
      .update({ pago: !current.pago })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = expenseFromRow(row);
    setDataRaw((d) => ({ ...d, expenses: d.expenses.map((e) => (e.id === id ? updated : e)) }));
  }
  async function deleteExpense(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    setDataRaw((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
  }

  return {
    view,
    data,
    loading,
    goProdutos,
    goEstoque,
    goCaixa,
    goFinanceiro,

    productForm,
    setProductForm,
    field,
    fieldChecked,
    submitProductForm,
    startEditProduct,
    cancelEditProduct,
    deleteProduct,

    expandedProductId,
    toggleExpand,
    purchaseForm,
    setPurchaseForm,
    submitPurchase,

    stockEditId,
    stockEditValue,
    startSetStock,
    onStockEditChange,
    confirmSetStock,
    adjustStock,

    caixaSearch,
    onCaixaSearch,
    cart,
    addToCart,
    cartInc,
    cartDec,
    cartRemove,
    pagamentoMetodo,
    setPagamento,
    finalizeSale,

    finTab,
    setFinTab,
    manualPayForm,
    setManualPayForm,
    submitManualPayment,
    deleteManualPayment,
    expenseForm,
    setExpenseForm,
    submitExpense,
    toggleExpensePaid,
    deleteExpense,
  };
}

export type InventoryStore = ReturnType<typeof useInventoryStore>;
