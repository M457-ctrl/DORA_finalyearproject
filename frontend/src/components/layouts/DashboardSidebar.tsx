import React from "react";

export type NavigationItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    value: number | string;
    color?: "red" | "gray" | "blue" | "green";
  };
};

type DashboardSidebarProps = {
  title: string;
  subtitle?: string;
  navigationItems: NavigationItem[];
  currentView: string;
  onViewChange: (view: string) => void;
  colorScheme?: "blue" | "green";
  showLogout?: boolean;
  onLogout?: () => void;
};

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  title,
  subtitle,
  navigationItems,
  currentView,
  onViewChange,
  colorScheme = "blue",
  showLogout = false,
  onLogout,
}) => {
  const colorClasses = {
    blue: {
      active: "bg-blue-50 text-blue-600 border-r-4 border-blue-600",
      hover: "text-gray-700 hover:bg-gray-50",
    },
    green: {
      active: "bg-green-50 text-green-600 border-r-4 border-green-600",
      hover: "text-gray-700 hover:bg-gray-50",
    },
  };

  const badgeColors = {
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-200 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
  };

  const colors = colorClasses[colorScheme];

  return (
    <aside className="w-64 bg-white shadow-md shrink-0">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <nav className="mt-6">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
              currentView === item.id ? colors.active : colors.hover
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
            {item.badge && (
              <span
                className={`ml-auto ${badgeColors[item.badge.color || "gray"]} text-xs px-2 py-1 rounded-full`}
              >
                {item.badge.value}
              </span>
            )}
          </button>
        ))}
      </nav>
      {showLogout && onLogout && (
        <div className="p-6 mt-auto absolute bottom-0 left-0 right-0">
          <button
            onClick={onLogout}
            className="w-[150px] px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default DashboardSidebar;
