import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import MarkdownContent from './MarkdownContent';

describe('MarkdownContent', () => {
  test('renders plain text', () => {
    render(<MarkdownContent content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('renders bold text', () => {
    render(<MarkdownContent content="This is **bold** text" />);
    const bold = screen.getByText('bold');
    expect(bold.tagName).toBe('STRONG');
  });

  test('renders italic text', () => {
    render(<MarkdownContent content="This is *italic* text" />);
    const italic = screen.getByText('italic');
    expect(italic.tagName).toBe('EM');
  });

  test('renders inline code', () => {
    render(<MarkdownContent content="Use `console.log()` for debugging" />);
    const code = screen.getByText('console.log()');
    expect(code.tagName).toBe('CODE');
  });

  test('renders code blocks', () => {
    render(<MarkdownContent content={'```\nconst x = 1;\n```'} />);
    const codeBlock = screen.getByText('const x = 1;');
    expect(codeBlock.tagName).toBe('CODE');
    expect(codeBlock.closest('pre')).toBeInTheDocument();
  });

  test('renders links with correct attributes', () => {
    render(<MarkdownContent content="Visit [Example](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'Example' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass('auto-link');
  });

  test('renders bare URLs as links', () => {
    render(<MarkdownContent content="Check https://example.com for info" />);
    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveClass('auto-link');
  });

  test('renders unordered lists', () => {
    render(<MarkdownContent content={'- Item 1\n- Item 2\n- Item 3'} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  test('renders ordered lists', () => {
    render(<MarkdownContent content={'1. First\n2. Second\n3. Third'} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  test('renders blockquotes', () => {
    render(<MarkdownContent content="> This is a quote" />);
    const blockquote = screen.getByText('This is a quote').closest('blockquote');
    expect(blockquote).toBeInTheDocument();
  });

  test('renders strikethrough', () => {
    render(<MarkdownContent content="This is ~~deleted~~ text" />);
    const del = screen.getByText('deleted');
    expect(del.tagName).toBe('DEL');
  });

  test('renders headings', () => {
    render(<MarkdownContent content="# Heading 1" />);
    const heading = screen.getByText('Heading 1');
    expect(heading.tagName).toBe('H1');
  });

  test('voids img tags for security', () => {
    const { container } = render(<MarkdownContent content="![alt](https://evil.com/xss.png)" />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  test('returns null for empty content', () => {
    const { container } = render(<MarkdownContent content="" />);
    expect(container.querySelector('.markdown-content')).not.toBeInTheDocument();
  });

  test('returns null for null content', () => {
    const { container } = render(<MarkdownContent content={null} />);
    expect(container.querySelector('.markdown-content')).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(<MarkdownContent content="Test" className="custom-class" />);
    expect(container.querySelector('.markdown-content.custom-class')).toBeInTheDocument();
  });

  test('renders markdown-content wrapper class', () => {
    const { container } = render(<MarkdownContent content="Test" />);
    expect(container.querySelector('.markdown-content')).toBeInTheDocument();
  });

  test('renders mixed markdown content', () => {
    const content = '**Bold** and *italic* with `code` and a [link](https://example.com)';
    render(<MarkdownContent content={content} />);

    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
    expect(screen.getByText('code').tagName).toBe('CODE');
    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute('href', 'https://example.com');
  });
});
