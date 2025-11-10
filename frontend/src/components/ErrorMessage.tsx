import React from "react";
import "./ErrorMessage.css";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  fullScreen = false,
}) => {
  const content = (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <h3>Ops! Algo deu errado</h3>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-retry-btn">
          Tentar Novamente
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return <div className="error-fullscreen">{content}</div>;
  }

  return content;
};

export default ErrorMessage;
