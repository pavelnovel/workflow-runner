import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { Link, Image, Bold, Italic, Underline, List, X, ExternalLink } from 'lucide-react';

interface RichStepEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onVariableDrop?: (variableKey: string) => void;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

export const RichStepEditor: React.FC<RichStepEditorProps> = ({
  value,
  onChange,
  placeholder = 'Step instructions... use {{variableKey}} to insert dynamic data.'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>(value);
  const isInternalChange = useRef(false);

  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  // Initialize content on mount and when value changes from parent (not from our own edits)
  useLayoutEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      // Only update if the value actually changed from external source
      if (value !== lastValueRef.current) {
        editorRef.current.innerHTML = value;
        lastValueRef.current = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Handle input changes - mark as internal change to prevent re-render
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      lastValueRef.current = newValue;
      isInternalChange.current = true;
      onChange(newValue);
    }
  }, [onChange]);

  // Save selection for later restoration
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  // Restore selection
  const restoreSelection = useCallback(() => {
    if (savedSelection && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  }, [savedSelection]);

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += text;
    }

    handleInput();
  }, [handleInput]);

  // Check for text selection and show/hide toolbar
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !editorRef.current) {
      setShowFloatingToolbar(false);
      return;
    }

    // Check if selection is within our editor
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setShowFloatingToolbar(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setShowFloatingToolbar(false);
      return;
    }

    // Calculate toolbar position
    const rect = range.getBoundingClientRect();

    // Position toolbar above the selection, centered
    const toolbarWidth = 200;
    let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);

    // Keep toolbar within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - toolbarWidth - 10));

    setToolbarPosition({
      top: rect.top - 45,
      left: left
    });

    setShowFloatingToolbar(true);
    saveSelection();
  }, [saveSelection]);

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Hide toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowFloatingToolbar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Formatting commands
  const execCommand = useCallback((command: string, commandValue?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    handleInput();

    // Keep selection for potential additional formatting
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        saveSelection();
      }
    }, 0);
  }, [restoreSelection, handleInput, saveSelection]);

  const toggleBold = useCallback(() => execCommand('bold'), [execCommand]);
  const toggleItalic = useCallback(() => execCommand('italic'), [execCommand]);
  const toggleUnderline = useCallback(() => execCommand('underline'), [execCommand]);

  const toggleBulletList = useCallback(() => {
    execCommand('insertUnorderedList');
    setShowFloatingToolbar(false);
  }, [execCommand]);

  // Open link modal
  const openLinkModal = useCallback(() => {
    saveSelection();
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setLinkText(selection.toString().trim());
    }
    setShowFloatingToolbar(false);
    setShowLinkModal(true);
  }, [saveSelection]);

  // Insert link at cursor/selection
  const handleInsertLink = useCallback(() => {
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
  }, [linkUrl, linkText, restoreSelection, handleInput]);

  // Handle image file
  const processImageFile = useCallback((file: File) => {
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
  }, [handleInput]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
    e.target.value = '';
  }, [processImageFile]);

  // Drag and drop handlers for images and variables
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

    // Check for variable drop
    const variableKey = e.dataTransfer.getData('text/variable-key');
    if (variableKey) {
      insertAtCursor(`{{${variableKey}}}`);
      return;
    }

    // Check for image files
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          processImageFile(files[i]);
        }
      }
    }
  }, [insertAtCursor, processImageFile]);

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
  }, [processImageFile]);

  // Check if content is empty for placeholder
  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div className="rich-step-editor relative">
      {/* Floating Toolbar */}
      {showFloatingToolbar && (
        <div
          ref={toolbarRef}
          className="fixed z-50 bg-gray-900 rounded-lg shadow-xl px-1 py-1 flex items-center gap-0.5 animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); toggleBold(); }}
            className="p-2 hover:bg-gray-700 rounded text-white transition-colors"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); toggleItalic(); }}
            className="p-2 hover:bg-gray-700 rounded text-white transition-colors"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); toggleUnderline(); }}
            className="p-2 hover:bg-gray-700 rounded text-white transition-colors"
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); toggleBulletList(); }}
            className="p-2 hover:bg-gray-700 rounded text-white transition-colors"
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); openLinkModal(); }}
            className="p-2 hover:bg-gray-700 rounded text-white transition-colors"
            title="Insert Link"
          >
            <Link size={16} />
          </button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={`
          w-full border rounded-lg p-4 text-sm text-gray-700
          focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none
          min-h-[200px] overflow-auto
          ${isDragging ? 'border-brand-500 bg-brand-50 border-dashed border-2' : 'border-gray-200'}
          ${isEmpty ? 'empty-editor' : ''}
        `}
        onInput={handleInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      />

      {/* Bottom hint bar */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-gray-400">Select text to format. Drag variables or images here.</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-xs"
          title="Insert image"
        >
          <Image size={14} />
          <span>Add Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

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
        .rich-step-editor .empty-editor:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
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

        .rich-step-editor ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .rich-step-editor li {
          margin: 0.25em 0;
        }
      `}</style>
    </div>
  );
};
