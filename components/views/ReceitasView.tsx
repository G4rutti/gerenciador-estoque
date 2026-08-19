"use client";

import React, { useState } from "react";
import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";
import { RecipeForm, RecipeItemForm } from "@/lib/types";

export function ReceitasView({ store }: { store: InventoryStore }) {
  const {
    data,
    recipeForm,
    setRecipeForm,
    recipeItemForm,
    setRecipeItemForm,
    field,
    submitRecipeForm,
    updateRecipeFields,
    deleteRecipe,
    addRecipeItem,
    deleteRecipeItem,
    produceRecipe,
    expandedRecipeId,
    setExpandedRecipeId,
  } = store;

  const [batchMultiplier, setBatchMultiplier] = useState<Record<string, string>>({});

  const selectedProduct = data.products.find((p) => p.id === recipeItemForm.productId);

  return (
    <div>
      <h1 className="page-title">Receitas e Fichas Técnicas</h1>
      <div className="page-subtitle">
        Gerencie suas receitas, acompanhe a quantidade de ingredientes utilizados e o custo de produção.
      </div>

      {/* Form de Cadastro de Receita */}
      <div className="panel" style={{ marginBottom: 24, maxWidth: 720 }}>
        <div className="panel-title">Cadastrar nova receita</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label className="field-label" style={{ gridColumn: "1/-1" }}>
            Nome da receita
            <input
              className="input"
              value={recipeForm.nome}
              onChange={field<RecipeForm>(setRecipeForm, "nome")}
              placeholder="Ex: Bolo de Cenoura com Cobertura"
            />
          </label>
          <label className="field-label">
            Rendimento / Porções (texto)
            <input
              className="input"
              value={recipeForm.rendimento}
              onChange={field<RecipeForm>(setRecipeForm, "rendimento")}
              placeholder="Ex: 10 fatias, 2 kg"
            />
          </label>
          <label className="field-label">
            Qtd produzida (número)
            <input
              className="input"
              type="number"
              step="0.01"
              value={recipeForm.rendimentoQtd}
              onChange={field<RecipeForm>(setRecipeForm, "rendimentoQtd")}
              placeholder="Ex: 10"
            />
          </label>
          <label className="field-label">
            Produto final (gerado ao produzir)
            <select
              className="input"
              value={recipeForm.produtoFinalId}
              onChange={field<RecipeForm>(setRecipeForm, "produtoFinalId")}
            >
              <option value="">Nenhum — só dar baixa nos ingredientes</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </label>
          <label className="field-label" style={{ gridColumn: "1/-1" }}>
            Descrição / Observações
            <input
              className="input"
              value={recipeForm.descricao}
              onChange={field<RecipeForm>(setRecipeForm, "descricao")}
              placeholder="Opcional: tempo de forno, observações..."
            />
          </label>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={submitRecipeForm}>
            Cadastrar receita
          </button>
        </div>
      </div>

      {/* Lista de Receitas */}
      {data.recipes.length === 0 ? (
        <div className="panel" style={{ maxWidth: 720 }}>
          <div className="empty-hint">Nenhuma receita cadastrada ainda.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
          {data.recipes.map((r) => {
            const isExpanded = expandedRecipeId === r.id;

            // Calcular custo total da receita
            const custoTotal = r.itens.reduce((sum, item) => {
              const p = data.products.find((x) => x.id === item.productId);
              if (!p) return sum;
              return sum + item.qtd * p.custoAtual;
            }, 0);

            const multiplierVal = Number(batchMultiplier[r.id] ?? "1") || 1;

            // Produto final
            const produtoFinal = r.produtoFinalId ? data.products.find((p) => p.id === r.produtoFinalId) : null;
            const lucroPorLote = produtoFinal && r.rendimentoQtd > 0
              ? (produtoFinal.precoVenda * r.rendimentoQtd) - custoTotal
              : null;

            return (
              <div key={r.id} className="panel" style={{ background: isExpanded ? "var(--color-surface)" : "transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedRecipeId(isExpanded ? null : r.id)}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{isExpanded ? "▼" : "▶"}</span>
                      {r.nome}
                    </h3>
                    <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginTop: 4 }}>
                      Rendimento: <strong>{r.rendimento || "Não informado"}</strong> · Ingredientes: <strong>{r.itens.length}</strong>
                      {produtoFinal && (
                        <> · Produto final: <strong>{produtoFinal.nome}</strong> ({r.rendimentoQtd} un)</>
                      )}
                    </div>
                    {r.descricao && (
                      <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 50%, transparent)", marginTop: 2 }}>
                        {r.descricao}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase", fontWeight: 700 }}>
                      Custo Total estimado
                    </div>
                    <div className="num" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-accent-700)" }}>
                      {fmtMoney(custoTotal)}
                    </div>
                    {lucroPorLote !== null && (
                      <div style={{ fontSize: 12, color: lucroPorLote >= 0 ? "var(--color-accent-700)" : "var(--color-danger, #e74c3c)" }}>
                        Lucro/lote: <strong>{fmtMoney(lucroPorLote)}</strong>
                      </div>
                    )}
                    <button
                      className="btn-small-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(r.id);
                      }}
                      style={{ fontSize: 11 }}
                    >
                      Excluir Receita
                    </button>
                  </div>
                </div>

                {/* Detalhes da Receita quando expandida */}
                {isExpanded && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
                    {/* Configuração do produto final */}
                    <div className="panel" style={{ background: "var(--color-bg)", marginBottom: 16 }}>
                      <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>Produto final e rendimento</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <label className="field-label-sm" style={{ flex: 1 }}>
                          Produto final gerado
                          <select
                            className="input-sm"
                            value={r.produtoFinalId ?? ""}
                            onChange={(e) => updateRecipeFields(r.id, { produtoFinalId: e.target.value || null })}
                          >
                            <option value="">Nenhum</option>
                            {data.products.map((p) => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field-label-sm" style={{ width: 120 }}>
                          Qtd produzida
                          <input
                            type="number"
                            className="input-sm"
                            step="0.01"
                            value={r.rendimentoQtd || ""}
                            onChange={(e) => updateRecipeFields(r.id, { rendimentoQtd: Number(e.target.value) || 0 })}
                            placeholder="Ex: 10"
                          />
                        </label>
                      </div>
                      {produtoFinal && r.rendimentoQtd > 0 && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "color-mix(in srgb, var(--color-accent-700) 8%, transparent)", borderRadius: 6, fontSize: 13 }}>
                          <strong>Resumo:</strong> Custo {fmtMoney(custoTotal)} para produzir {r.rendimentoQtd} × {produtoFinal.nome} (venda: {fmtMoney(produtoFinal.precoVenda)} cada)
                          → Faturamento: <strong>{fmtMoney(produtoFinal.precoVenda * r.rendimentoQtd)}</strong>
                          → Lucro: <strong style={{ color: lucroPorLote != null && lucroPorLote >= 0 ? "var(--color-accent-700)" : "var(--color-danger, #e74c3c)" }}>
                            {fmtMoney(lucroPorLote ?? 0)}
                          </strong>
                        </div>
                      )}
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", textTransform: "uppercase" }}>
                      Ingredientes utilizados nesta receita
                    </h4>

                    {r.itens.length === 0 ? (
                      <div className="empty-hint" style={{ marginBottom: 16 }}>Nenhum ingrediente adicionado ainda.</div>
                    ) : (
                      <table className="table" style={{ marginBottom: 16, background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                        <thead>
                          <tr>
                            <th>Ingrediente / Produto</th>
                            <th>Qtd Usada</th>
                            <th>Custo Unit.</th>
                            <th>Custo Item</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.itens.map((item) => {
                            const p = data.products.find((x) => x.id === item.productId);
                            const v = p?.variations.find((v) => v.id === item.variationId);
                            const nomeExibicao = v ? `${p?.nome} (${v.nome})` : p?.nome ?? "Produto removido";
                            const custoUnit = p ? p.custoAtual : 0;
                            const custoItem = item.qtd * custoUnit;

                            return (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 600 }}>{nomeExibicao}</td>
                                <td>
                                  <span className="num">{item.qtd}</span> {p?.unidade ?? ""}
                                </td>
                                <td className="num" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                                  {fmtMoney(custoUnit)}
                                </td>
                                <td className="num" style={{ fontWeight: 600, color: "var(--color-accent-700)" }}>
                                  {fmtMoney(custoItem)}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <button className="btn-small-danger" onClick={() => deleteRecipeItem(r.id, item.id)}>
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* Form para adicionar ingrediente à receita */}
                    <div className="panel" style={{ background: "var(--color-bg)", marginBottom: 16 }}>
                      <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>Adicionar ingrediente</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <label className="field-label-sm" style={{ minWidth: 200, flex: 1 }}>
                          Produto / Insumo
                          <select
                            className="input-sm"
                            value={recipeItemForm.productId}
                            onChange={(e) => {
                              const pid = e.target.value;
                              setRecipeItemForm((f) => ({ ...f, productId: pid, variationId: "" }));
                            }}
                          >
                            <option value="">Selecione o produto...</option>
                            {data.products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} ({fmtMoney(p.custoAtual)} / {p.unidade})
                              </option>
                            ))}
                          </select>
                        </label>

                        {selectedProduct && selectedProduct.variations.length > 0 && (
                          <label className="field-label-sm" style={{ minWidth: 160 }}>
                            Variação (opcional)
                            <select
                              className="input-sm"
                              value={recipeItemForm.variationId}
                              onChange={field<RecipeItemForm>(setRecipeItemForm, "variationId")}
                            >
                              <option value="">Todas / Produto principal</option>
                              {selectedProduct.variations.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.nome}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        <label className="field-label-sm" style={{ width: 110 }}>
                          Quantidade
                          <input
                            className="input-sm"
                            type="number"
                            step="0.01"
                            value={recipeItemForm.qtd}
                            onChange={field<RecipeItemForm>(setRecipeItemForm, "qtd")}
                            placeholder="Ex: 2"
                          />
                        </label>

                        <button className="btn-primary-sm" onClick={() => addRecipeItem(r.id)}>
                          + Adicionar ingrediente
                        </button>
                      </div>
                    </div>

                    {/* Seção Baixa no Estoque */}
                    {r.itens.length > 0 && (
                      <div style={{ background: "var(--color-bg)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-divider)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: produtoFinal ? 8 : 0 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>Produzir Receita / Dar Baixa no Estoque</div>
                            <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                              Desconta os ingredientes do estoque{produtoFinal ? `, adiciona ${r.rendimentoQtd}× ${produtoFinal.nome} ao estoque` : ""} e registra como despesa de produção.
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <label style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
                              Nº de Lotes / Receitas:
                            </label>
                            <input
                              type="number"
                              className="input-sm"
                              style={{ width: 64, textAlign: "center" }}
                              min="1"
                              step="1"
                              value={batchMultiplier[r.id] ?? "1"}
                              onChange={(e) => setBatchMultiplier({ ...batchMultiplier, [r.id]: e.target.value })}
                            />
                            <button
                              className="btn-primary-sm"
                              onClick={() => produceRecipe(r.id, multiplierVal)}
                            >
                              ⚡ Produzir ({multiplierVal}x) — {fmtMoney(custoTotal * multiplierVal)}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
