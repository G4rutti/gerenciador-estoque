"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney, todayStr } from "@/lib/format";
import { PagamentoMetodo } from "@/lib/types";

const PAG_OPTIONS: { key: PagamentoMetodo; label: string }[] = [
  { key: "pix", label: "Pix" },
  { key: "dinheiro", label: "Dinheiro" },
  { key: "cartao", label: "Cartão" },
];

export function CaixaView({ store }: { store: InventoryStore }) {
  const { data, cart, caixaSearch } = store;
  const today = todayStr();

  const caixaProdutos = data.products.filter((p) => p.nome.toLowerCase().includes(caixaSearch.toLowerCase()));

  const cartTotal = cart.reduce((sum, c) => {
    const p = data.products.find((x) => x.id === c.productId);
    return sum + (p ? p.precoVenda : 0) * c.qtd;
  }, 0);

  const vendasHoje = data.sales.filter((v) => v.data === today);
  const byMetodoHoje = (m: PagamentoMetodo) => vendasHoje.filter((v) => v.pagamento === m).reduce((sum, v) => sum + v.total, 0);
  const hojeTotal = vendasHoje.reduce((sum, v) => sum + v.total, 0);

  return (
    <div>
      <h1 className="page-title">Caixa</h1>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            className="input"
            style={{ marginBottom: 12 }}
            value={caixaSearch}
            onChange={store.onCaixaSearch}
            placeholder="Buscar produto..."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 520, overflowY: "auto" }}>
            {caixaProdutos.map((p) => (
              <div key={p.id} className="panel" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                  <div className="num" style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                    {fmtMoney(p.precoVenda)} · estoque: {p.estoque} {p.unidade}
                  </div>
                </div>
                <button className="btn-primary-sm" onClick={() => store.addToCart(p.id)}>
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ width: 340, flexShrink: 0, padding: 18, position: "sticky", top: 0 }}>
          <div className="panel-title" style={{ marginBottom: 12 }}>
            Venda atual
          </div>
          {cart.length === 0 && <div className="empty-hint">Nenhum item adicionado.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {cart.map((c) => {
              const p = data.products.find((x) => x.id === c.productId);
              const nome = p ? p.nome : "?";
              const preco = p ? p.precoVenda : 0;
              return (
                <div key={c.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{nome}</div>
                    <div className="num" style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      {fmtMoney(preco * c.qtd)}
                    </div>
                  </div>
                  <button className="btn-step" onClick={() => store.cartDec(c.productId)}>
                    –
                  </button>
                  <span className="num" style={{ minWidth: 20, textAlign: "center", display: "inline-block" }}>
                    {c.qtd}
                  </span>
                  <button className="btn-step" onClick={() => store.cartInc(c.productId)}>
                    +
                  </button>
                  <button className="btn-small-danger" onClick={() => store.cartRemove(c.productId)}>
                    x
                  </button>
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 700,
              borderTop: "1px solid var(--color-divider)",
              paddingTop: 12,
              marginBottom: 16,
            }}
          >
            <span>Total</span>
            <span className="num">{fmtMoney(cartTotal)}</span>
          </div>
          <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginBottom: 6 }}>Forma de pagamento</div>
          <div className="pag-seg" style={{ marginBottom: 16 }}>
            {PAG_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`pag-btn${store.pagamentoMetodo === opt.key ? " active" : ""}`}
                onClick={() => store.setPagamento(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="btn-primary btn-block" onClick={store.finalizeSale}>
            Finalizar venda
          </button>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div className="panel-title">Hoje</div>
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Vendido hoje</div>
            <div className="stat-value">{fmtMoney(hojeTotal)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pix</div>
            <div className="stat-value">{fmtMoney(byMetodoHoje("pix"))}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Dinheiro</div>
            <div className="stat-value">{fmtMoney(byMetodoHoje("dinheiro"))}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cartão</div>
            <div className="stat-value">{fmtMoney(byMetodoHoje("cartao"))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
