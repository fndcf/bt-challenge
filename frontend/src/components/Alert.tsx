import React from "react";
import "./Alert.css";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  autoClose?: number; // tempo em ms
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose, autoClose }) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Tempo da animação
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!visible) return null;

  const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`alert alert-${type} ${!visible ? "alert-fade-out" : ""}`}>
      <span className="alert-icon">{icons[type]}</span>
      <span className="alert-message">{message}</span>
      {onClose && (
        <button
          className="alert-close"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
