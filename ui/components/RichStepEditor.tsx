import React, { useRef, useState, useCallback } from 'react';
import { Link, Image, X, ExternalLink } from 'lucide-react';

interface RichStepEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichStepEditor: React.FC<RichStepEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Step instructions... use {{variableKey}} to insert dynamic data.' 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  // Convert stored format to HTML for editing
  const parseContentToHtml = (content: string): string => {
    if (!content) return '';
    
    // Content is already HTML, return as-is
    return content;
  };

  // Save selection before opening modal
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  };

  // Restore selection
  const restoreSelection = () => {
    if (savedSelection && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  };

  // Handle input changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Insert link at cursor position
  const handleInsertLink = () => {
    if (!linkUrl) return;
    
    const displayText = linkText || linkUrl;
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="rich-link">${displayText}</a>`;
    
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = linkHtml;
        const linkNode = tempDiv.firstChild;
        if (linkNode) {
          range.insertNode(linkNode);
          range.setStartAfter(linkNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        editorRef.current.innerHTML += linkHtml;
      }
      
      handleInput();
    }
    
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Handle image file
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const imgHtml = `<div class="rich-image-container"><img src="${base64}" alt="Step image" class="rich-image" /></div>`;
      
      if (editorRef.current) {
        editorRef.current.focus();
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = imgHtml;
          const imgNode = tempDiv.firstChild;
          if (imgNode) {
            range.insertNode(imgNode);
            range.setStartAfter(imgNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else {
          editorRef.current.innerHTML += imgHtml;
        }
        
        handleInput();
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          processImageFile(files[i]);
        }
      }
    }
  }, []);

  // Handle paste for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
        return;
      }
    }
  }, []);

  // Open link modal
  const openLinkModal = () => {
    saveSelection();
    
    // Check if there's selected text
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setLinkText(selection.toString().trim());
    }
    
    setShowLinkModal(true);
  };

  return (
    <div className="rich-step-editor">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 border border-gray-200 rounded-t-lg">
        <button
          type="button"
          onClick={openLinkModal}
          className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors flex items-center gap-1 text-sm"
          title="Insert link"
        >
          <Link size={16} />
          <span className="hidden sm:inline">Link</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors flex items-center gap-1 text-sm"
          title="Insert image"
        >
          <Image size={16} />
          <span className="hidden sm:inline">Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex-1" />
        <span className="text-xs text-gray-400">Drag & drop images or paste from clipboard</span>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={`
          w-full border rounded-b-lg p-3 text-sm text-gray-700 
          focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none 
          min-h-[120px] overflow-auto
          ${isDragging ? 'border-brand-500 bg-brand-50 border-dashed border-2' : 'border-gray-200'}
        `}
        onInput={handleInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: parseContentToHtml(value) }}
        data-placeholder={placeholder}
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ExternalLink size={18} className="text-brand-600" />
                Insert Link
              </h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Text <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                disabled={!linkUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .rich-step-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .rich-step-editor .rich-link {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .rich-step-editor .rich-link:hover {
          color: #1d4ed8;
        }
        
        .rich-step-editor .rich-image-container {
          margin: 12px 0;
        }
        
        .rich-step-editor .rich-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};

