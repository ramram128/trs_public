import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

const ConfirmModal = ({
  isOpen = true,
  onClose,
  onCancel,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to perform this action? This cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'info'
  isLoading = false
}) => {
  const handleClose = onClose || onCancel;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              type === 'danger' && "bg-red-100 text-red-600",
              type === 'warning' && "bg-amber-100 text-amber-600",
              type === 'info' && "bg-blue-100 text-blue-600",
            )}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button 
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center min-w-[80px]",
              type === 'danger' ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400" :
              type === 'warning' ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400" :
              "bg-[#1a3c2e] hover:bg-[#1a3c2e]/90 disabled:bg-[#1a3c2e]/50"
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
