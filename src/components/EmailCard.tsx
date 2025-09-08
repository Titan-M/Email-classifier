'use client';

import { useState } from 'react';
import { Email } from '@/types/email';
import { cn } from '@/lib/utils';
import { Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface EmailCardProps {
  email: Email;
  onDelete: (emailId: string) => void;
}

const priorityColors = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
};

const categoryColors = {
  Work: 'bg-blue-100 text-blue-800',
  Personal: 'bg-green-100 text-green-800',
  Finance: 'bg-yellow-100 text-yellow-800',
  Travel: 'bg-purple-100 text-purple-800',
  Shopping: 'bg-pink-100 text-pink-800',
  Promotions: 'bg-orange-100 text-orange-800',
  Spam: 'bg-red-100 text-red-800',
  Other: 'bg-gray-100 text-gray-800',
};

export function EmailCard({ email, onDelete }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    if (confirm('Are you sure you want to delete this email?')) {
      setIsDeleting(true);
      try {
        await onDelete(email.id);
      } catch (error) {
        console.error('Error deleting email:', error);
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={cn(
      'group bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-5 hover:bg-white/80 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 transform hover:-translate-y-0.5',
      isDeleting && 'opacity-50 scale-95'
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2 sm:mb-3">
            {email.priority && (
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-sm',
                priorityColors[email.priority]
              )}>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mr-1.5',
                  email.priority === 'High' ? 'bg-red-500' :
                  email.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                )} />
                {email.priority}
              </span>
            )}
            {email.category && (
              <span className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm',
                categoryColors[email.category]
              )}>
                {email.category}
              </span>
            )}
          </div>
          
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 group-hover:text-gray-800 transition-colors">
            {email.subject}
          </h3>
          
          <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-700">
                {email.sender.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="truncate text-xs sm:text-sm">{email.sender}</span>
          </div>
          
          <div className="flex items-center text-[10px] sm:text-xs text-gray-500">
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-gray-400" />
            {formatDate(email.received_at)}
          </div>
        </div>

        <div className="flex items-center justify-end sm:justify-start space-x-1 sm:ml-4 mt-2 sm:mt-0 opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 active:bg-gray-200"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 active:bg-red-100 disabled:opacity-50"
              title="Delete email"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-200/50">
          {email.summary && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">AI</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">Smart Summary</h4>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-xl">
                <p className="text-base text-gray-800 leading-relaxed">
                  {email.summary}
                </p>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-1 h-4 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full mr-2"></div>
              Email Content
            </h4>
            <div className="bg-gray-50/80 border border-gray-200 p-4 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {email.body.length > 500 ? email.body.substring(0, 500) + '...' : email.body}
              </p>
              {email.body.length > 500 && (
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Read more
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
