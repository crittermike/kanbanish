const DEFAULT_GROUP_NAME_LENGTH = 40;

// First line of the card's text, stripped of markdown markers and truncated
export const getDefaultGroupName = content => {
  const firstLine = (content || '')
    .split('\n')
    .map(line => line.replace(/^[\s#>*\-+]+|\[[ x]\]\s*/gi, '').replace(/[*_`~]/g, '').trim())
    .find(Boolean);
  if (!firstLine) {
    return 'New Group';
  }
  return firstLine.length > DEFAULT_GROUP_NAME_LENGTH
    ? `${firstLine.slice(0, DEFAULT_GROUP_NAME_LENGTH - 1).trimEnd()}…`
    : firstLine;
};
