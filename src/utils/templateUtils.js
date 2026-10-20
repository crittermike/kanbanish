const RETRO_TAGS = ['retrospective', 'reflection', 'agile', 'feedback', 'emotions'];
const LAST_TEMPLATE_KEY = 'kanbanish_last_template';

/**
 * Settings to apply when creating a board from a template. Templates with
 * explicit defaultSettings use them; otherwise whether the steps start right away is inferred from tags.
 * @param {Object} template
 * @returns {Object}
 */
export function getTemplateSettings(template) {
  if (template.defaultSettings) {
    return template.defaultSettings;
  }
  const tags = template.tags || [];
  // Retro-style templates open straight into the Add step
  return { retrospectiveMode: tags.some(tag => RETRO_TAGS.includes(tag)) };
}

/**
 * Builds the createBoardFromTemplate() arguments for a template.
 * @param {Object} template
 * @returns {{columns: Array, templateName: string, settingsOverrides: Object}}
 */
export function getTemplateBoardOptions(template) {
  return {
    columns: template.columns,
    templateName: template.shortName || template.name,
    settingsOverrides: getTemplateSettings(template)
  };
}

/**
 * Relative URL that creates a board from the template when opened.
 * @param {string} templateId
 * @returns {string}
 */
export function getTemplateUrl(templateId) {
  return `?template=${encodeURIComponent(templateId)}`;
}

export function getLastTemplateId() {
  try {
    return localStorage.getItem(LAST_TEMPLATE_KEY);
  } catch {
    return null;
  }
}

export function setLastTemplateId(templateId) {
  try {
    localStorage.setItem(LAST_TEMPLATE_KEY, templateId);
  } catch {
    // localStorage unavailable — silent fail
  }
}
