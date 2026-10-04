// MySQL storage. Written now so nothing has to be rewritten in Stage 3,
// but it stays dormant until DB_DRIVER=mysql.
const { query } = require('./database');
const { SORT_SQL, FILTER_SQL, toApiTask } = require('./shared');

const COLUMNS = 'id, title, description, priority, completed, due_date, created_at, updated_at';

function createMysqlStore() {
  return {
    async init() {
      const { init } = require('./database');
      await init();
    },

    async list({ filter = 'all', sort = 'created_desc' } = {}) {
      const where = FILTER_SQL[filter] ? ' WHERE ' + FILTER_SQL[filter] : '';
      const orderBy = SORT_SQL[sort] || SORT_SQL.created_desc;
      const rows = await query('SELECT ' + COLUMNS + ' FROM tasks' + where + ' ORDER BY ' + orderBy);
      return rows.map(toApiTask);
    },

    async findById(id) {
      const rows = await query('SELECT ' + COLUMNS + ' FROM tasks WHERE id = ?', [id]);
      return rows.length ? toApiTask(rows[0]) : null;
    },

    async create(data) {
      const rows = await query(
        'INSERT INTO tasks (title, description, priority, completed, due_date) VALUES (?, ?, ?, ?, ?)',
        [data.title, data.description, data.priority, data.completed, data.due_date]
      );
      return this.findById(rows.insertId);
    },

    async replace(id, data) {
      const result = await query(
        'UPDATE tasks SET title = ?, description = ?, priority = ?, completed = ?, due_date = ? WHERE id = ?',
        [data.title, data.description, data.priority, data.completed, data.due_date, id]
      );
      if (result.affectedRows === 0) return null;
      return this.findById(id);
    },

    async update(id, patch) {
      const columns = Object.keys(patch);
      if (columns.length === 0) return this.findById(id);

      const setClause = columns.map((column) => column + ' = ?').join(', ');
      const values = columns.map((column) => patch[column]);

      const result = await query(
        'UPDATE tasks SET ' + setClause + ' WHERE id = ?',
        [...values, id]
      );
      if (result.affectedRows === 0) return null;
      return this.findById(id);
    },

    async remove(id) {
      const result = await query('DELETE FROM tasks WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
  };
}

module.exports = createMysqlStore;