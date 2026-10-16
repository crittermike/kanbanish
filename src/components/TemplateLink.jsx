import { getTemplateUrl } from '../utils/templateUtils';

/**
 * Link to `?template=<id>` so it can be bookmarked or opened in a new tab.
 * A plain click creates the board in place via onSelect.
 */
function TemplateLink({ template, onSelect, disabled = false, className, children, ...rest }) {
  const handleClick = e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    if (!disabled) {
      onSelect(template);
    }
  };

  return (
    <a
      href={getTemplateUrl(template.id)}
      className={className}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {children}
    </a>
  );
}

export default TemplateLink;
