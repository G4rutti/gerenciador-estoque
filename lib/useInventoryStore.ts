"use client";

import { useEffect, useState } from "react";
import { todayStr } from "./format";
import { supabase } from "./supabase/client";
import {
  expenseFromRow,
  manualPaymentFromRow,
  productFromRow,
  purchaseFromRow,
  recipeFromRow,
  recipeItemFromRow,
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
  Recipe,
  RecipeForm,
  RecipeItem,
  RecipeItemForm,
  VariationForm,
  View,
  emptyAppData,
  emptyExpenseForm,
  emptyManualPayForm,
  emptyProductForm,
  emptyPurchaseForm,
  emptyRecipeForm,
  emptyRecipeItemForm,
  emptyVariationForm,
} from "./types";

export type CartItem = { productId: string; variationId: string | null; qtd: number };

export function useInventoryStore() {
  const [view, setView] = useState<View>("produtos");
  const [data, setDataRaw] = useState<AppData>(emptyAppData());
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm());
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm());
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockEditValue, setStockEditValue] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [caixaSearch, setCaixaSearch] = useState("");
  const [pagamentoMetodo, setPagamentoMetodo] = useState<PagamentoMetodo>("pix");
  const [saleCustomDate, setSaleCustomDate] = useState<string>("");
  const [saleNaoDescontarEstoque, setSaleNaoDescontarEstoque] = useState<boolean>(false);
  const [finTab, setFinTab] = useState<FinTab>("recebimentos");
  const [manualPayForm, setManualPayForm] = useState<ManualPayForm>(emptyManualPayForm());
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm());

  // Recipe state
  const [recipeForm, setRecipeForm] = useState<RecipeForm>(emptyRecipeForm());
  const [recipeItemForm, setRecipeItemForm] = useState<RecipeItemForm>(emptyRecipeItemForm());
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Variation-specific state
  const [variationForm, setVariationForm] = useState<VariationForm>(emptyVariationForm());
  const [stockEditVariationId, setStockEditVariationId] = useState<string | null>(null);
  const [stockEditVariationValue, setStockEditVariationValue] = useState("");
  const [variationPickerProductId, setVariationPickerProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [products, purchases, sales, manualPagamentos, expenses, variations, recipesRes, recipeItemsRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at"),
        supabase.from("purchases").select("*").order("created_at"),
        supabase.from("sales").select("*").order("created_at"),
        supabase.from("manual_pagamentos").select("*").order("created_at"),
        supabase.from("expenses").select("*").order("created_at"),
        supabase.from("product_variations").select("*").order("ordem"),
        supabase.from("recipes").select("*").order("created_at"),
        supabase.from("recipe_items").select("*").order("created_at"),
      ]);
      if (cancelled) return;

      const productList = (products.data ?? []).map((p: any) => productFromRow(p));
      const variationList = (variations.data ?? []).map((v: any) => variationFromRow(v));

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

      // Assemble recipes with items
      const recipeList = (recipesRes.data ?? []).map((r: any) => recipeFromRow(r));
      const recipeItemList = (recipeItemsRes.data ?? []).map((item: any) => recipeItemFromRow(item));

      const itemsByRecipe = new Map<string, RecipeItem[]>();
      recipeItemList.forEach((item) => {
        const list = itemsByRecipe.get(item.recipeId) ?? [];
        list.push(item);
        itemsByRecipe.set(item.recipeId, list);
      });

      const recipesWithItems = recipeList.map((r: any) => ({
        ...r,
        itens: itemsByRecipe.get(r.id) ?? [],
      }));

      setDataRaw({
        products: productsWithVariations,
        purchases: (purchases.data ?? []).map(purchaseFromRow),
        sales: (sales.data ?? []).map(saleFromRow),
        manualPagamentos: (manualPagamentos.data ?? []).map(manualPaymentFromRow),
        expenses: (expenses.data ?? []).map(expenseFromRow),
        recipes: recipesWithItems,
      });
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function field<F>(setter: React.Dispatch<React.SetStateAction<F>>, key: keyof F) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
  const goReceitas = () => setView("receitas");

  // — busca de produtos —
  const onProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => setProductSearch(e.target.value);

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

  async function deletePurchase(purchaseId: string) {
    const purchase = data.purchases.find((pu) => pu.id === purchaseId);
    if (!purchase) return;
    if (!window.confirm("Excluir este registro de compra?")) return;
    const revertStock = window.confirm("Deseja também descontar a quantidade desta compra do estoque atual do produto?");

    const { error } = await supabase.from("purchases").delete().eq("id", purchaseId);
    if (error) {
      console.error(error);
      return;
    }

    if (revertStock) {
      const product = data.products.find((p) => p.id === purchase.productId);
      if (product) {
        const newStock = Math.max(0, product.estoque - purchase.qtd);
        const { data: prodRow, error: prodErr } = await supabase
          .from("products")
          .update({ estoque: newStock })
          .eq("id", product.id)
          .select()
          .single();
        if (!prodErr && prodRow) {
          const updated = productFromRow(prodRow);
          setDataRaw((d) => ({
            ...d,
            purchases: d.purchases.filter((pu) => pu.id !== purchaseId),
            products: d.products.map((p) => (p.id === product.id ? { ...updated, variations: p.variations } : p)),
          }));
          return;
        }
      }
    }

    setDataRaw((d) => ({
      ...d,
      purchases: d.purchases.filter((pu) => pu.id !== purchaseId),
    }));
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

      return { productId: c.productId, variationId: c.variationId || null, nome, qtd: c.qtd, precoVenda };
    });
    const total = itens.reduce((sum, i) => sum + i.qtd * i.precoVenda, 0);
    const dataVenda = saleCustomDate.trim() || todayStr();
    const { data: saleRow, error: saleErr } = await supabase
      .from("sales")
      .insert({ data: dataVenda, itens, total, pagamento: pagamentoMetodo })
      .select()
      .single();
    if (saleErr) {
      console.error(saleErr);
      return;
    }
    const venda = saleFromRow(saleRow);

    if (saleNaoDescontarEstoque) {
      setDataRaw((d) => ({
        ...d,
        sales: [...d.sales, venda],
      }));
      setCart([]);
      setSaleCustomDate("");
      setSaleNaoDescontarEstoque(false);
      return;
    }

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
    setSaleCustomDate("");
    setSaleNaoDescontarEstoque(false);
  }

  async function deleteSale(saleId: string) {
    const sale = data.sales.find((s) => s.id === saleId);
    if (!sale) return;
    if (!window.confirm("Excluir esta venda e estornar a quantidade dos itens de volta ao estoque?")) return;

    const { error } = await supabase.from("sales").delete().eq("id", saleId);
    if (error) {
      console.error(error);
      return;
    }

    const productUpdates: Promise<any>[] = [];
    const variationUpdates: Promise<any>[] = [];

    sale.itens.forEach((item) => {
      if (item.variationId) {
        let vStock = 0;
        for (const p of data.products) {
          const v = p.variations.find((v) => v.id === item.variationId);
          if (v) {
            vStock = v.estoque;
            break;
          }
        }
        const novoEstoque = vStock + item.qtd;
        variationUpdates.push(
          Promise.resolve(supabase.from("product_variations").update({ estoque: novoEstoque }).eq("id", item.variationId).select().single())
        );
      } else {
        const p = data.products.find((x) => x.id === item.productId);
        const novoEstoque = (p ? p.estoque : 0) + item.qtd;
        productUpdates.push(
          Promise.resolve(supabase.from("products").update({ estoque: novoEstoque }).eq("id", item.productId).select().single())
        );
      }
    });

    const [pRes, vRes] = await Promise.all([Promise.all(productUpdates), Promise.all(variationUpdates)]);

    const updatedProducts = new Map<string, Product>();
    pRes.forEach((u) => {
      if (u.data) {
        const prod = productFromRow(u.data);
        updatedProducts.set(prod.id, prod);
      }
    });

    const updatedVariations = new Map<string, ProductVariation>();
    vRes.forEach((u) => {
      if (u.data) {
        const v = variationFromRow(u.data);
        updatedVariations.set(v.id, v);
      }
    });

    setDataRaw((d) => ({
      ...d,
      sales: d.sales.filter((s) => s.id !== saleId),
      products: d.products.map((p) => {
        const updatedProd = updatedProducts.get(p.id);
        const baseProduct = updatedProd ? { ...updatedProd, variations: p.variations } : p;
        return {
          ...baseProduct,
          variations: baseProduct.variations.map((v) => updatedVariations.get(v.id) ?? v),
        };
      }),
    }));
  }

  // — financeiro —
  async function submitManualPayment() {
    const f = manualPayForm;
    const valor = Number(f.valor) || 0;
    if (valor <= 0) return;
    const dataPagamento = f.data.trim() || todayStr();
    const { data: row, error } = await supabase
      .from("manual_pagamentos")
      .insert({ data: dataPagamento, tipo: f.tipo, valor, obs: f.obs })
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

  // — receitas —
  async function submitRecipeForm() {
    const f = recipeForm;
    if (!f.nome.trim()) return;
    const { data: row, error } = await supabase
      .from("recipes")
      .insert({ nome: f.nome, descricao: f.descricao, rendimento: f.rendimento })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const newRecipe = recipeFromRow(row);
    setDataRaw((d) => ({ ...d, recipes: [...d.recipes, newRecipe] }));
    setRecipeForm(emptyRecipeForm());
    setExpandedRecipeId(newRecipe.id);
  }

  async function deleteRecipe(id: string) {
    if (!window.confirm("Excluir esta receita?")) return;
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    setDataRaw((d) => ({
      ...d,
      recipes: d.recipes.filter((r) => r.id !== id),
    }));
    if (expandedRecipeId === id) setExpandedRecipeId(null);
  }

  async function addRecipeItem(recipeId: string) {
    const f = recipeItemForm;
    const productId = f.productId;
    const qtd = Number(f.qtd) || 0;
    if (!productId || qtd <= 0) return;
    const variationId = f.variationId || null;

    const { data: row, error } = await supabase
      .from("recipe_items")
      .insert({
        recipe_id: recipeId,
        product_id: productId,
        variation_id: variationId,
        qtd,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const newItem = recipeItemFromRow(row);
    setDataRaw((d) => ({
      ...d,
      recipes: d.recipes.map((r) =>
        r.id === recipeId ? { ...r, itens: [...r.itens, newItem] } : r
      ),
    }));
    setRecipeItemForm(emptyRecipeItemForm());
  }

  async function deleteRecipeItem(recipeId: string, itemId: string) {
    const { error } = await supabase.from("recipe_items").delete().eq("id", itemId);
    if (error) {
      console.error(error);
      return;
    }
    setDataRaw((d) => ({
      ...d,
      recipes: d.recipes.map((r) =>
        r.id === recipeId ? { ...r, itens: r.itens.filter((i) => i.id !== itemId) } : r
      ),
    }));
  }

  async function produceRecipe(recipeId: string, multiplier: number = 1) {
    const recipe = data.recipes.find((r) => r.id === recipeId);
    if (!recipe || recipe.itens.length === 0) return;
    if (!window.confirm(`Dar baixa no estoque para produção de ${multiplier}x da receita "${recipe.nome}"?`)) return;

    // Deduct stock for each recipe item
    const productUpdates: Promise<any>[] = [];
    const variationUpdates: Promise<any>[] = [];

    recipe.itens.forEach((item) => {
      const qtdTotal = item.qtd * multiplier;
      if (item.variationId) {
        // deduct from variation
        let vStock = 0;
        for (const p of data.products) {
          const v = p.variations.find((v) => v.id === item.variationId);
          if (v) {
            vStock = v.estoque;
            break;
          }
        }
        const novoEstoque = Math.max(0, vStock - qtdTotal);
        variationUpdates.push(
          Promise.resolve(supabase.from("product_variations").update({ estoque: novoEstoque }).eq("id", item.variationId).select().single())
        );
      } else {
        // deduct from product
        const p = data.products.find((x) => x.id === item.productId);
        const novoEstoque = Math.max(0, (p ? p.estoque : 0) - qtdTotal);
        productUpdates.push(
          Promise.resolve(supabase.from("products").update({ estoque: novoEstoque }).eq("id", item.productId).select().single())
        );
      }
    });

    const [pRes, vRes] = await Promise.all([Promise.all(productUpdates), Promise.all(variationUpdates)]);

    const updatedProducts = new Map<string, Product>();
    pRes.forEach((u) => {
      if (u.data) {
        const prod = productFromRow(u.data);
        updatedProducts.set(prod.id, prod);
      }
    });

    const updatedVariations = new Map<string, ProductVariation>();
    vRes.forEach((u) => {
      if (u.data) {
        const v = variationFromRow(u.data);
        updatedVariations.set(v.id, v);
      }
    });

    setDataRaw((d) => ({
      ...d,
      products: d.products.map((p) => {
        const updatedProd = updatedProducts.get(p.id);
        const baseProduct = updatedProd ? { ...updatedProd, variations: p.variations } : p;
        return {
          ...baseProduct,
          variations: baseProduct.variations.map((v) => updatedVariations.get(v.id) ?? v),
        };
      }),
    }));
  }

  return {
    view,
    data,
    loading,
    goProdutos,
    goEstoque,
    goCaixa,
    goFinanceiro,
    goReceitas,

    productSearch,
    onProductSearch,
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
    deletePurchase,

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
    saleCustomDate,
    setSaleCustomDate,
    saleNaoDescontarEstoque,
    setSaleNaoDescontarEstoque,
    finalizeSale,
    deleteSale,

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

    // Receitas
    recipeForm,
    setRecipeForm,
    recipeItemForm,
    setRecipeItemForm,
    expandedRecipeId,
    setExpandedRecipeId,
    submitRecipeForm,
    deleteRecipe,
    addRecipeItem,
    deleteRecipeItem,
    produceRecipe,
  };
}

export type InventoryStore = ReturnType<typeof useInventoryStore>;
