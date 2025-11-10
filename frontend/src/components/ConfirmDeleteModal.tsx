import React from "react";
import "./ConfirmDeleteModal.css";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-icon danger">🗑️</div>
          <h2 className="modal-title">{title}</h2>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          {itemName && (
            <div className="item-highlight">
              <strong>{itemName}</strong>
            </div>
          )}
          <p className="modal-warning">⚠️ Esta ação não pode ser desfeita!</p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-modal btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-modal btn-delete"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deletando..." : "Sim, Deletar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
