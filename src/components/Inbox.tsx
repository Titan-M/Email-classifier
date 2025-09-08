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
  const [cache, setCache] = useState<Record<string, { data: any; timestamp: number }>>({});
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchWithCache = async (url: string, cacheKey: string) => {
    const now = Date.now();
    // Check if we have a cached version that's still valid
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }

    // If not in cache or cache expired, fetch fresh data
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const data = await response.json();
    
    // Update cache
    setCache(prev => ({
      ...prev,
      [cacheKey]: { data, timestamp: now }
    }));
    
    return data;
  };

  const fetchEmails = async (category?: EmailCategory, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        _t: Date.now().toString() // Cache buster for development
      });
      
      if (category) {
        params.append('category', category);
      }
      
      const cacheKey = `emails-${category || 'all'}-${page}`;
      const data = await fetchWithCache(`/api/emails?${params.toString()}`, cacheKey);
      
      setEmails(data.emails);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching emails:', error);
      // If fetch fails, try to use cached data if available
      const cacheKey = `emails-${category || 'all'}-${page}`;
      if (cache[cacheKey]) {
        setEmails(cache[cacheKey].data.emails);
        setPagination(cache[cacheKey].data.pagination);
      } else {
        setEmails([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      // Fetch all counts in parallel
      const [totalResponse, ...categoryResponses] = await Promise.all([
        fetchWithCache('/api/emails?limit=1', 'email-count-all'),
        ...CATEGORIES.map(category => 
          fetchWithCache(`/api/emails?category=${encodeURIComponent(category)}&limit=1`, `email-count-${category}`)
        )
      ]);

      // Process total count
      const totalCount = totalResponse?.pagination?.total || 0;
      
      // Process category counts
      const countMap = CATEGORIES.reduce((acc, category, index) => {
        acc[category] = categoryResponses[index]?.pagination?.total || 0;
        return acc;
      }, { All: totalCount } as Record<string, number>);
      
      setCategoryCounts(countMap);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
  };

  // Initial load and when category changes
  useEffect(() => {
    setCurrentPage(1);
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCategoryCounts(),
          fetchEmails(selectedCategory === 'All' ? undefined : selectedCategory, 1)
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [selectedCategory]);

  // Handle pagination changes
  useEffect(() => {
    const fetchPage = async () => {
      if (currentPage > 0) { // Changed from > 1 to > 0 to always fetch on mount
        await fetchEmails(selectedCategory === 'All' ? undefined : selectedCategory, currentPage);
      }
    };
    
    fetchPage();
  }, [currentPage, selectedCategory]);

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
