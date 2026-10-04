const ApiError = require('../utils/ApiError');

const PRIORITIES = ['low', 'medium', 'high'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateTitle(value, errors, { required }) {
  if (value === undefined) {
    if (required) errors.title = 'Title is required.';
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    errors.title = 'Title must be a non-empty string.';
    return undefined;
  }
  const title = value.trim();
  if (title.length > 255) {
    errors.title = 'Title must be 255 characters or fewer.';
    return undefined;
  }
  return title;
}

function validateDescription(value, errors) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    errors.description = 'Description must be a string.';
    return undefined;
  }
  if (value.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer.';
    return undefined;
  }
  return value.trim();
}

function validatePriority(value, errors) {
  if (value === undefined) return undefined;
  if (!PRIORITIES.includes(value)) {
    errors.priority = 'Priority must be one of: ' + PRIORITIES.join(', ');
    return undefined;
  }
  return value;
}

function validateDueDate(value, errors) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    errors.due_date = 'Due date must be a real date in YYYY-MM-DD format.';
    return undefined;
  }
  return value;
}

function validateCompleted(value, errors) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === 0 || value === 1) return value;
  errors.completed = 'Completed must be true or false.';
  return undefined;
}

// mode 'create' -> defaults are applied, only title is mandatory
// mode 'replace' -> PUT: every field is replaced, missing ones fall back to defaults
// mode 'patch'   -> PATCH: only the fields present in the body are touched
function validateTask(body, mode) {
  const errors = {};

  if (!isPlainObject(body)) {
    throw ApiError.badRequest('Request body must be a JSON object.');
  }

  const title = validateTitle(body.title, errors, { required: mode !== 'patch' });
  const description = validateDescription(body.description, errors);
  const priority = validatePriority(body.priority, errors);
  const dueDate = validateDueDate(body.due_date, errors);
  const completed = validateCompleted(body.completed, errors);

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Validation failed.', errors);
  }

  if (mode === 'patch') {
    const patch = {};
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (priority !== undefined) patch.priority = priority;
    if (dueDate !== undefined) patch.due_date = dueDate;
    if (completed !== undefined) patch.completed = completed;
    return patch;
  }

  return {
    title,
    description: description === undefined ? null : description,
    priority: priority === undefined ? 'medium' : priority,
    due_date: dueDate === undefined ? null : dueDate,
    completed: completed === undefined ? 0 : completed,
  };
}

module.exports = { validateTask, PRIORITIES };