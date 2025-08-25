import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TopBarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TopBarProps {
  items: TopBarItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  title?: string;
  description?: string;
}

export default function TopBar({ items, activeItem, onItemClick, title, description }: TopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="px-6 py-4">
        {title && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}
        
        <div className="flex space-x-1">
          {items.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`flex items-center space-x-2 px-4 py-2 ${
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => onItemClick(item.id)}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 ${
                      isActive 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
