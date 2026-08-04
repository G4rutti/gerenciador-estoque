"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";

export function EstoqueView({ store }: { store: InventoryStore }) {
  const { data } = store;
  const totalEstoqueValor = data.products.reduce((sum, p) => sum + p.estoque * p.custoAtual, 0);

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
              const isEditingStock = store.stockEditId === p.id;
              const baixo = p.estoque <= 3;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nome}</td>
                  <td className="num" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                    {fmtMoney(p.custoAtual)}
                  </td>
                  <td>
                    {isEditingStock ? (
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
                  <td className="num">{fmtMoney(p.estoque * p.custoAtual)}</td>
                  <td>{baixo && <span className="low-stock">estoque baixo</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
