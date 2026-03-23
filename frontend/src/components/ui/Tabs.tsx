import { createContext, useContext, useState, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultTab: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  children,
  className,
}: TabsProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab);
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const setActiveTab = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
      return;
    }
    setInternalActiveTab(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export const TabList = ({ children, className }: TabListProps) => {
  return (
    <div
      className={cn(
        "flex border-b border-gray-200 overflow-x-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

interface TabProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const Tab = ({ id, children, className }: TabProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab must be used within Tabs");

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
        "border-b-2 -mb-px",
        isActive
          ? "border-primary-500 text-primary-600"
          : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300",
        className
      )}
    >
      {children}
    </button>
  );
};

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const TabPanel = ({ id, children, className }: TabPanelProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabPanel must be used within Tabs");

  const { activeTab } = context;

  if (activeTab !== id) return null;

  return <div className={cn("py-6", className)}>{children}</div>;
};