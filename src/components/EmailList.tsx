'use client';

import { Email } from '@/types/email';
import { EmailCard } from './EmailCard';

interface EmailListProps {
  emails: Email[];
  onDelete: (emailId: string) => void;
}

export function EmailList({ emails, onDelete }: EmailListProps) {
  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <EmailCard
          key={email.id}
          email={email}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
