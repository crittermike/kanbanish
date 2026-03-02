import { WORKFLOW_PHASES } from '../utils/workflowUtils';

/**
 * Board template definitions for the template selection modal.
 * Each template defines the column structure for a new board.
 *
 * @typedef {Object} BoardTemplate
 * @property {string} id - Unique template identifier
 * @property {string} name - Display name
 * @property {string} description - Short description of the template's purpose
 * @property {(string|{title: string, defaultTimerSeconds?: number})[]} columns - Column definitions (strings or objects with optional timer defaults)
 * @property {string} icon - Emoji icon for display
 * @property {string[]} tags - Searchable tags
 * @property {boolean} [skipWizard] - If true, skip the setup wizard and use defaultSettings
 * @property {Object} [defaultSettings] - Settings to apply when skipWizard is true
 */

/** @type {BoardTemplate[]} */
const BOARD_TEMPLATES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Simple task tracking for any project',
    columns: ['To Do', 'In Progress', 'Done'],
    icon: '📋',
    tags: ['workflow', 'kanban', 'basic']
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own board structure from scratch',
    columns: ['Untitled'],
    icon: '✏️',
    tags: ['custom', 'blank', 'flexible']
  },
  {
    id: 'lean-coffee',
    name: 'Lean Coffee',
    description: 'Democratically driven meeting agenda format',
    columns: ['Topics', 'Discussing', 'Done'],
    icon: '☕',
    tags: ['discussion', 'meeting', 'agenda']
  },
  {
    id: 'retro',
    name: 'Retrospective',
    description: 'Reflect on past work and plan improvements',
    columns: ['Went Well', 'Could Improve', 'Action Items'],
    icon: '🔄',
    tags: ['agile', 'reflection', 'team']
  },
  {
    id: 'feelings-improvements',
    name: 'Feelings / Improvements',
    description: 'Focus on emotional impact and concrete solutions',
    columns: ['Feelings', 'Improvements'],
    icon: '❤️',
    tags: ['feedback', 'emotions', 'solutions']
  },
  {
    id: 'daki',
    name: 'DAKI',
    description: 'Evaluate current processes and identify changes',
    columns: ['Drop', 'Add', 'Keep', 'Improve'],
    icon: '✨',
    tags: ['reflection', 'processes', 'practices']
  },
  {
    id: 'glad-sad-mad',
    name: 'Glad Sad Mad',
    description: 'Categorize feedback by emotional response',
    columns: ['Glad', 'Sad', 'Mad'],
    icon: '😊',
    tags: ['emotions', 'reflection', 'feedback']
  },
  {
    id: 'start-stop-continue',
    name: 'Start Stop Continue',
    description: 'Focus on actionable changes to team behavior',
    columns: ['Start', 'Stop', 'Continue'],
    icon: '🚦',
    tags: ['action', 'feedback', 'improvement']
  },
  {
    id: '4ls',
    name: '4 Ls',
    description: 'Comprehensive retrospective with learning focus',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed For'],
    icon: '📝',
    tags: ['reflection', 'learning', 'retrospective']
  },
  {
    id: 'swot',
    name: 'SWOT',
    description: 'Analyze internal and external factors for planning',
    columns: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
    icon: '📊',
    tags: ['strategy', 'planning', 'analysis']
  },
  {
    id: 'six-thinking-hats',
    name: 'Six Thinking Hats',
    description: 'Examine ideas from multiple mental perspectives',
    columns: ['Facts', 'Emotions', 'Critical', 'Optimistic', 'Creative', 'Process'],
    icon: '🎩',
    tags: ['thinking', 'perspectives', 'discussion']
  },
  {
    id: 'moscow',
    name: 'MoSCoW',
    description: 'Categorize features by implementation priority',
    columns: ['Must Have', 'Should Have', 'Could Have', 'Won\'t Have'],
    icon: '📌',
    tags: ['prioritization', 'planning', 'requirements']
  },
  {
    id: 'five-whys',
    name: 'Five Whys',
    description: 'Iteratively identify the underlying causes of issues',
    columns: ['Problem', 'Why 1', 'Why 2', 'Why 3', 'Why 4', 'Why 5', 'Root Cause'],
    icon: '🔍',
    tags: ['problem solving', 'analysis', 'causes']
  },
  {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    description: 'Prioritize tasks based on urgency and importance',
    columns: ['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Neither'],
    icon: '⏱️',
    tags: ['decision', 'prioritization', 'time management']
  },
  {
    id: 'sailboat',
    name: 'Sailboat Retrospective',
    description: 'Visualize team progress with nautical metaphors',
    columns: ['Wind (Helps)', 'Anchors (Hinders)', 'Rocks (Risks)', 'Island (Goals)'],
    icon: '⛵',
    tags: ['retrospective', 'visual', 'team']
  },
  {
    id: 'fishbone',
    name: 'Fishbone',
    description: 'Identify causes across different categories',
    columns: ['People', 'Process', 'Equipment', 'Materials', 'Environment', 'Management'],
    icon: '🐟',
    tags: ['analysis', 'causes', 'problem solving']
  },
  {
    id: 'feedback-grid',
    name: 'Feedback Grid',
    description: 'Balanced approach to feedback with action items',
    columns: ['What Went Well', 'What Could Be Improved', 'Questions', 'Ideas'],
    icon: '🔄',
    tags: ['feedback', 'collection', 'reflection']
  },
  {
    id: 'starfish',
    name: 'Starfish Retrospective',
    description: 'Detailed action-oriented team improvement model',
    columns: ['Keep Doing', 'Less Of', 'More Of', 'Start Doing', 'Stop Doing'],
    icon: '⭐',
    tags: ['retrospective', 'actions', 'team']
  },
  {
    id: 'kpt',
    name: 'KPT',
    description: 'Concise approach for identifying issues and solutions',
    columns: ['Keep', 'Problem', 'Try'],
    icon: '🔑',
    tags: ['retrospective', 'simple', 'actions']
  },
  {
    id: 'pro-con',
    name: 'Pros & Cons',
    description: 'Evaluate options and make informed decisions',
    columns: ['Pros', 'Cons', 'Decisions'],
    icon: '⚖️',
    tags: ['decision', 'evaluation', 'analysis']
  },
  {
    id: 'user-journey',
    name: 'User Journey Map',
    description: 'Map out each stage of the user experience',
    columns: ['Awareness', 'Consideration', 'Decision', 'Onboarding', 'Retention', 'Advocacy'],
    icon: '🗺️',
    tags: ['ux', 'design', 'customer']
  },
  {
    id: 'three-horizons',
    name: 'Three Horizons',
    description: 'Strategic planning across different time frames',
    columns: ['Horizon 1 (Now)', 'Horizon 2 (Next)', 'Horizon 3 (Future)'],
    icon: '🔭',
    tags: ['strategy', 'planning', 'innovation']
  },
  {
    id: 'impact-effort',
    name: 'Impact/Effort Matrix',
    description: 'Prioritize tasks based on impact and required effort',
    columns: ['High Impact/Low Effort', 'High Impact/High Effort', 'Low Impact/Low Effort', 'Low Impact/High Effort'],
    icon: '📊',
    tags: ['prioritization', 'planning', 'efficiency']
  },
  {
    id: 'assumption-mapping',
    name: 'Assumption Mapping',
    description: 'Identify and test critical business assumptions',
    columns: ['Known Knowns', 'Known Unknowns', 'Unknown Knowns', 'Unknown Unknowns'],
    icon: '🧠',
    tags: ['strategy', 'risk', 'planning']
  },
  {
    id: 'customer-problem-solution',
    name: 'Customer-Problem-Solution',
    description: 'Framework for validating business model assumptions',
    columns: ['Customer Segments', 'Problems', 'Solutions', 'Value Propositions'],
    icon: '💡',
    tags: ['business', 'startup', 'validation']
  },
  {
    id: 'work-breakdown',
    name: 'Work Breakdown Structure',
    description: 'Hierarchical decomposition of project deliverables',
    columns: ['Project', 'Major Deliverables', 'Sub-deliverables', 'Work Packages', 'Tasks'],
    icon: '📑',
    tags: ['project management', 'planning', 'organization']
  },
  {
    id: 'five-stage-design',
    name: 'Five Stage Design Thinking',
    description: 'Human-centered approach to innovation',
    columns: ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'],
    icon: '🎨',
    tags: ['design', 'innovation', 'process']
  },
  {
    id: 'rose-thorn-bud',
    name: 'Rose, Thorn, Bud',
    description: 'Review positives, challenges, and opportunities',
    columns: ['Rose (Positive)', 'Thorn (Challenge)', 'Bud (Opportunity)'],
    icon: '🌹',
    tags: ['feedback', 'reflection', 'opportunity']
  },
  {
    id: 'four-quadrant-feedback',
    name: 'Four Quadrant Feedback',
    description: 'Balanced personal or project feedback',
    columns: ['Continue', 'Consider', 'Start', 'Stop'],
    icon: '📝',
    tags: ['feedback', 'personal', 'development']
  },
  {
    id: 'big-orca',
    name: 'Big Orca',
    description: 'Comprehensive retro covering feelings, commitments, and improvements',
    columns: [{ title: 'Good stuff', defaultTimerSeconds: 600 }, { title: 'Bad stuff', defaultTimerSeconds: 600 }, { title: 'Feelings', defaultTimerSeconds: 600 }, { title: 'Improvements', defaultTimerSeconds: 600 }, 'Past commitments', 'New commitments'],
    icon: '🐋',
    tags: ['retrospective', 'team', 'commitments', 'feelings'],
    skipWizard: true,
    defaultSettings: {
      retrospectiveMode: false,
      showDisplayNames: false,
      actionItemsEnabled: false,
      workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
    }
  }
];

export default BOARD_TEMPLATES;
