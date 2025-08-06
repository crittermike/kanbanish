/**
 * Reusable base component for vote counters
 * Provides consistent styling and structure for different vote counter types
 */
const BaseVoteCounter = ({ 
  className, 
  label, 
  value, 
  total, 
  isDepleted = false,
  testId
}) => {
  const displayValue = total !== undefined ? `${value}/${total}` : value;
  const depletedClass = isDepleted ? `${className}-depleted` : '';

  return (
    <div className={className} data-testid={testId}>
      <div className={`${className}-content`}>
        <span className={`${className}-label`}>{label}</span>
        <span className={`${className}-value ${depletedClass}`}>
          {displayValue}
        </span>
      </div>
    </div>
  );
};

export default BaseVoteCounter;
