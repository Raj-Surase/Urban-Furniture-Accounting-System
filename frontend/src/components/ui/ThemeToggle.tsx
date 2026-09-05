import React from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Tooltip,
} from '@heroui/react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Dropdown placement="bottom-end">
      <Tooltip content={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}>
        <div>
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              aria-label="Switch theme mode"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </Button>
          </DropdownTrigger>
        </div>
      </Tooltip>
      <DropdownMenu
        aria-label="Theme choices"
        selectedKeys={[theme]}
        selectionMode="single"
        onAction={(key) => setTheme(key as Theme)}
        variant="flat"
      >
        <DropdownItem
          key="light"
          startContent={<Sun className="w-4 h-4 text-amber-500" />}
        >
          Light Mode
        </DropdownItem>
        <DropdownItem
          key="dark"
          startContent={<Moon className="w-4 h-4 text-indigo-400" />}
        >
          Dark Mode
        </DropdownItem>
        <DropdownItem
          key="system"
          startContent={<Monitor className="w-4 h-4 text-slate-400" />}
        >
          System Default
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
