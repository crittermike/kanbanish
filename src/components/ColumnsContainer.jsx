import { Plus } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import Column from './Column';

/**
 * Renders the board columns grid with an optional "Add Column" button.
 * Columns are sorted by their ID prefix (a_, b_, c_) for consistent ordering.
 *
 * @param {Object} props
 * @param {Object} props.columns - Column data keyed by column ID
 * @param {boolean} props.sortByVotes - Whether cards within columns are sorted by votes
 * @param {Function} props.addNewColumn - Callback to add a new column
 */
const ColumnsContainer = ({ columns, sortByVotes, addNewColumn }) => {
  const { retrospectiveMode, workflowPhase } = useBoardContext();

  // Get columns sorted by their IDs to maintain consistent order
  const getSortedColumns = () => {
    // The column IDs are prefixed with alphabet characters (a_, b_, etc.)
    // to ensure they maintain their original order regardless of title changes
    return Object.entries(columns || {}).sort((a, b) => {
      return a[0].localeCompare(b[0]); // Sort by column ID
    });
  };

  // Hide add column button during reveal phases when board structure should be stable
  const shouldShowAddColumn = !retrospectiveMode || workflowPhase === WORKFLOW_PHASES.CREATION;

  return (
    <div className="board-container">
      <div id="board" className="board">
        {/* Render columns in sorted order */}
        {getSortedColumns().map(([columnId, columnData]) => (
          <Column
            key={columnId}
            columnId={columnId}
            columnData={columnData}
            sortByVotes={sortByVotes}
          />
        ))}

        {/* Add column button - hidden during interaction/results phases */}
        {shouldShowAddColumn && (
          <div className="add-column-container">
            <button id="add-column" className="add-column" onClick={addNewColumn}>
              <Plus size={16} />
              Add Column
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColumnsContainer;
