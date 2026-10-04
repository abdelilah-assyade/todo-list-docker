const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

// Only these keys may reach SQL. Never build a query from raw user input.
const SORT_SQL = {
  created_desc: 'created_at DESC, id DESC',
  created_asc: 'created_at ASC, id ASC',
  priority_desc: "FIELD(priority, 'high', 'medium', 'low'), created_at DESC",
  priority_asc: "FIELD(priority, 'low', 'medium', 'high'), created_at DESC",
  due_asc: 'due_date IS NULL, due_date ASC, created_at DESC',
  due_desc: 'due_date IS NULL, due_date DESC, created_at DESC',
};

const FILTER_SQL = {
  all: null,
  active: 'completed = 0',
  completed: 'completed = 1',
};

// MySQL hands us dates as strings (dateStrings: true), so 'YYYY-MM-DD HH:MM:SS'.
// Browsers understand 'YYYY-MM-DDTHH:MM:SS' as local time, so just swap the space.
function toApiTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    completed: Number(row.completed) === 1,
    due_date: row.due_date,
    created_at: String(row.created_at).replace(' ', 'T'),
    updated_at: row.updated_at ? String(row.updated_at).replace(' ', 'T') : null,
  };
}

module.exports = { PRIORITY_RANK, SORT_SQL, FILTER_SQL, toApiTask };