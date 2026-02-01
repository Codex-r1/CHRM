"use client";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export type AlertType = 'error' | 'success' | 'info' | 'warning';
export type AlertModalProps = {
  show: boolean;
  type: AlertType;
  title: string;
  message: string | ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
  onClose: () => void;
  showCloseButton?: boolean;
};

export default function AlertModal({
  show,
  type,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  onCancel,
  cancelText = 'Cancel',
  onClose,
  showCloseButton = true
}: AlertModalProps) {
  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-pink-50',
          border: 'border-red-200',
          icon: <AlertCircle className="text-red-600" size={32} />,
          buttonBg: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800'
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-green-200',
          icon: <CheckCircle className="text-green-600" size={32} />,
          buttonBg: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
          border: 'border-amber-200',
          icon: <AlertCircle className="text-amber-600" size={32} />,
          buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600',
          titleColor: 'text-amber-900',
          messageColor: 'text-amber-800'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          icon: <Info className="text-blue-600" size={32} />,
          buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800'
        };
    }
  };

  const styles = getAlertStyles();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`${styles.bg} border-2 ${styles.border} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    {styles.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold font-poppins mb-2 ${styles.titleColor}`}>
                      {title}
                    </h3>
                    <div className={`${styles.messageColor} leading-relaxed`}>
                      {typeof message === 'string' ? <p>{message}</p> : message}
                    </div>
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  {onCancel && (
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                    >
                      {cancelText}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 px-4 py-3 ${styles.buttonBg} text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}