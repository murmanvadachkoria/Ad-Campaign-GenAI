import './ProductCard.css'

const FIELD_META = {
  name:        { label: 'Product Name',    placeholder: 'e.g. Citrus Burst',                      type: 'text'     },
  category:    { label: 'Category',        placeholder: 'e.g. beverage, snack, personal care',    type: 'text'     },
  description: { label: 'Description',     placeholder: 'Brief product description…',             type: 'textarea' },
  message:     { label: 'Ad Message',      placeholder: 'Tagline shown on the creative…',         type: 'textarea' },
}

export default function ProductCard({ product, index, onChange, onRemove, canRemove }) {
  const handleField = (field, value) => {
    onChange(index, { ...product, [field]: value })
  }

  return (
    <div className="product-card fade-up">
      <div className="product-card-header">
        <div className="product-index">
          <span>P{index + 1}</span>
        </div>
        <h3 className="product-card-title">
          {product.name || `Product ${index + 1}`}
        </h3>
        {canRemove && (
          <button className="btn-danger" onClick={() => onRemove(index)} title="Remove product">
            ✕ Remove
          </button>
        )}
      </div>

      <div className="product-fields">
        {Object.entries(FIELD_META).map(([field, meta]) => (
          <div className="field-group" key={field}>
            <label htmlFor={`product-${index}-${field}`}>{meta.label}</label>
            {meta.type === 'textarea' ? (
              <textarea
                id={`product-${index}-${field}`}
                rows={2}
                value={product[field] || ''}
                onChange={e => handleField(field, e.target.value)}
                placeholder={meta.placeholder}
              />
            ) : (
              <input
                id={`product-${index}-${field}`}
                type="text"
                value={product[field] || ''}
                onChange={e => handleField(field, e.target.value)}
                placeholder={meta.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
