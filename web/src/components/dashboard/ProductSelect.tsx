import { useDashboard } from '@/context';

export function ProductSelect() {
  const { selectedProductIds, updateSelectedProducts, products, productsLoading } = useDashboard();

  const handleProductToggle = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      updateSelectedProducts(selectedProductIds.filter((id) => id !== productId));
    } else {
      updateSelectedProducts([...selectedProductIds, productId]);
    }
  };

  const handleSelectAll = () => {
    updateSelectedProducts(products.map((p) => p.id));
  };

  const handleClearAll = () => {
    updateSelectedProducts([]);
  };

  if (productsLoading) {
    return <div className="product-select">Loading products...</div>;
  }

  const allSelected = selectedProductIds.length === products.length && products.length > 0;
  const noneSelected = selectedProductIds.length === 0;

  return (
    <div className="product-select">
      <div className="product-select-header">
        <span className="product-select-label">Products</span>
        <div className="product-select-actions">
          <button onClick={handleSelectAll} className="select-action-btn" disabled={allSelected}>
            Select All
          </button>
          <button onClick={handleClearAll} className="select-action-btn" disabled={noneSelected}>
            Clear All
          </button>
        </div>
      </div>
      <div className="product-checkboxes">
        {products.map((product) => (
          <label key={product.id} className="product-checkbox">
            <input
              type="checkbox"
              checked={selectedProductIds.includes(product.id)}
              onChange={() => handleProductToggle(product.id)}
            />
            <span className="product-name">{product.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
