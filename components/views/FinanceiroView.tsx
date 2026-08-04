"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";
import { ExpenseForm, ManualPayForm, PagamentoMetodo } from "@/lib/types";

const METODO_LABELS: Record<PagamentoMetodo, string> = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };
const TIPO_LABELS: Record<string, string> = { mercado: "Mercado", geral: "Conta geral" };

export function FinanceiroView({ store }: { store: InventoryStore }) {
  const { data, field, fieldChecked, manualPayForm, setManualPayForm, expenseForm, setExpenseForm } = store;

  const totalByMetodo = (m: PagamentoMetodo) =>
    data.sales.filter((v) => v.pagamento === m).reduce((sum, v) => sum + v.total, 0) +
    data.manualPagamentos.filter((p) => p.tipo === m).reduce((sum, p) => sum + p.valor, 0);

  const paymentsView = [
    ...data.sales.map((v) => ({ id: v.id, data: v.data, origem: "Venda", metodo: v.pagamento, valor: v.total, obs: "", isManual: false })),
    ...data.manualPagamentos.map((m) => ({ id: m.id, data: m.data, origem: "Manual", metodo: m.tipo, valor: m.valor, obs: m.obs, isManual: true })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1));

  const devendoMercado = data.expenses.filter((e) => e.tipo === "mercado" && !e.pago).reduce((sum, e) => sum + e.valor, 0);
  const devendoGeral = data.expenses.filter((e) => e.tipo === "geral" && !e.pago).reduce((sum, e) => sum + e.valor, 0);
  const totalPagoGastos = data.expenses.filter((e) => e.pago).reduce((sum, e) => sum + e.valor, 0);
  const expensesView = data.expenses.slice().reverse();

  return (
    <div>
      <h1 className="page-title">Financeiro</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className={`tab-btn${store.finTab === "recebimentos" ? " active" : ""}`} onClick={() => store.setFinTab("recebimentos")}>
          Recebimentos
        </button>
        <button className={`tab-btn${store.finTab === "gastos" ? " active" : ""}`} onClick={() => store.setFinTab("gastos")}>
          Gastos e dívidas
        </button>
      </div>

      {store.finTab === "recebimentos" && (
        <div>
          <div className="stat-row" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Total Pix</div>
              <div className="stat-value">{fmtMoney(totalByMetodo("pix"))}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Dinheiro</div>
              <div className="stat-value">{fmtMoney(totalByMetodo("dinheiro"))}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Cartão</div>
              <div className="stat-value">{fmtMoney(totalByMetodo("cartao"))}</div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 20, maxWidth: 640 }}>
            <div className="panel-title">Anotar recebimento manual</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label className="field-label-sm">
                Tipo
                <select className="input-sm" value={manualPayForm.tipo} onChange={field<ManualPayForm>(setManualPayForm, "tipo")}>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>
              </label>
              <label className="field-label-sm">
                Valor (R$)
                <input
                  className="input-sm"
                  type="number"
                  step="0.01"
                  value={manualPayForm.valor}
                  onChange={field<ManualPayForm>(setManualPayForm, "valor")}
                  placeholder="0,00"
                />
              </label>
              <label className="field-label-sm" style={{ flex: 1 }}>
                Observação
                <input
                  className="input-sm"
                  value={manualPayForm.obs}
                  onChange={field<ManualPayForm>(setManualPayForm, "obs")}
                  placeholder="Opcional"
                />
              </label>
              <button className="btn-primary-sm" onClick={store.submitManualPayment}>
                Adicionar
              </button>
            </div>
          </div>

          <div className="table-panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Origem</th>
                  <th>Método</th>
                  <th>Valor</th>
                  <th>Obs.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paymentsView.map((r) => (
                  <tr key={r.id}>
                    <td>{r.data}</td>
                    <td>{r.origem}</td>
                    <td>{METODO_LABELS[r.metodo] ?? r.metodo}</td>
                    <td className="num" style={{ color: "var(--color-accent-700)", fontWeight: 600 }}>
                      {fmtMoney(r.valor)}
                    </td>
                    <td style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{r.obs}</td>
                    <td>
                      {r.isManual && (
                        <button className="btn-small-danger" onClick={() => store.deleteManualPayment(r.id)}>
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {store.finTab === "gastos" && (
        <div>
          <div className="stat-row" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Devendo — mercado</div>
              <div className="stat-value-danger">{fmtMoney(devendoMercado)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Devendo — geral</div>
              <div className="stat-value-danger">{fmtMoney(devendoGeral)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Já pago</div>
              <div className="stat-value">{fmtMoney(totalPagoGastos)}</div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 20, maxWidth: 720 }}>
            <div className="panel-title">Anotar gasto / dívida</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label className="field-label-sm">
                Tipo
                <select className="input-sm" value={expenseForm.tipo} onChange={field<ExpenseForm>(setExpenseForm, "tipo")}>
                  <option value="mercado">Mercado / fornecedor</option>
                  <option value="geral">Conta geral</option>
                </select>
              </label>
              <label className="field-label-sm" style={{ flex: 1 }}>
                Descrição / fornecedor
                <input
                  className="input-sm"
                  value={expenseForm.descricao}
                  onChange={field<ExpenseForm>(setExpenseForm, "descricao")}
                  placeholder="Ex: Atacadão, aluguel..."
                />
              </label>
              <label className="field-label-sm">
                Valor (R$)
                <input
                  className="input-sm"
                  type="number"
                  step="0.01"
                  value={expenseForm.valor}
                  onChange={field<ExpenseForm>(setExpenseForm, "valor")}
                  placeholder="0,00"
                />
              </label>
              <label className="field-check">
                <input type="checkbox" checked={expenseForm.pago} onChange={fieldChecked<ExpenseForm>(setExpenseForm, "pago")} />
                Já pago
              </label>
              <button className="btn-primary-sm" onClick={store.submitExpense}>
                Adicionar
              </button>
            </div>
          </div>

          <div className="table-panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expensesView.map((e) => (
                  <tr key={e.id}>
                    <td>{e.data}</td>
                    <td>{TIPO_LABELS[e.tipo] ?? e.tipo}</td>
                    <td>{e.descricao}</td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {fmtMoney(e.valor)}
                    </td>
                    <td>
                      <button className={`status-btn${e.pago ? " paid" : ""}`} onClick={() => store.toggleExpensePaid(e.id)}>
                        {e.pago ? "Pago" : "Devendo"}
                      </button>
                    </td>
                    <td>
                      <button className="btn-small-danger" onClick={() => store.deleteExpense(e.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
