'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { HelpCircle } from 'lucide-react';

export interface HelperTooltipProps {
  text: string;
  term?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

export function HelperTooltip({
  text,
  term,
  position = 'top',
  children,
  className = ''
}: HelperTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position];

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <span
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-label={term ? `Learn more about ${term}` : 'Help information'}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          } else if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex items-center cursor-pointer text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded-sm"
      >
        {children || <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700 transition" />}
      </span>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 ${positionClasses} w-64 max-w-xs p-3 text-xs leading-relaxed rounded-xl bg-gray-900 text-gray-100 shadow-xl border border-gray-700 pointer-events-auto transition-opacity duration-150 animate-in fade-in-0 zoom-in-95`}
        >
          {term && (
            <div className="font-bold text-violet-300 mb-1 border-b border-gray-800 pb-1">
              {term}
            </div>
          )}
          <div className="text-gray-200">{text}</div>
          <div className="mt-1.5 text-[10px] text-gray-400 flex items-center justify-between">
            <span>Press Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelperTooltip;
