import { describe, test, expect } from 'vitest';
import { linkifyText } from './helpers';

describe('linkifyText', () => {
  test('returns non-string input unchanged', () => {
    expect(linkifyText(null)).toBe(null);
    expect(linkifyText(undefined)).toBe(undefined);
    expect(linkifyText(123)).toBe(123);
    expect(linkifyText('')).toBe('');
  });

  test('returns text without URLs unchanged', () => {
    const text = 'This is just plain text without any links';
    const result = linkifyText(text);
    expect(result).toBe(text);
  });

  test('converts HTTP URLs to links', () => {
    const text = 'Check out http://example.com for more info';
    const result = linkifyText(text);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check out ');
    
    // Check that the middle element is a React element (link)
    const linkElement = result[1];
    expect(linkElement.type).toBe('a');
    expect(linkElement.props.href).toBe('http://example.com');
    expect(linkElement.props.target).toBe('_blank');
    expect(linkElement.props.rel).toBe('noopener noreferrer');
    expect(linkElement.props.className).toBe('auto-link');
    expect(linkElement.props.children).toBe('http://example.com');
    
    expect(result[2]).toBe(' for more info');
  });

  test('converts HTTPS URLs to links', () => {
    const text = 'Visit https://secure-site.com';
    const result = linkifyText(text);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Visit ');
    
    const linkElement = result[1];
    expect(linkElement.type).toBe('a');
    expect(linkElement.props.href).toBe('https://secure-site.com');
  });

  test('converts multiple URLs in the same text', () => {
    const text = 'Check http://first.com and https://second.com';
    const result = linkifyText(text);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('Check ');
    expect(result[1].props.href).toBe('http://first.com');
    expect(result[2]).toBe(' and ');
    expect(result[3].props.href).toBe('https://second.com');
  });

  test('handles URLs with query parameters and fragments', () => {
    const text = 'Go to https://example.com/path?param=value&other=123#section';
    const result = linkifyText(text);
    
    expect(Array.isArray(result)).toBe(true);
    const linkElement = result[1];
    expect(linkElement.props.href).toBe('https://example.com/path?param=value&other=123#section');
  });

  test('handles URLs with www prefix', () => {
    const text = 'Visit https://www.example.com';
    const result = linkifyText(text);
    
    const linkElement = result[1];
    expect(linkElement.props.href).toBe('https://www.example.com');
  });

  test('does not linkify non-HTTP protocols', () => {
    const text = 'Email me at mailto:test@example.com or ftp://files.com';
    const result = linkifyText(text);
    
    // Should return original text since these protocols aren't supported
    expect(result).toBe(text);
  });

  test('handles URLs at the beginning and end of text', () => {
    const text = 'https://start.com some text http://end.com';
    const result = linkifyText(text);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].props.href).toBe('https://start.com');
    expect(result[2].props.href).toBe('http://end.com');
  });
});