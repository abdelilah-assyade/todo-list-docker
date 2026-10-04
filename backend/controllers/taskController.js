const repository = require('../db/tasksRepository');
const { validateTask } = require('../middleware/validateTask');
const ApiError = require('../utils/ApiError');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest('Task id must be a positive whole number.');
  }
  return id;
}

const ok = (res, data) => res.status(200).json({ success: true, data });

async function listTasks(req, res) {
  const tasks = await repository.list({
    filter: req.query.filter,
    sort: req.query.sort,
  });
  ok(res, tasks);
}

async function getTask(req, res) {
  const task = await repository.findById(parseId(req.params.id));
  if (!task) throw ApiError.notFound('Task ' + req.params.id + ' does not exist.');
  ok(res, task);
}

async function createTask(req, res) {
  const data = validateTask(req.body, 'create');
  const task = await repository.create(data);
  res.status(201)
    .location('/api/tasks/' + task.id)
    .json({ success: true, data: task });
}

async function replaceTask(req, res) {
  const id = parseId(req.params.id);
  const data = validateTask(req.body, 'replace');
  const task = await repository.replace(id, data);
  if (!task) throw ApiError.notFound('Task ' + id + ' does not exist.');
  ok(res, task);
}

async function patchTask(req, res) {
  const id = parseId(req.params.id);
  const patch = validateTask(req.body, 'patch');
  if (Object.keys(patch).length === 0) {
    throw ApiError.badRequest('Nothing to update. Send at least one field.');
  }
  const task = await repository.update(id, patch);
  if (!task) throw ApiError.notFound('Task ' + id + ' does not exist.');
  ok(res, task);
}

async function deleteTask(req, res) {
  const id = parseId(req.params.id);
  const removed = await repository.remove(id);
  if (!removed) throw ApiError.notFound('Task ' + id + ' does not exist.');
  res.status(204).end();
}

module.exports = { listTasks, getTask, createTask, replaceTask, patchTask, deleteTask };