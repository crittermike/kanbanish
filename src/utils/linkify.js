import React from 'react';

/**
 * Text-to-link conversion utilities.
 */

// URL regex for detecting HTTP/HTTPS URLs
const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&=/]*)/;

/**
 * Converts URLs in text to clickable links.
 * @param {string} text - The text that may contain URLs
 * @returns {React.ReactNode|React.ReactNode[]} Text with URLs converted to anchor elements
 */
export function linkifyText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Check if text contains any URLs
  if (!URL_REGEX.test(text)) {
    return text;
  }

  // Split using global capturing regex
  const globalRegex = new RegExp(`(${URL_REGEX.source})`, 'g');
  const parts = text.split(globalRegex);
  
  // Filter out empty strings that can occur from split
  const filteredParts = parts.filter(part => part !== '');
  
  return filteredParts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      return React.createElement('a', {
        key: index,
        href: part,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'auto-link'
      }, part);
    }
    return part;
  });
}
