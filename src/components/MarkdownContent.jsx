import Markdown from 'markdown-to-jsx';
import { memo, useMemo } from 'react';

/**
 * Custom link component that opens in new tab with security attrs.
 * Preserves the `auto-link` class for styling consistency.
 */
const MarkdownLink = ({ children, ...props }) => (
  <a
    {...props}
    target="_blank"
    rel="noopener noreferrer"
    className="auto-link"
  >
    {children}
  </a>
);

/**
 * Markdown rendering options for card/comment content.
 * - Links open in new tab with noopener/noreferrer
 * - Images are disabled (security + card compactness)
 * - iframes/scripts/etc. are voided
 * - Wrapper is a fragment to avoid extra DOM nesting
 */
const markdownOptions = {
  wrapper: 'span',
  forceWrapper: true,
  overrides: {
    a: { component: MarkdownLink },
    // Void potentially dangerous elements
    img: () => null,
    iframe: () => null,
    script: () => null,
    style: () => null,
    // Keep headings but downsize them for card context
    h1: { props: { className: 'md-heading' } },
    h2: { props: { className: 'md-heading' } },
    h3: { props: { className: 'md-heading' } },
    h4: { props: { className: 'md-heading' } },
    h5: { props: { className: 'md-heading' } },
    h6: { props: { className: 'md-heading' } },
  },
};

/**
 * Renders Markdown content as React components.
 * Supports: **bold**, *italic*, `code`, ```code blocks```, [links], - lists,
 * > blockquotes, ~~strikethrough~~
 *
 * Uses markdown-to-jsx for component-based rendering (no dangerouslySetInnerHTML).
 */
const MarkdownContent = ({ content, className = '' }) => {
  // Memoize the content to avoid re-parsing on every render
  const normalizedContent = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return '';
    }
    return content;
  }, [content]);

  if (!normalizedContent) {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <Markdown options={markdownOptions}>
        {normalizedContent}
      </Markdown>
    </div>
  );
};

export default memo(MarkdownContent);
