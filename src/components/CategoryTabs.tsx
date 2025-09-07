'use client';

import { cn } from '@/lib/utils';
import { EmailCategory } from '@/types/email';

interface CategoryTabsProps {
  categories: (EmailCategory | 'All')[];
  selectedCategory: EmailCategory | 'All';
  onCategoryChange: (category: EmailCategory | 'All') => void;
  counts: Record<string, number>;
}

export function CategoryTabs({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  counts 
}: CategoryTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="px-6">
        {/* Desktop Tabs */}
        <nav className="hidden md:flex space-x-8" aria-label="Categories">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            const count = counts[category] || 0;

            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isSelected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <span className="flex items-center space-x-2">
                  <span>{category}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        isSelected
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden py-4">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as EmailCategory | 'All')}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => {
              const count = counts[category] || 0;
              return (
                <option key={category} value={category}>
                  {category} {count > 0 && `(${count})`}
                </option>
              );
            })}
          </select>
        </div>
      </div>
  );
} 