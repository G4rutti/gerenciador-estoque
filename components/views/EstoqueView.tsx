"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";
import { useState } from "react";

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
    </div>
  );
}
