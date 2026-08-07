"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney, todayStr } from "@/lib/format";
import { PagamentoMetodo } from "@/lib/types";

const PAG_OPTIONS: { key: PagamentoMetodo; label: string }[] = [
  { key: "pix", label: "Pix" },
  { key: "dinheiro", label: "Dinheiro" },
  { key: "cartao_credito", label: "Crédito" },
  { key: "cartao_debito", label: "Débito" },
];

export function CaixaView({ store }: { store: InventoryStore }) {
  const { data, cart, caixaSearch } = store;
  const today = todayStr();

  const caixaProdutos = data.products.filter((p) => p.nome.toLowerCase().includes(caixaSearch.toLowerCase()));

  const cartTotal = cart.reduce((sum, c) => {
    const p = data.products.find((x) => x.id === c.productId);
    if (!p) return sum;
    if (c.variationId) {
      const v = p.variations.find((v) => v.id === c.variationId);
      const preco = v?.precoVenda != null ? v.precoVenda : p.precoVenda;
      return sum + preco * c.qtd;
    }
    return sum + p.precoVenda * c.qtd;
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
            {caixaProdutos.map((p) => {
              const hasVariations = p.variations.length > 0;
              const isPickerOpen = store.variationPickerProductId === p.id;
              const totalEstoque = hasVariations
                ? p.variations.reduce((sum, v) => sum + v.estoque, 0)
                : p.estoque;

              return (
                <div key={p.id}>
                  <div className="panel" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {p.nome}
                        {hasVariations && (
                          <span className="variation-badge" style={{ marginLeft: 8 }}>
                            {p.variations.length} {p.variationGroupName || "var."}
                          </span>
                        )}
                      </div>
                      <div className="num" style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                        {fmtMoney(p.precoVenda)} · estoque: {totalEstoque} {p.unidade}
                      </div>
                    </div>
                    <button className="btn-primary-sm" onClick={() => store.handleAddToCart(p.id)}>
                      {hasVariations ? (isPickerOpen ? "Fechar" : "Escolher") : "Adicionar"}
                    </button>
                  </div>
                  {/* Variation picker dropdown */}
                  {hasVariations && isPickerOpen && (
                    <div className="variation-picker">
                      {p.variations
                        .filter((v) => v.ativo)
                        .map((v) => (
                          <div
                            key={v.id}
                            className="variation-picker-item"
                            onClick={() => store.addToCart(p.id, v.id)}
                          >
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{v.nome}</span>
                              <span className="num" style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginLeft: 8 }}>
                                {v.precoVenda != null ? fmtMoney(v.precoVenda) : fmtMoney(p.precoVenda)}
                              </span>
                            </div>
                            <span className="num" style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                              estoque: {v.estoque}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              let nome = p ? p.nome : "?";
              let preco = p ? p.precoVenda : 0;

              if (c.variationId && p) {
                const v = p.variations.find((v) => v.id === c.variationId);
                if (v) {
                  nome = `${p.nome} — ${v.nome}`;
                  if (v.precoVenda != null) preco = v.precoVenda;
                }
              }

              return (
                <div key={`${c.productId}-${c.variationId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{nome}</div>
                    <div className="num" style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      {fmtMoney(preco * c.qtd)}
                    </div>
                  </div>
                  <button className="btn-step" onClick={() => store.cartDec(c.productId, c.variationId)}>
                    –
                  </button>
                  <span className="num" style={{ minWidth: 20, textAlign: "center", display: "inline-block" }}>
                    {c.qtd}
                  </span>
                  <button className="btn-step" onClick={() => store.cartInc(c.productId, c.variationId)}>
                    +
                  </button>
                  <button className="btn-small-danger" onClick={() => store.cartRemove(c.productId, c.variationId)}>
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

          {/* Lançamento Retroativo / Data Customizada */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="field-label-sm">
              Data da venda (opcional, para vendas passadas)
              <input
                type="date"
                className="input-sm"
                value={store.saleCustomDate}
                onChange={(e) => store.setSaleCustomDate(e.target.value)}
              />
            </label>
            <label className="field-check" style={{ fontSize: 11, color: store.saleNaoDescontarEstoque ? "var(--color-accent-700)" : "inherit", fontWeight: store.saleNaoDescontarEstoque ? 600 : 400 }}>
              <input
                type="checkbox"
                checked={store.saleNaoDescontarEstoque}
                onChange={(e) => store.setSaleNaoDescontarEstoque(e.target.checked)}
              />
              Lançamento retroativo (não descontar do estoque)
            </label>
            {store.saleNaoDescontarEstoque && (
              <div style={{ fontSize: 10, color: "var(--color-accent-700)", lineHeight: 1.3 }}>
                ● A venda será anotada no histórico e no financeiro sem alterar o estoque atual.
              </div>
            )}
          </div>
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
            <div className="stat-label">Crédito</div>
            <div className="stat-value">{fmtMoney(byMetodoHoje("cartao_credito"))}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Débito</div>
            <div className="stat-value">{fmtMoney(byMetodoHoje("cartao_debito"))}</div>
          </div>
        </div>

        {/* Tabela de Vendas de Hoje */}
        {vendasHoje.length > 0 && (
          <div className="table-panel" style={{ marginTop: 20 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-divider)", fontWeight: 700, fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}>
              Vendas Realizadas Hoje ({vendasHoje.length})
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Itens Vendidos</th>
                  <th>Pagamento</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vendasHoje.slice().reverse().map((v) => {
                  const METODO_LABELS: Record<string, string> = {
                    pix: "Pix",
                    dinheiro: "Dinheiro",
                    cartao: "Cartão",
                    cartao_credito: "Crédito",
                    cartao_debito: "Débito",
                  };
                  return (
                    <tr key={v.id}>
                      <td style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{v.data}</td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>
                        {v.itens.map((i) => `${i.qtd}x ${i.nome}`).join(", ")}
                      </td>
                      <td>
                        <span className="variation-badge" style={{ textTransform: "none" }}>
                          {METODO_LABELS[v.pagamento] ?? v.pagamento}
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: "var(--color-accent-700)" }}>
                        {fmtMoney(v.total)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-small-danger" onClick={() => store.deleteSale(v.id)}>
                          Excluir Venda
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
