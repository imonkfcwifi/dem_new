
import React from 'react';
import { audio } from '../services/audioService';

interface RichTextProps {
  content: string;
  keywords: string[]; // List of names to highlight (e.g., Faction names)
  onLinkClick: (keyword: string) => void;
  className?: string;
}

const RichText: React.FC<RichTextProps> = ({ content, keywords, onLinkClick, className = "" }) => {
  if (!content || !keywords.length) return <span className={className}>{content}</span>;

  // Escape special regex characters in keywords
  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Create a regex to match any of the keywords
  // Use boundary checks if possible, but names might contain spaces so word boundary \b works but might need care for non-latin. 
  // For Korean/English mix, simple replacement is safer but greedy.
  // Sort keywords by length desc in parent to avoid partial matches (e.g. "Gold" matching inside "Golden Guard")
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'g');

  const parts = content.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (keywords.includes(part)) {
          return (
            <span
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                audio.playClick();
                onLinkClick(part);
              }}
              onMouseEnter={() => audio.playHover()}
              className="text-god-gold underline underline-offset-4 decoration-god-gold/40 hover:decoration-god-gold hover:bg-god-gold/10 cursor-pointer transition-all font-semibold rounded-sm px-0.5"
              title="상세 정보 보기"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default RichText;
