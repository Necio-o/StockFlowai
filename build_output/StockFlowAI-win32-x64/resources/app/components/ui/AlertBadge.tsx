import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertBadgeProps {
  type: 'critical' | 'warning' | 'success' | 'normal';
  text: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ type, text }) => {
  const styles = {
    critical: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    success: "bg-green-100 text-green-800 border-green-200",
    normal: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const icons = {
    critical: <AlertCircle className="w-4 h-4 mr-1" />,
    warning: <AlertTriangle className="w-4 h-4 mr-1" />,
    success: <CheckCircle className="w-4 h-4 mr-1" />,
    normal: <span />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type]}`}>
      {icons[type]}
      {text}
    </span>
  );
};
