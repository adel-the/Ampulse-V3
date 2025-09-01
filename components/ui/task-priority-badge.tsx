import * as React from "react";
import { Badge } from "./badge";
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

export type TaskPriority = 'faible' | 'moyenne' | 'haute' | 'urgente';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

const priorityConfig = {
  urgente: {
    label: "Urgent",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 animate-pulse",
    icon: AlertTriangle
  },
  haute: {
    label: "Haute",
    className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
    icon: ArrowUp
  },
  moyenne: {
    label: "Moyenne",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
    icon: Minus
  },
  faible: {
    label: "Faible",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    icon: ArrowDown
  }
};

export function TaskPriorityBadge({ 
  priority, 
  className, 
  showIcon = true 
}: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority];
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