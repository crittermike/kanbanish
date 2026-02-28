import { useRef, useMemo } from 'react';
import { User, Calendar, Trash2, Check, Circle } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ActionItemsPanel = ({ isOpen, onClose }) => {
  const {
    actionItems,
    updateActionItemStatus,
    updateActionItemAssignee,
    updateActionItemDueDate,
    deleteActionItem
  } = useBoardContext();
  
  const { showNotification } = useNotification();
  const modalRef = useRef(null);

  useFocusTrap(modalRef, isOpen, { onClose });

  const sortedItems = useMemo(() => {
    const items = Object.entries(actionItems || {}).map(([id, data]) => ({
      id,
      ...data
    }));

    const openItems = items.filter(i => i.status === 'open').sort((a, b) => b.created - a.created);
    const doneItems = items.filter(i => i.status === 'done').sort((a, b) => b.created - a.created);

    return { openItems, doneItems, allItems: [...openItems, ...doneItems] };
  }, [actionItems]);

  if (!isOpen) return null;

  const handleToggleStatus = (item) => {
    const newStatus = item.status === 'open' ? 'done' : 'open';
    updateActionItemStatus(item.id, newStatus);
    showNotification(`Marked as ${newStatus}`);
  };

  const handleAssigneeChange = (id, newAssignee) => {
    updateActionItemAssignee(id, newAssignee);
  };

  const handleDueDateChange = (id, newDueDate) => {
    updateActionItemDueDate(id, newDueDate);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this action item?')) {
      deleteActionItem(id);
      showNotification('Action item deleted');
    }
  };

  const { openItems, doneItems, allItems } = sortedItems;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container action-items-modal" 
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-items-title"
      >
        <div className="modal-header">
          <h2 id="action-items-title">Action Items</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close action items">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {allItems.length === 0 ? (
            <div className="action-item-empty">
              No action items yet. Convert cards to action items using the ✅ button on any card.
            </div>
          ) : (
            <div className="action-items-list">
              {allItems.map(item => (
                <div key={item.id} className="action-item-row">
                  <button 
                    className={`action-item-status-btn ${item.status === 'done' ? 'done' : ''}`}
                    onClick={() => handleToggleStatus(item)}
                    title={`Mark as ${item.status === 'open' ? 'done' : 'open'}`}
                  >
                    {item.status === 'done' ? <Check size={18} /> : <Circle size={18} />}
                  </button>

                  <div className={`action-item-content ${item.status === 'done' ? 'done' : ''}`}>
                    {item.description}
                  </div>

                  <div className="action-item-assignee">
                    <User size={14} />
                    <input 
                      type="text"
                      placeholder="Assign to..."
                      value={item.assignee || ''}
                      onChange={(e) => handleAssigneeChange(item.id, e.target.value)}
                      aria-label="Assignee"
                    />
                  </div>

                  <div className="action-item-due-date">
                    <Calendar size={14} />
                    <input 
                      type="date"
                      value={item.dueDate || ''}
                      onChange={(e) => handleDueDateChange(item.id, e.target.value)}
                      aria-label="Due date"
                    />
                  </div>

                  <button 
                    className="action-item-delete-btn"
                    onClick={() => handleDelete(item.id)}
                    title="Delete action item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="action-items-summary">
            {openItems.length} open, {doneItems.length} done
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionItemsPanel;
