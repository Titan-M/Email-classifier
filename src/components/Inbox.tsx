'use client';

import { useState, useEffect } from 'react';
import { Email, EmailCategory } from '@/types/email';
import { EmailList } from './EmailList';
import { CategoryTabs } from './CategoryTabs';
import { LoadingSpinner } from './LoadingSpinner';
import { Pagination } from './Pagination';

const CATEGORIES: EmailCategory[] = [
  'Work',
  'Personal', 
  'Finance',
  'Travel',
  'Shopping',
  'Promotions',
  'Spam',
  'Other'
];

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory | 'All'>('All');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchEmails = async (category?: EmailCategory, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (category) {
        params.append('category', category);
      }
      
      const url = `/api/emails?${params.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch emails');
        setEmails([]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      // Fetch counts for each category
      const promises = CATEGORIES.map(async (category) => {
        const response = await fetch(`/api/emails?category=${encodeURIComponent(category)}&limit=1`);
        if (response.ok) {
          const data = await response.json();
          return { category, count: data.pagination.total };
        }
        return { category, count: 0 };
      });

      // Also fetch total count
      const totalResponse = await fetch('/api/emails?limit=1');
      let totalCount = 0;
      if (totalResponse.ok) {
        const data = await totalResponse.json();
        totalCount = data.pagination.total;
      }

      const counts = await Promise.all(promises);
      const countMap = counts.reduce((acc, { category, count }) => {
        acc[category] = count;
        return acc;
      }, { All: totalCount } as Record<string, number>);
      
      setCategoryCounts(countMap);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
  };

  useEffect(() => {
    fetchCategoryCounts();
    setCurrentPage(1); // Reset to first page when category changes
    fetchEmails(selectedCategory === 'All' ? undefined : selectedCategory, 1);
  }, [selectedCategory]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchEmails(selectedCategory === 'All' ? undefined : selectedCategory, currentPage);
    }
  }, [currentPage]);

  const handleCategoryChange = (category: EmailCategory | 'All') => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleEmailDelete = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails?id=${emailId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEmails(emails.filter(email => email.id !== emailId));
        // Refresh counts
        fetchCategoryCounts();
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <CategoryTabs
        categories={['All', ...CATEGORIES]}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        counts={categoryCounts}
      />
      
      <div className="p-6">
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
            <p className="text-gray-500">
              {selectedCategory === 'All' 
                ? 'Click "Sync Emails" to fetch and classify your recent emails.'
                : `No emails found in the ${selectedCategory} category.`
              }
            </p>
          </div>
        ) : (
          <>
            <EmailList 
              emails={emails} 
              onDelete={handleEmailDelete}
            />
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.pages}
                onPageChange={setCurrentPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
