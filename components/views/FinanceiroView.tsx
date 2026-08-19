"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney, todayStr } from "@/lib/format";
import { ExpenseForm, ManualPayForm, PagamentoMetodo } from "@/lib/types";

const METODO_LABELS: Record<PagamentoMetodo, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
};
const TIPO_LABELS: Record<string, string> = { mercado: "Mercado", geral: "Conta geral", producao: "Produção" };

export function FinanceiroView({ store }: { store: InventoryStore }) {
  const { data, field, fieldChecked, manualPayForm, setManualPayForm, expenseForm, setExpenseForm } = store;

  const totalByMetodo = (m: PagamentoMetodo) =>
    data.sales.filter((v) => v.pagamento === m).reduce((sum, v) => sum + v.total, 0) +
    data.manualPagamentos.filter((p) => p.tipo === m).reduce((sum, p) => sum + p.valor, 0);

  const paymentsView = [
    ...data.sales.map((v) => ({ id: v.id, data: v.data, origem: "Venda", metodo: v.pagamento, valor: v.total, obs: "", isManual: false })),
    ...data.manualPagamentos.map((m) => ({ id: m.id, data: m.data, origem: "Manual", metodo: m.tipo, valor: m.valor, obs: m.obs, isManual: true })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1));

  // — Lucro calculation —
  const totalVendido = data.sales.reduce((sum, s) => sum + s.total, 0);
  const custoVendido = data.sales.reduce((sum, s) => {
    return sum + s.itens.reduce((isum, item) => {
      const p = data.products.find((x) => x.id === item.productId);
      return isum + item.qtd * (p ? p.custoAtual : 0);
    }, 0);
  }, 0);
  const lucroBruto = totalVendido - custoVendido;
  const totalDespesasPagas = data.expenses.filter((e) => e.pago).reduce((sum, e) => sum + e.valor, 0);
  const lucroLiquido = lucroBruto - totalDespesasPagas;

  // — Gastos —
  const devendoMercado = data.expenses.filter((e) => e.tipo === "mercado" && !e.pago).reduce((sum, e) => sum + e.valor, 0);
  const devendoGeral = data.expenses.filter((e) => e.tipo === "geral" && !e.pago).reduce((sum, e) => sum + e.valor, 0);
  const totalPagoGastos = data.expenses.filter((e) => e.pago).reduce((sum, e) => sum + e.valor, 0);
  const expensesView = data.expenses.slice().reverse();

  const today = todayStr();

  // — Balanço —
  const metodos: PagamentoMetodo[] = ["pix", "dinheiro", "cartao_credito", "cartao_debito"];
  const balancoData = metodos.map((m) => {
    const recebido = totalByMetodo(m);
    const pago = data.expenses.filter((e) => e.pago && e.metodoPagamento === m).reduce((sum, e) => sum + e.valor, 0);
    return { metodo: m, label: METODO_LABELS[m], recebido, pago, saldo: recebido - pago };
  });
  const totalRecebido = balancoData.reduce((sum, b) => sum + b.recebido, 0);
  const totalPago = balancoData.reduce((sum, b) => sum + b.pago, 0);
  const saldoGeral = totalRecebido - totalPago;

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
        <button className={`tab-btn${store.finTab === "balanco" ? " active" : ""}`} onClick={() => store.setFinTab("balanco")}>
          Balanço
        </button>
      </div>

      {store.finTab === "recebimentos" && (
        <div>
          {/* Lucro Cards */}
          <div className="panel" style={{ marginBottom: 20, padding: 16 }}>
            <div className="panel-title" style={{ marginBottom: 12 }}>Lucro — Compra vs Venda</div>
            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-label">Total Vendido</div>
                <div className="stat-value">{fmtMoney(totalVendido)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Custo dos Produtos</div>
                <div className="stat-value" style={{ color: "var(--color-danger, #e74c3c)" }}>{fmtMoney(custoVendido)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lucro Bruto</div>
                <div className="stat-value" style={{ color: lucroBruto >= 0 ? "var(--color-accent-700)" : "var(--color-danger, #e74c3c)" }}>
                  {fmtMoney(lucroBruto)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Despesas Pagas</div>
                <div className="stat-value" style={{ color: "var(--color-danger, #e74c3c)" }}>{fmtMoney(totalDespesasPagas)}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: "3px solid var(--color-accent-700)" }}>
                <div className="stat-label" style={{ fontWeight: 700 }}>Lucro Líquido</div>
                <div className="stat-value" style={{ color: lucroLiquido >= 0 ? "var(--color-accent-700)" : "var(--color-danger, #e74c3c)", fontSize: 22 }}>
                  {fmtMoney(lucroLiquido)}
                </div>
              </div>
            </div>
          </div>

          {/* Totais por método */}
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
              <div className="stat-label">Total Crédito</div>
              <div className="stat-value">{fmtMoney(totalByMetodo("cartao_credito"))}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Débito</div>
              <div className="stat-value">{fmtMoney(totalByMetodo("cartao_debito"))}</div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 20, maxWidth: 640 }}>
            <div className="panel-title">Anotar recebimento manual</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label className="field-label-sm">
                Data (opcional)
                <input
                  type="date"
                  className="input-sm"
                  value={manualPayForm.data}
                  onChange={field<ManualPayForm>(setManualPayForm, "data")}
                />
              </label>
              <label className="field-label-sm">
                Tipo
                <select className="input-sm" value={manualPayForm.tipo} onChange={field<ManualPayForm>(setManualPayForm, "tipo")}>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
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
                      {r.isManual ? (
                        <button className="btn-small-danger" onClick={() => store.deleteManualPayment(r.id)}>
                          Excluir
                        </button>
                      ) : (
                        <button className="btn-small-danger" onClick={() => store.deleteSale(r.id)}>
                          Excluir Venda
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

          {/* Próximos vencimentos */}
          {(() => {
            const proxVencimentos = data.expenses
              .filter((e) => !e.pago && e.dataVencimento)
              .sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))
              .slice(0, 5);
            if (proxVencimentos.length === 0) return null;
            return (
              <div className="panel" style={{ marginBottom: 20, maxWidth: 720, borderLeft: "3px solid var(--color-accent-700)" }}>
                <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  📅 Próximos vencimentos
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {proxVencimentos.map((e) => {
                    const vencido = e.dataVencimento <= today;
                    return (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: vencido ? "color-mix(in srgb, var(--color-danger, #e74c3c) 10%, transparent)" : "var(--color-surface)",
                          border: vencido ? "1px solid var(--color-danger, #e74c3c)" : "1px solid var(--color-divider)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{e.descricao}</div>
                          <div style={{ fontSize: 11, color: vencido ? "var(--color-danger, #e74c3c)" : "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                            {vencido ? "⚠ VENCIDO — " : ""}Vence em: {e.dataVencimento}
                          </div>
                        </div>
                        <div className="num" style={{ fontWeight: 700, fontSize: 15, color: "var(--color-danger, #e74c3c)" }}>
                          {fmtMoney(e.valor)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="panel" style={{ marginBottom: 20, maxWidth: 720 }}>
            <div className="panel-title">Anotar gasto / dívida</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label className="field-label-sm">
                Tipo
                <select className="input-sm" value={expenseForm.tipo} onChange={field<ExpenseForm>(setExpenseForm, "tipo")}>
                  <option value="mercado">Mercado / fornecedor</option>
                  <option value="geral">Conta geral</option>
                  <option value="producao">Produção</option>
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
              <label className="field-label-sm">
                Vencimento
                <input
                  type="date"
                  className="input-sm"
                  value={expenseForm.dataVencimento}
                  onChange={field<ExpenseForm>(setExpenseForm, "dataVencimento")}
                />
              </label>
              <label className="field-label-sm">
                Pago via
                <select className="input-sm" value={expenseForm.metodoPagamento} onChange={field<ExpenseForm>(setExpenseForm, "metodoPagamento")}>
                  <option value="">—</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                </select>
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
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expensesView.map((e) => {
                  const vencido = !e.pago && e.dataVencimento && e.dataVencimento <= today;
                  return (
                    <tr key={e.id} style={vencido ? { background: "color-mix(in srgb, var(--color-danger, #e74c3c) 6%, transparent)" } : undefined}>
                      <td>{e.data}</td>
                      <td>{TIPO_LABELS[e.tipo] ?? e.tipo}</td>
                      <td>{e.descricao}</td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {fmtMoney(e.valor)}
                      </td>
                      <td style={{ color: vencido ? "var(--color-danger, #e74c3c)" : "inherit", fontWeight: vencido ? 700 : 400 }}>
                        {e.dataVencimento || "—"}
                        {vencido && " ⚠"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {store.finTab === "balanco" && (
        <div>
          <div className="panel" style={{ marginBottom: 20, padding: 16 }}>
            <div className="panel-title" style={{ marginBottom: 12 }}>Balanço Geral — Recebido vs Pago</div>
            <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginBottom: 16 }}>
              Mostra quanto você recebeu (vendas + recebimentos manuais) e quanto pagou (despesas marcadas como pagas com método de pagamento informado), por cada método.
            </div>

            <div className="stat-row" style={{ marginBottom: 24 }}>
              <div className="stat-card" style={{ borderLeft: "3px solid var(--color-accent-700)" }}>
                <div className="stat-label" style={{ fontWeight: 700 }}>Saldo Geral</div>
                <div className="stat-value" style={{ fontSize: 24, color: saldoGeral >= 0 ? "var(--color-accent-700)" : "var(--color-danger, #e74c3c)" }}>
                  {fmtMoney(saldoGeral)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Recebido</div>
                <div className="stat-value">{fmtMoney(totalRecebido)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Pago</div>
                <div className="stat-value-danger">{fmtMoney(totalPago)}</div>
              </div>
            </div>

            <div className="table-panel">
              <table className="table">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Recebido</th>
                    <th>Pago</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {balancoData.map((b) => (
                    <tr key={b.metodo}>
                      <td style={{ fontWeight: 600 }}>{b.label}</td>
                      <td className="num" style={{ color: "var(--color-accent-700)", fontWeight: 600 }}>
                        {fmtMoney(b.recebido)}
                      </td>
                      <td className="num" style={{ color: "var(--color-danger, #e74c3c)", fontWeight: 600 }}>
                        {fmtMoney(b.pago)}
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: b.saldo >= 0 ? "var(--color-accent-700)" : "var(--color-danger, #e74c3c)" }}>
                        {fmtMoney(b.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
