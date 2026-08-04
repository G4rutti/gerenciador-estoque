"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { View } from "@/lib/types";

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "produtos", label: "Produtos" },
  { view: "estoque", label: "Estoque" },
  { view: "caixa", label: "Caixa" },
  { view: "financeiro", label: "Financeiro" },
];

const GO: Record<View, keyof Pick<InventoryStore, "goProdutos" | "goEstoque" | "goCaixa" | "goFinanceiro">> = {
  produtos: "goProdutos",
  estoque: "goEstoque",
  caixa: "goCaixa",
  financeiro: "goFinanceiro",
};

export function Sidebar({ store }: { store: InventoryStore }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">Estoque</div>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.view}
          className={`nav-btn${store.view === item.view ? " active" : ""}`}
          onClick={store[GO[item.view]]}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
