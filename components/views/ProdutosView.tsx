"use client";

import { InventoryStore } from "@/lib/useInventoryStore";
import { fmtMoney } from "@/lib/format";
import { ProductForm } from "@/lib/types";

export function ProdutosView({ store }: { store: InventoryStore }) {
  const { data, productForm, setProductForm, field, purchaseForm, setPurchaseForm } = store;
  const isEditingProduct = !!productForm.editingId;
  const expandedProduct = data.products.find((p) => p.id === store.expandedProductId) ?? null;
  const purchases = expandedProduct
    ? data.purchases
        .filter((pu) => pu.productId === expandedProduct.id)
        .slice()
        .reverse()
    : [];

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
            <input className="input" value={productForm.ncm} onChange={field<ProductForm>(setProductForm, "ncm")} placeholder="0000.00.00" />
          </label>
          <label className="field-label">
            CEST
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => store.toggleExpand(p.id)}>
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
                  {p.estoque} {p.unidade}
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
            ))}
          </tbody>
        </table>
      </div>

      {expandedProduct && (
        <div className="panel" style={{ marginTop: 16, maxWidth: 720 }}>
          <div className="panel-title" style={{ fontSize: 12, marginBottom: 10 }}>
            Histórico de compras — {expandedProduct.nome}
          </div>
          {purchases.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
              <tbody>
                {purchases.map((pu) => (
                  <tr key={pu.id}>
                    <td style={{ padding: "4px 8px 4px 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{pu.data}</td>
                    <td style={{ padding: "4px 8px" }}>{pu.local}</td>
                    <td className="num" style={{ padding: "4px 8px" }}>
                      {fmtMoney(pu.preco)}
                    </td>
                    <td style={{ padding: "4px 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      {pu.qtd} {expandedProduct.unidade}
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
            <button className="btn-primary-sm" onClick={() => store.submitPurchase(expandedProduct.id)}>
              Registrar compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
