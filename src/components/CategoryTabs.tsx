'use client';

import { cn } from '@/lib/utils';
import { EmailCategory } from '@/types/email';
import { 
  Briefcase, 
  Heart, 
  CreditCard, 
  Plane, 
  ShoppingBag, 
  Megaphone, 
  Shield, 
  Folder,
  Mail
} from 'lucide-react';

interface CategoryTabsProps {
  categories: (EmailCategory | 'All')[];
  selectedCategory: EmailCategory | 'All';
  onCategoryChange: (category: EmailCategory | 'All') => void;
  counts: Record<string, number>;
}

const categoryConfig = {
  All: { 
    icon: Mail, 
    color: 'from-gray-500 to-gray-600',
    bgColor: 'from-gray-50 to-gray-100',
    selectedBg: 'from-gray-100 to-gray-200'
  },
  Work: { 
    icon: Briefcase, 
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100', 
    selectedBg: 'from-blue-100 to-blue-200'
  },
  Personal: { 
    icon: Heart, 
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'from-emerald-50 to-emerald-100',
    selectedBg: 'from-emerald-100 to-emerald-200'
  },
  Finance: { 
    icon: CreditCard, 
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'from-yellow-50 to-yellow-100',
    selectedBg: 'from-yellow-100 to-yellow-200'
  },
  Travel: { 
    icon: Plane, 
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
    selectedBg: 'from-purple-100 to-purple-200'
  },
  Shopping: { 
    icon: ShoppingBag, 
    color: 'from-pink-500 to-pink-600',
    bgColor: 'from-pink-50 to-pink-100',
    selectedBg: 'from-pink-100 to-pink-200'
  },
  Promotions: { 
    icon: Megaphone, 
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100',
    selectedBg: 'from-orange-100 to-orange-200'
  },
  Spam: { 
    icon: Shield, 
    color: 'from-red-500 to-red-600',
    bgColor: 'from-red-50 to-red-100',
    selectedBg: 'from-red-100 to-red-200'
  },
  Other: { 
    icon: Folder, 
    color: 'from-gray-500 to-gray-600',
    bgColor: 'from-gray-50 to-gray-100',
    selectedBg: 'from-gray-100 to-gray-200'
  },
};

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