"use client";

import React from "react";
import Modal from "./Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmationModalProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: "🗑️",
      confirmButton: "bg-red-600 hover:bg-red-700 text-white",
      iconBg: "bg-red-50",
      iconColor: "text-red-600"
    },
    warning: {
      icon: "⚠️",
      confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600"
    },
    info: {
      icon: "ℹ️",
      confirmButton: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600"
    }
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} mb-4`}>
          <span className="text-2xl">{styles.icon}</span>
        </div>
        
        {/* Message */}
        <p className="text-[#6b7280] mb-6 leading-relaxed">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#6b7280] bg-white border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
