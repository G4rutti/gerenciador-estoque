"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";
import { lookupCestByNcm } from "@/lib/ncmCestMap";
import { ProductForm, VariationForm } from "@/lib/types";
import React, { useState } from "react";

export function ProdutosView({ store }: { store: InventoryStore }) {
  const { data, productForm, setProductForm, field, purchaseForm, setPurchaseForm } = store;
  const isEditingProduct = !!productForm.editingId;

  const [groupNameInput, setGroupNameInput] = useState("");
  const [editingGroupName, setEditingGroupName] = useState(false);

  const filteredProducts = data.products.filter((p) => {
    const q = store.productSearch.toLowerCase();
    if (!q) return true;
    return (
      p.nome.toLowerCase().includes(q) ||
      p.ncm.toLowerCase().includes(q) ||
      p.cest.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="page-title">Produtos</h1>

      <div className="panel" style={{ marginBottom: 24, maxWidth: 720 }}>
        <div className="panel-title">{isEditingProduct ? "Editar produto" : "Cadastrar novo produto"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label className="field-label" style={{ gridColumn: "1/-1" }}>
            Nome do produto
            <input
              className="input"
              value={productForm.nome}
              onChange={field<ProductForm>(setProductForm, "nome")}
              placeholder="Ex: Arroz 5kg"
            />
          </label>
          <label className="field-label">
            Unidade
            <select className="input" value={productForm.unidade} onChange={field<ProductForm>(setProductForm, "unidade")}>
              <option value="un">unidade (un)</option>
              <option value="kg">quilo (kg)</option>
              <option value="g">grama (g)</option>
              <option value="l">litro (l)</option>
              <option value="ml">mililitro (ml)</option>
            </select>
          </label>
          <label className="field-label">
            Preço de venda (R$)
            <input
              className="input"
              type="number"
              step="0.01"
              value={productForm.precoVenda}
              onChange={field<ProductForm>(setProductForm, "precoVenda")}
              placeholder="0,00"
            />
          </label>
          <label className="field-label">
            NCM
            <input
              className="input"
              value={productForm.ncm}
              onChange={(e) => {
                const ncm = e.target.value;
                setProductForm((f) => {
                  const cest = lookupCestByNcm(ncm);
                  return { ...f, ncm, ...(cest ? { cest } : {}) };
                });
              }}
              placeholder="0000.00.00"
            />
          </label>
          <label className="field-label">
            CEST
            {productForm.cest && lookupCestByNcm(productForm.ncm) === productForm.cest && (
              <span style={{ fontSize: 10, color: "var(--color-success, #22c55e)", marginLeft: 6, fontWeight: 500 }}>● auto</span>
            )}
            <input className="input" value={productForm.cest} onChange={field<ProductForm>(setProductForm, "cest")} placeholder="00.000.00" />
          </label>
          {!isEditingProduct && (
            <>
              <label className="field-label">
                Custo de compra inicial (R$)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={productForm.custoInicial}
                  onChange={field<ProductForm>(setProductForm, "custoInicial")}
                  placeholder="0,00"
                />
              </label>
              <label className="field-label">
                Quantidade em estoque
                <input
                  className="input"
                  type="number"
                  step="1"
                  value={productForm.estoqueInicial}
                  onChange={field<ProductForm>(setProductForm, "estoqueInicial")}
                  placeholder="0"
                />
              </label>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-primary" onClick={store.submitProductForm}>
            {isEditingProduct ? "Salvar alterações" : "Cadastrar produto"}
          </button>
          {isEditingProduct && (
            <button className="btn-ghost" onClick={store.cancelEditProduct}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div style={{ marginBottom: 16, maxWidth: 720 }}>
        <input
          className="input"
          value={store.productSearch}
          onChange={store.onProductSearch}
          placeholder="🔍 Buscar produto por nome, NCM ou CEST..."
        />
      </div>

      <div className="table-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Unid.</th>
              <th>NCM</th>
              <th>CEST</th>
              <th>Preço venda</th>
              <th>Custo atual</th>
              <th>Estoque</th>
              <th>Variações</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "20px 14px", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {filteredProducts.map((p) => {
              const isExpanded = store.expandedProductId === p.id;
              const purchases = data.purchases
                .filter((pu) => pu.productId === p.id)
                .slice()
                .reverse();

              return (
                <React.Fragment key={p.id}>
                  <tr>
                    <td
                      style={{ fontWeight: 600, cursor: "pointer" }}
                      onClick={() => store.toggleExpand(p.id)}
                    >
                      <span style={{ display: "inline-block", width: 16, fontSize: 10, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      {p.nome}
                    </td>
                    <td>{p.unidade}</td>
                    <td className="num" style={{ fontSize: 13 }}>
                      {p.ncm}
                    </td>
                    <td className="num" style={{ fontSize: 13 }}>
                      {p.cest}
                    </td>
                    <td className="num">{fmtMoney(p.precoVenda)}</td>
                    <td className="num" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      {fmtMoney(p.custoAtual)}
                    </td>
                    <td className="num">
                      {p.variations.length > 0
                        ? `${p.variations.reduce((sum, v) => sum + v.estoque, 0)} ${p.unidade}`
                        : `${p.estoque} ${p.unidade}`}
                    </td>
                    <td>
                      <button
                        className={`btn-small ${isExpanded ? "btn-primary-sm" : ""}`}
                        onClick={() => store.toggleExpand(p.id)}
                        style={{ fontSize: 12 }}
                      >
                        {p.variations.length > 0
                          ? `${p.variations.length} ${p.variationGroupName || "var."}`
                          : "Variações / Compras"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn-small" onClick={() => store.startEditProduct(p.id)}>
                        Editar
                      </button>
                      <button className="btn-small-danger" onClick={() => store.deleteProduct(p.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>

                  {/* Expansão em linha — detalhes do produto (variações e compras) */}
                  {isExpanded && (
                    <tr key={`expanded-${p.id}`}>
                      <td colSpan={9} style={{ padding: "16px 20px", background: "var(--color-surface)", borderTop: "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Seção de Variações */}
                          <div className="panel" style={{ maxWidth: "100%", background: "var(--color-bg)" }}>
                            <div className="panel-title" style={{ fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span>Variações — {p.nome}</span>
                            </div>

                            {/* Nome do grupo de variação */}
                            <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                                Nome do grupo:
                              </span>
                              {editingGroupName ? (
                                <>
                                  <input
                                    className="input-sm"
                                    style={{ width: 160 }}
                                    value={groupNameInput}
                                    onChange={(e) => setGroupNameInput(e.target.value)}
                                    placeholder="Ex: SABOR"
                                  />
                                  <button
                                    className="btn-primary-sm"
                                    onClick={() => {
                                      store.setVariationGroupName(p.id, groupNameInput);
                                      setEditingGroupName(false);
                                    }}
                                  >
                                    OK
                                  </button>
                                  <button className="btn-small" onClick={() => setEditingGroupName(false)}>Cancelar</button>
                                </>
                              ) : (
                                <>
                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                    {p.variationGroupName || "(não definido)"}
                                  </span>
                                  <button
                                    className="btn-small"
                                    onClick={() => {
                                      setGroupNameInput(p.variationGroupName);
                                      setEditingGroupName(true);
                                    }}
                                  >
                                    Editar
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Lista de variações existentes */}
                            {p.variations.length > 0 && (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--color-divider)" }}>
                                    <th style={{ padding: "6px 8px 6px 0", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}>
                                      {p.variationGroupName || "Variação"}
                                    </th>
                                    <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}>Código</th>
                                    <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}>Preço</th>
                                    <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}>Estoque</th>
                                    <th style={{ padding: "6px 8px", textAlign: "center", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}>Situação</th>
                                    <th style={{ padding: "6px 0", textAlign: "right", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textTransform: "uppercase" }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.variations.map((v) => (
                                    <tr key={v.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                                      <td style={{ padding: "8px 8px 8px 0", fontWeight: 600 }}>{v.nome}</td>
                                      <td style={{ padding: "8px 8px" }}>
                                        <span className="num" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                                          {v.codigo || "—"}
                                        </span>
                                      </td>
                                      <td style={{ padding: "8px 8px" }}>
                                        <span className="num">
                                          {v.precoVenda != null ? fmtMoney(v.precoVenda) : fmtMoney(p.precoVenda)}
                                          {v.precoVenda == null && (
                                            <span style={{ fontSize: 10, color: "color-mix(in srgb, var(--color-text) 40%, transparent)", marginLeft: 4 }}>
                                              (pai)
                                            </span>
                                          )}
                                        </span>
                                      </td>
                                      <td style={{ padding: "8px 8px" }}>
                                        <span className="num">{v.estoque} {p.unidade}</span>
                                      </td>
                                      <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                        <button
                                          className={`status-btn ${v.ativo ? "paid" : ""}`}
                                          onClick={() => store.toggleVariationActive(v.id)}
                                          style={{ fontSize: 11, minWidth: 70 }}
                                        >
                                          {v.ativo ? "Ativado" : "Desativado"}
                                        </button>
                                      </td>
                                      <td style={{ padding: "8px 0", textAlign: "right" }}>
                                        <button className="btn-small-danger" onClick={() => store.deleteVariation(v.id)}>
                                          Excluir
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {/* Formulário para adicionar variação */}
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", borderTop: p.variations.length > 0 ? "1px solid var(--color-divider)" : "none", paddingTop: p.variations.length > 0 ? 12 : 0 }}>
                              <label className="field-label-sm">
                                Nome da variação
                                <input
                                  className="input-sm"
                                  value={store.variationForm.nome}
                                  onChange={store.field<VariationForm>(store.setVariationForm, "nome")}
                                  placeholder="Ex: COCA-COLA"
                                />
                              </label>
                              <label className="field-label-sm">
                                Código
                                <input
                                  className="input-sm"
                                  value={store.variationForm.codigo}
                                  onChange={store.field<VariationForm>(store.setVariationForm, "codigo")}
                                  placeholder="Opcional"
                                />
                              </label>
                              <label className="field-label-sm">
                                Preço (R$)
                                <input
                                  className="input-sm"
                                  type="number"
                                  step="0.01"
                                  value={store.variationForm.precoVenda}
                                  onChange={store.field<VariationForm>(store.setVariationForm, "precoVenda")}
                                  placeholder="Preço do pai"
                                />
                              </label>
                              <label className="field-label-sm">
                                Estoque inicial
                                <input
                                  className="input-sm"
                                  type="number"
                                  step="1"
                                  value={store.variationForm.estoqueInicial}
                                  onChange={store.field<VariationForm>(store.setVariationForm, "estoqueInicial")}
                                  placeholder="0"
                                />
                              </label>
                              <button className="btn-primary-sm" onClick={() => store.addVariation(p.id)}>
                                Adicionar variação
                              </button>
                            </div>
                          </div>

                          {/* Histórico de compras */}
                          <div className="panel" style={{ maxWidth: "100%", background: "var(--color-bg)" }}>
                            <div className="panel-title" style={{ fontSize: 12, marginBottom: 10 }}>
                              Histórico de compras — {p.nome}
                            </div>
                            {purchases.length > 0 && (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--color-divider)" }}>
                                    <th style={{ padding: "4px 8px 4px 0", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Data</th>
                                    <th style={{ padding: "4px 8px", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Fornecedor/Local</th>
                                    <th style={{ padding: "4px 8px", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Preço pago</th>
                                    <th style={{ padding: "4px 8px", textAlign: "left", fontSize: 11, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Qtd</th>
                                    <th style={{ padding: "4px 0", textAlign: "right" }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {purchases.map((pu) => (
                                    <tr key={pu.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                                      <td style={{ padding: "6px 8px 6px 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{pu.data}</td>
                                      <td style={{ padding: "6px 8px" }}>{pu.local}</td>
                                      <td className="num" style={{ padding: "6px 8px" }}>
                                        {fmtMoney(pu.preco)}
                                      </td>
                                      <td style={{ padding: "6px 8px", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                                        {pu.qtd} {p.unidade}
                                      </td>
                                      <td style={{ padding: "6px 0", textAlign: "right" }}>
                                        <button className="btn-small-danger" onClick={() => store.deletePurchase(pu.id)}>
                                          Excluir
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                              <label className="field-label-sm">
                                Mercado / fornecedor
                                <input
                                  className="input-sm"
                                  value={purchaseForm.local}
                                  onChange={field(setPurchaseForm, "local")}
                                  placeholder="Ex: Atacadão"
                                />
                              </label>
                              <label className="field-label-sm">
                                Preço pago (R$)
                                <input
                                  className="input-sm"
                                  type="number"
                                  step="0.01"
                                  value={purchaseForm.preco}
                                  onChange={field(setPurchaseForm, "preco")}
                                  placeholder="0,00"
                                />
                              </label>
                              <label className="field-label-sm">
                                Quantidade comprada
                                <input
                                  className="input-sm"
                                  type="number"
                                  step="1"
                                  value={purchaseForm.qtd}
                                  onChange={field(setPurchaseForm, "qtd")}
                                  placeholder="0"
                                />
                              </label>
                              <label className="field-check">
                                <input
                                  type="checkbox"
                                  checked={purchaseForm.somar}
                                  onChange={store.fieldChecked(setPurchaseForm, "somar")}
                                />
                                Somar ao estoque
                              </label>
                              <button className="btn-primary-sm" onClick={() => store.submitPurchase(p.id)}>
                                Registrar compra
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
