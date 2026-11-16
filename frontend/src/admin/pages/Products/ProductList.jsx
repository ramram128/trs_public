import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProductList = () => {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // For delete modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async (currentPage, currentSearch) => {
    setLoading(true);
    try {
      const res = await adminService.getProducts({ 
        page: currentPage, 
        per_page: 10, 
        search: currentSearch || undefined
      });
      setData(res.data);
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page, search);
  }, [page]);

  const handleSearch = (term) => {
    setSearch(term);
    setPage(1);
    fetchProducts(1, term);
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, productId: id });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminService.deleteProduct(deleteModal.productId);
      toast.success('Product deleted successfully');
      setDeleteModal({ isOpen: false, productId: null });
      fetchProducts(page, search);
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {row.images && row.images.length > 0 ? (
              <img src={row.images.find(img => img.is_main)?.image_url || row.images[0].image_url} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 line-clamp-1">{row.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">SKU: {row.sku}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category_name',
      cell: (row) => <span className="text-gray-600">{row.category?.name || '-'}</span>
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">Rs. {row.final_price?.toLocaleString() || row.price?.toLocaleString()}</div>
          {row.discount_percent > 0 && (
            <div className="text-xs text-red-500 line-through mt-0.5">Rs. {row.price?.toLocaleString()}</div>
          )}
        </div>
      )
    },
    {
      header: 'Stock',
      accessor: 'stock',
      cell: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          row.stock === 0 ? 'bg-red-100 text-red-700' :
          row.stock <= row.low_stock_threshold ? 'bg-amber-100 text-amber-700' :
          'bg-emerald-100 text-emerald-700'
        }`}>
          {row.stock} {row.unit}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          row.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {row.status ? 'Active' : 'Draft'}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/products/${row.id}`} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="View details">
            <Eye className="w-4 h-4" />
          </Link>
          <Link to={`/admin/products/${row.id}/edit`} className="p-1 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
            <Edit className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => handleDeleteClick(row.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors" 
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        
        <Link 
          to="/admin/products/add" 
          className="inline-flex items-center justify-center px-4 py-2 bg-[#1a3c2e] text-white rounded-xl text-sm font-medium hover:bg-[#153024] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      <DataTable 
        columns={columns}
        data={data.items}
        total={data.total}
        page={page}
        perPage={10}
        onPageChange={setPage}
        onSearch={handleSearch}
        isLoading={loading}
        searchPlaceholder="Search products by name or SKU..."
      />

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This will permanently remove the product and its images from the database."
        isLoading={deleting}
      />
    </div>
  );
};

export default ProductList;
