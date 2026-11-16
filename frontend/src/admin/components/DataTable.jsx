import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

const DataTable = ({
  columns,
  data,
  total,
  page,
  perPage,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  isLoading = false,
  actions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {onSearch && (
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-transparent transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </form>
        )}
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
            <tr>
              {columns.map((col, index) => (
                <th key={index} scope="col" className="px-6 py-4 font-semibold text-gray-600">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  <div className="inline-flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 rounded-full animate-pulse bg-[#c9a227]"></div>
                    <div className="w-4 h-4 rounded-full animate-pulse bg-[#c9a227] animation-delay-200"></div>
                    <div className="w-4 h-4 rounded-full animate-pulse bg-[#c9a227] animation-delay-400"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{(page - 1) * perPage + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">{Math.min(page * perPage, total)}</span> of{' '}
            <span className="font-semibold text-gray-900">{total}</span> entries
          </span>
          
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page;
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      page === pageNum
                        ? 'bg-[#1a3c2e] text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
