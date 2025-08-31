import * as React from "react";
import { Badge } from "./badge";
import { Clock, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export type TaskStatus = 'en_attente' | 'en_cours' | 'terminee' | 'annulee';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig = {
  en_attente: {
    label: "En attente",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
    icon: Clock
  },
  en_cours: {
    label: "En cours",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    icon: PlayCircle
  },
  terminee: {
    label: "Terminée",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    icon: CheckCircle2
  },
  annulee: {
    label: "Annulée",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
    icon: XCircle
  }
};

export function TaskStatusBadge({ 
  status, 
  className, 
  showIcon = true 
}: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        "border transition-all duration-200 font-medium",
        config.className,
        className
      )}
      variant="outline"
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}