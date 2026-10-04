const { PRIORITY_RANK } = require('./shared');

// Stage 2 storage: a plain array in this process's memory.
// Fast, needs no server, but every restart wipes the data.
function createMemoryStore() {
  let rows = [];
  let nextId = 1;

  function sortRows(list, sort) {
    const [key, direction] = String(sort || 'created_desc').split('_');
    const sign = direction === 'asc' ? 1 : -1;

    return list.slice().sort((a, b) => {
      if (key === 'priority') {
        return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * sign;
      }
      if (key === 'due') {
        const av = a.due_date || '9999-12-31';
        const bv = b.due_date || '9999-12-31';
        return (av < bv ? -1 : av > bv ? 1 : 0) * sign;
      }
      return (new Date(a.created_at) - new Date(b.created_at)) * sign;
    });
  }

  return {
    async init() {
      console.log('[store] memory store ready (data is lost on restart)');
    },

    async list({ filter = 'all', sort = 'created_desc' } = {}) {
      let result = rows;
      if (filter === 'active') result = result.filter((t) => !t.completed);
      if (filter === 'completed') result = result.filter((t) => t.completed);
      return sortRows(result, sort);
    },

    async findById(id) {
      return rows.find((t) => t.id === id) || null;
    },

    async create(data) {
      const now = new Date().toISOString();
      const task = { id: nextId++, completed: 0, created_at: now, updated_at: null, ...data };
      rows.push(task);
      return task;
    },

    async replace(id, data) {
      const index = rows.findIndex((t) => t.id === id);
      if (index === -1) return null;
      const now = new Date().toISOString();
      rows[index] = { id, ...data, created_at: rows[index].created_at, updated_at: now };
      return rows[index];
    },

    async update(id, patch) {
      const task = rows.find((t) => t.id === id);
      if (!task) return null;
      Object.assign(task, patch, { updated_at: new Date().toISOString() });
      return task;
    },

    async remove(id) {
      const index = rows.findIndex((t) => t.id === id);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

module.exports = createMemoryStore;