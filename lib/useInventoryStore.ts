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
  variationFromRow,
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
  ProductVariation,
  PurchaseForm,
  VariationForm,
  View,
  emptyAppData,
  emptyExpenseForm,
  emptyManualPayForm,
  emptyProductForm,
  emptyPurchaseForm,
  emptyVariationForm,
} from "./types";

export type CartItem = { productId: string; variationId: string | null; qtd: number };

export function useInventoryStore() {
  const [view, setView] = useState<View>("produtos");
  const [data, setDataRaw] = useState<AppData>(emptyAppData());
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm());
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm());
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockEditValue, setStockEditValue] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [caixaSearch, setCaixaSearch] = useState("");
  const [pagamentoMetodo, setPagamentoMetodo] = useState<PagamentoMetodo>("pix");
  const [finTab, setFinTab] = useState<FinTab>("recebimentos");
  const [manualPayForm, setManualPayForm] = useState<ManualPayForm>(emptyManualPayForm());
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm());

  // Variation-specific state
  const [variationForm, setVariationForm] = useState<VariationForm>(emptyVariationForm());
  const [stockEditVariationId, setStockEditVariationId] = useState<string | null>(null);
  const [stockEditVariationValue, setStockEditVariationValue] = useState("");
  const [variationPickerProductId, setVariationPickerProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [products, purchases, sales, manualPagamentos, expenses, variations] = await Promise.all([
        supabase.from("products").select("*").order("created_at"),
        supabase.from("purchases").select("*").order("created_at"),
        supabase.from("sales").select("*").order("created_at"),
        supabase.from("manual_pagamentos").select("*").order("created_at"),
        supabase.from("expenses").select("*").order("created_at"),
        supabase.from("product_variations").select("*").order("ordem"),
      ]);
      if (cancelled) return;

      const productList = (products.data ?? []).map(productFromRow);
      const variationList = (variations.data ?? []).map(variationFromRow);

      // Attach variations to their products
      const variationsByProduct = new Map<string, ProductVariation[]>();
      variationList.forEach((v) => {
        const list = variationsByProduct.get(v.productId) ?? [];
        list.push(v);
        variationsByProduct.set(v.productId, list);
      });
      const productsWithVariations = productList.map((p) => ({
        ...p,
        variations: variationsByProduct.get(p.id) ?? [],
      }));

      setDataRaw({
        products: productsWithVariations,
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
      setDataRaw((d) => ({
        ...d,
        products: d.products.map((p) =>
          p.id === updated.id ? { ...updated, variations: p.variations } : p
        ),
      }));
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
    setVariationForm(emptyVariationForm());
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
      products: d.products.map((p) =>
        p.id === productId ? { ...updatedProduct, variations: p.variations } : p
      ),
      purchases: [...d.purchases, newPurchase],
    }));
    setPurchaseForm(emptyPurchaseForm());
  }

  // — variações —
  async function setVariationGroupName(productId: string, name: string) {
    const { data: row, error } = await supabase
      .from("products")
      .update({ variation_group_name: name })
      .eq("id", productId)
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = productFromRow(row);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) =>
        p.id === productId ? { ...updated, variations: p.variations } : p
      ),
    }));
  }

  async function addVariation(productId: string) {
    const f = variationForm;
    if (!f.nome.trim()) return;
    const product = data.products.find((p) => p.id === productId);
    if (!product) return;
    const nextOrdem = product.variations.length;
    const precoVenda = f.precoVenda ? Number(f.precoVenda) : null;
    const estoque = Number(f.estoqueInicial) || 0;

    const { data: row, error } = await supabase
      .from("product_variations")
      .insert({
        product_id: productId,
        nome: f.nome,
        codigo: f.codigo,
        preco_venda: precoVenda,
        estoque,
        ativo: true,
        ordem: nextOrdem,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const newVariation = variationFromRow(row);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) =>
        p.id === productId ? { ...p, variations: [...p.variations, newVariation] } : p
      ),
    }));
    setVariationForm(emptyVariationForm());
  }

  async function deleteVariation(variationId: string) {
    if (!window.confirm("Excluir esta variação?")) return;
    const { error } = await supabase.from("product_variations").delete().eq("id", variationId);
    if (error) {
      console.error(error);
      return;
    }
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => ({
        ...p,
        variations: p.variations.filter((v) => v.id !== variationId),
      })),
    }));
  }

  async function toggleVariationActive(variationId: string) {
    // Find the variation
    let currentVariation: ProductVariation | undefined;
    for (const p of data.products) {
      currentVariation = p.variations.find((v) => v.id === variationId);
      if (currentVariation) break;
    }
    if (!currentVariation) return;

    const { data: row, error } = await supabase
      .from("product_variations")
      .update({ ativo: !currentVariation.ativo })
      .eq("id", variationId)
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = variationFromRow(row);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => ({
        ...p,
        variations: p.variations.map((v) => (v.id === variationId ? updated : v)),
      })),
    }));
  }

  async function updateVariationField(variationId: string, field: string, value: string | number | null) {
    const dbField = field === "precoVenda" ? "preco_venda" : field;
    const { data: row, error } = await supabase
      .from("product_variations")
      .update({ [dbField]: value })
      .eq("id", variationId)
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = variationFromRow(row);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => ({
        ...p,
        variations: p.variations.map((v) => (v.id === variationId ? updated : v)),
      })),
    }));
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
    setDataRaw((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...updated, variations: p.variations } : p)) }));
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
    setDataRaw((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...updated, variations: p.variations } : p)) }));
  }

  // — estoque de variações —
  async function adjustVariationStock(variationId: string, delta: number) {
    let currentVariation: ProductVariation | undefined;
    for (const p of data.products) {
      currentVariation = p.variations.find((v) => v.id === variationId);
      if (currentVariation) break;
    }
    if (!currentVariation) return;
    const novoEstoque = Math.max(0, currentVariation.estoque + delta);
    const { data: row, error } = await supabase
      .from("product_variations")
      .update({ estoque: novoEstoque })
      .eq("id", variationId)
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = variationFromRow(row);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => ({
        ...p,
        variations: p.variations.map((v) => (v.id === variationId ? updated : v)),
      })),
    }));
  }

  function startSetVariationStock(variationId: string, current: number) {
    setStockEditVariationId(variationId);
    setStockEditVariationValue(String(current));
  }
  const onStockEditVariationChange = (e: React.ChangeEvent<HTMLInputElement>) => setStockEditVariationValue(e.target.value);
  async function confirmSetVariationStock() {
    const id = stockEditVariationId;
    const val = Math.max(0, Number(stockEditVariationValue) || 0);
    setStockEditVariationId(null);
    if (!id) return;
    const { data: row, error } = await supabase
      .from("product_variations")
      .update({ estoque: val })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const updated = variationFromRow(row);
    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => ({
        ...p,
        variations: p.variations.map((v) => (v.id === id ? updated : v)),
      })),
    }));
  }

  // — caixa —
  const onCaixaSearch = (e: React.ChangeEvent<HTMLInputElement>) => setCaixaSearch(e.target.value);

  function addToCart(productId: string, variationId: string | null = null) {
    const existing = cart.find((c) => c.productId === productId && c.variationId === variationId);
    if (existing) {
      setCart(cart.map((c) =>
        c.productId === productId && c.variationId === variationId
          ? { ...c, qtd: c.qtd + 1 }
          : c
      ));
    } else {
      setCart([...cart, { productId, variationId, qtd: 1 }]);
    }
    setVariationPickerProductId(null);
  }

  function handleAddToCart(productId: string) {
    const product = data.products.find((p) => p.id === productId);
    if (!product) return;
    if (product.variations.length > 0) {
      // Show variation picker
      setVariationPickerProductId(variationPickerProductId === productId ? null : productId);
    } else {
      addToCart(productId, null);
    }
  }

  const cartInc = (productId: string, variationId: string | null) =>
    setCart(cart.map((c) =>
      c.productId === productId && c.variationId === variationId
        ? { ...c, qtd: c.qtd + 1 }
        : c
    ));
  const cartDec = (productId: string, variationId: string | null) =>
    setCart(
      cart
        .map((c) =>
          c.productId === productId && c.variationId === variationId
            ? { ...c, qtd: c.qtd - 1 }
            : c
        )
        .filter((c) => c.qtd > 0)
    );
  const cartRemove = (productId: string, variationId: string | null) =>
    setCart(cart.filter((c) => !(c.productId === productId && c.variationId === variationId)));
  const setPagamento = (m: PagamentoMetodo) => setPagamentoMetodo(m);

  async function finalizeSale() {
    if (cart.length === 0) return;
    const itens = cart.map((c) => {
      const p = data.products.find((x) => x.id === c.productId);
      let nome = p ? p.nome : "?";
      let precoVenda = p ? p.precoVenda : 0;

      if (c.variationId && p) {
        const v = p.variations.find((v) => v.id === c.variationId);
        if (v) {
          nome = `${p.nome} - ${v.nome}`;
          if (v.precoVenda != null) precoVenda = v.precoVenda;
        }
      }

      return { productId: c.productId, nome, qtd: c.qtd, precoVenda };
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

    // Update stock for products without variations
    const productOnlyItems = cart.filter((c) => !c.variationId);
    const productUpdates = await Promise.all(
      productOnlyItems.map((c) => {
        const p = data.products.find((x) => x.id === c.productId);
        const novoEstoque = Math.max(0, (p ? p.estoque : 0) - c.qtd);
        return supabase.from("products").update({ estoque: novoEstoque }).eq("id", c.productId).select().single();
      })
    );

    // Update stock for variations
    const variationItems = cart.filter((c) => c.variationId);
    const variationUpdates = await Promise.all(
      variationItems.map((c) => {
        const p = data.products.find((x) => x.id === c.productId);
        const v = p?.variations.find((v) => v.id === c.variationId);
        const novoEstoque = Math.max(0, (v ? v.estoque : 0) - c.qtd);
        return supabase.from("product_variations").update({ estoque: novoEstoque }).eq("id", c.variationId!).select().single();
      })
    );

    const updatedProducts = new Map<string, Product>();
    productUpdates.forEach((u) => {
      if (u.error) {
        console.error(u.error);
        return;
      }
      const prod = productFromRow(u.data);
      updatedProducts.set(prod.id, prod);
    });

    const updatedVariations = new Map<string, ProductVariation>();
    variationUpdates.forEach((u) => {
      if (u.error) {
        console.error(u.error);
        return;
      }
      const v = variationFromRow(u.data);
      updatedVariations.set(v.id, v);
    });

    setDataRaw((d) => ({
      ...d,
      sales: [...d.sales, venda],
      products: d.products.map((p) => {
        const updatedProd = updatedProducts.get(p.id);
        const baseProduct = updatedProd ? { ...updatedProd, variations: p.variations } : p;
        return {
          ...baseProduct,
          variations: baseProduct.variations.map((v) => updatedVariations.get(v.id) ?? v),
        };
      }),
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

    // Variations
    variationForm,
    setVariationForm,
    setVariationGroupName,
    addVariation,
    deleteVariation,
    toggleVariationActive,
    updateVariationField,

    stockEditId,
    stockEditValue,
    startSetStock,
    onStockEditChange,
    confirmSetStock,
    adjustStock,

    // Variation stock
    stockEditVariationId,
    stockEditVariationValue,
    startSetVariationStock,
    onStockEditVariationChange,
    confirmSetVariationStock,
    adjustVariationStock,

    caixaSearch,
    onCaixaSearch,
    cart,
    addToCart,
    handleAddToCart,
    variationPickerProductId,
    setVariationPickerProductId,
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
