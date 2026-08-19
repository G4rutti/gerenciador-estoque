"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";
import { useState } from "react";
import { MOTIVO_LABELS, StockExitForm } from "@/lib/types";

export function EstoqueView({ store }: { store: InventoryStore }) {
  const { data } = store;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const totalEstoqueValor = data.products.reduce((sum, p) => {
    if (p.variations.length > 0) {
      return sum + p.variations.reduce((vs, v) => vs + v.estoque * p.custoAtual, 0);
    }
    return sum + p.estoque * p.custoAtual;
  }, 0);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedExitProduct = data.products.find((p) => p.id === store.stockExitForm.productId);

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 8 }}>
        Estoque
      </h1>
      <div className="page-subtitle">
        Valor total em estoque: <span className="num" style={{ fontWeight: 700, color: "var(--color-text)" }}>{fmtMoney(totalEstoqueValor)}</span>
      </div>
      <div className="table-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Custo unit.</th>
              <th>Quantidade</th>
              <th>Valor em estoque</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => {
              const hasVariations = p.variations.length > 0;
              const isExpanded = expandedIds.has(p.id);
              const totalEstoque = hasVariations
                ? p.variations.reduce((sum, v) => sum + v.estoque, 0)
                : p.estoque;
              const totalValor = hasVariations
                ? p.variations.reduce((sum, v) => sum + v.estoque * p.custoAtual, 0)
                : p.estoque * p.custoAtual;
              const isEditingStock = store.stockEditId === p.id;
              const baixo = totalEstoque <= 3;

              return (
                <>
                  <tr key={p.id}>
                    <td
                      style={{ fontWeight: 600, cursor: hasVariations ? "pointer" : "default" }}
                      onClick={() => hasVariations && toggleExpand(p.id)}
                    >
                      {hasVariations && (
                        <span style={{ display: "inline-block", width: 16, fontSize: 10, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      )}
                      {p.nome}
                      {hasVariations && (
                        <span className="variation-badge" style={{ marginLeft: 8 }}>
                          {p.variations.length} {p.variationGroupName || "var."}
                        </span>
                      )}
                    </td>
                    <td className="num" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      {fmtMoney(p.custoAtual)}
                    </td>
                    <td>
                      {hasVariations ? (
                        <span className="num" style={{ minWidth: 64, display: "inline-block" }}>
                          {totalEstoque} {p.unidade}
                        </span>
                      ) : isEditingStock ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            type="number"
                            className="input-sm"
                            style={{ width: 80 }}
                            value={store.stockEditValue}
                            onChange={store.onStockEditChange}
                          />
                          <button className="btn-primary-sm" onClick={store.confirmSetStock}>
                            OK
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button className="btn-step" onClick={() => store.adjustStock(p.id, -1)}>
                            –
                          </button>
                          <span className="num" style={{ minWidth: 64, display: "inline-block" }} onClick={() => store.startSetStock(p.id, p.estoque)}>
                            {p.estoque} {p.unidade}
                          </span>
                          <button className="btn-step" onClick={() => store.adjustStock(p.id, 1)}>
                            +
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="num">{fmtMoney(totalValor)}</td>
                    <td>{baixo && <span className="low-stock">estoque baixo</span>}</td>
                  </tr>
                  {/* Variation sub-rows */}
                  {hasVariations && isExpanded && p.variations.map((v) => {
                    const isEditingVariationStock = store.stockEditVariationId === v.id;
                    const vBaixo = v.estoque <= 3;
                    return (
                      <tr key={v.id} className="variation-row">
                        <td style={{ paddingLeft: 36, fontSize: 13, color: "color-mix(in srgb, var(--color-text) 80%, transparent)" }}>
                          <span style={{ color: "color-mix(in srgb, var(--color-text) 40%, transparent)", marginRight: 6 }}>└</span>
                          {v.nome}
                          {!v.ativo && (
                            <span style={{ fontSize: 10, color: "color-mix(in srgb, var(--color-text) 40%, transparent)", marginLeft: 6 }}>
                              (desativado)
                            </span>
                          )}
                        </td>
                        <td className="num" style={{ color: "color-mix(in srgb, var(--color-text) 40%, transparent)", fontSize: 13 }}>
                          {v.precoVenda != null ? fmtMoney(v.precoVenda) : "—"}
                        </td>
                        <td>
                          {isEditingVariationStock ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <input
                                type="number"
                                className="input-sm"
                                style={{ width: 80 }}
                                value={store.stockEditVariationValue}
                                onChange={store.onStockEditVariationChange}
                              />
                              <button className="btn-primary-sm" onClick={store.confirmSetVariationStock}>
                                OK
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button className="btn-step" onClick={() => store.adjustVariationStock(v.id, -1)}>
                                –
                              </button>
                              <span
                                className="num"
                                style={{ minWidth: 64, display: "inline-block", fontSize: 13, cursor: "pointer" }}
                                onClick={() => store.startSetVariationStock(v.id, v.estoque)}
                              >
                                {v.estoque} {p.unidade}
                              </span>
                              <button className="btn-step" onClick={() => store.adjustVariationStock(v.id, 1)}>
                                +
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="num" style={{ fontSize: 13 }}>{fmtMoney(v.estoque * p.custoAtual)}</td>
                        <td>{vBaixo && v.ativo && <span className="low-stock">estoque baixo</span>}</td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Saídas de Estoque — Consumo pessoal / Doação / Perda */}
      <div style={{ marginTop: 32 }}>
        <h2 className="page-title" style={{ fontSize: 18, marginBottom: 8 }}>Saídas — Consumo pessoal, doação e perda</h2>
        <div className="page-subtitle" style={{ marginBottom: 16 }}>
          Registre retiradas do estoque que não são vendas (consumo próprio, doações, perdas). O estoque será descontado automaticamente.
        </div>

        <div className="panel" style={{ marginBottom: 20, maxWidth: 720 }}>
          <div className="panel-title">Registrar saída</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="field-label-sm" style={{ minWidth: 200, flex: 1 }}>
              Produto
              <select
                className="input-sm"
                value={store.stockExitForm.productId}
                onChange={(e) => store.setStockExitForm((f) => ({ ...f, productId: e.target.value, variationId: "" }))}
              >
                <option value="">Selecione o produto...</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} (estoque: {p.variations.length > 0 ? p.variations.reduce((s, v) => s + v.estoque, 0) : p.estoque} {p.unidade})</option>
                ))}
              </select>
            </label>

            {selectedExitProduct && selectedExitProduct.variations.length > 0 && (
              <label className="field-label-sm" style={{ minWidth: 140 }}>
                Variação
                <select
                  className="input-sm"
                  value={store.stockExitForm.variationId}
                  onChange={store.field<StockExitForm>(store.setStockExitForm, "variationId")}
                >
                  <option value="">Produto principal</option>
                  {selectedExitProduct.variations.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome} (estoque: {v.estoque})</option>
                  ))}
                </select>
              </label>
            )}

            <label className="field-label-sm" style={{ width: 90 }}>
              Qtd
              <input
                className="input-sm"
                type="number"
                step="0.01"
                value={store.stockExitForm.qtd}
                onChange={store.field<StockExitForm>(store.setStockExitForm, "qtd")}
                placeholder="0"
              />
            </label>

            <label className="field-label-sm">
              Motivo
              <select
                className="input-sm"
                value={store.stockExitForm.motivo}
                onChange={store.field<StockExitForm>(store.setStockExitForm, "motivo")}
              >
                <option value="consumo_pessoal">Consumo pessoal</option>
                <option value="doacao">Doação</option>
                <option value="perda">Perda / descarte</option>
              </select>
            </label>

            <label className="field-label-sm" style={{ flex: 1 }}>
              Obs
              <input
                className="input-sm"
                value={store.stockExitForm.obs}
                onChange={store.field<StockExitForm>(store.setStockExitForm, "obs")}
                placeholder="Opcional"
              />
            </label>

            <button className="btn-primary-sm" onClick={store.submitStockExit}>
              Registrar saída
            </button>
          </div>
        </div>

        {data.stockExits.length > 0 && (
          <div className="table-panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Motivo</th>
                  <th>Obs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.stockExits.slice().reverse().map((exit) => {
                  const p = data.products.find((x) => x.id === exit.productId);
                  let nome = p ? p.nome : "?";
                  if (exit.variationId && p) {
                    const v = p.variations.find((v) => v.id === exit.variationId);
                    if (v) nome = `${p.nome} — ${v.nome}`;
                  }
                  return (
                    <tr key={exit.id}>
                      <td>{exit.data}</td>
                      <td style={{ fontWeight: 600 }}>{nome}</td>
                      <td className="num">{exit.qtd} {p?.unidade ?? ""}</td>
                      <td>{MOTIVO_LABELS[exit.motivo] ?? exit.motivo}</td>
                      <td style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{exit.obs}</td>
                      <td>
                        <button className="btn-small-danger" onClick={() => store.deleteStockExit(exit.id)}>
                          Excluir
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
