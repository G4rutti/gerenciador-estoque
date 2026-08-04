"use client";

import { useInventoryStore } from "@/lib/useInventoryStore";
import { Sidebar } from "@/components/Sidebar";
import { ProdutosView } from "@/components/views/ProdutosView";
import { EstoqueView } from "@/components/views/EstoqueView";
import { CaixaView } from "@/components/views/CaixaView";
import { FinanceiroView } from "@/components/views/FinanceiroView";

export function InventoryApp() {
  const store = useInventoryStore();

  return (
    <div className="app-shell">
      <Sidebar store={store} />
      <div className="content">
        {store.loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            {store.view === "produtos" && <ProdutosView store={store} />}
            {store.view === "estoque" && <EstoqueView store={store} />}
            {store.view === "caixa" && <CaixaView store={store} />}
            {store.view === "financeiro" && <FinanceiroView store={store} />}
          </>
        )}
      </div>
    </div>
  );
}
