import React, { useMemo, useState } from 'react';
import { Variable } from '../types';
import { X, ZoomIn } from 'lucide-react';

interface RichStepRendererProps {
  content: string;
  variables: Variable[];
}

export const RichStepRenderer: React.FC<RichStepRendererProps> = ({ content, variables }) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Helper to strictly force strings
  const strictString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    return '';
  };

  // Auto-linkify URLs in plain text
  const linkifyUrls = (text: string): string => {
    // URL regex pattern
    const urlPattern = /(?<!href=["'])(https?:\/\/[^\s<>"']+)/g;
    return text.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rich-link">${url}</a>`;
    });
  };

  // Process content and inject variables
  const processedContent = useMemo(() => {
    const safeContent = strictString(content);
    if (!safeContent) return '';

    // First, replace {{variables}} in the content
    let processed = safeContent.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const variable = variables.find(v => v.key === trimmedKey);
      if (variable) {
        const value = strictString(variable.value) || match;
        return `<span class="rich-variable">${value}</span>`;
      }
      return match;
    });

    // Then linkify any plain-text URLs (but not ones already in href attributes)
    processed = linkifyUrls(processed);

    return processed;
  }, [content, variables]);

  // Handle link clicks to open in new tab
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Handle link clicks
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
    
    // Handle image clicks for lightbox
    if (target.tagName === 'IMG') {
      const src = target.getAttribute('src');
      if (src) {
        setLightboxImage(src);
      }
    }
  };

  if (!processedContent) {
    return <p className="text-gray-400 italic">No description provided.</p>;
  }

  return (
    <>
      <div 
        className="rich-step-renderer prose prose-slate prose-lg text-gray-600 leading-relaxed max-w-none"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Full size preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Styles */}
      <style>{`
        .rich-step-renderer a,
        .rich-step-renderer .rich-link {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.15s;
        }
        
        .rich-step-renderer a:hover,
        .rich-step-renderer .rich-link:hover {
          color: #1d4ed8;
        }
        
        .rich-step-renderer .rich-variable {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #dbeafe;
          color: #1e40af;
          font-weight: 500;
          font-size: 0.9em;
          margin: 0 2px;
          border: 1px solid #bfdbfe;
        }
        
        .rich-step-renderer .rich-image-container {
          margin: 16px 0;
        }
        
        .rich-step-renderer img,
        .rich-step-renderer .rich-image {
          max-width: 100%;
          max-height: 400px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: zoom-in;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        
        .rich-step-renderer img:hover,
        .rich-step-renderer .rich-image:hover {
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .rich-step-renderer p {
          margin-bottom: 1em;
        }

        .rich-step-renderer br {
          display: block;
          content: "";
          margin-top: 0.5em;
        }
      `}</style>
    </>
  );
};

