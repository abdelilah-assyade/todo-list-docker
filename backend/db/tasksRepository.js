// Single place the app asks for data. Swaps storage based on config.dbDriver.
const config = require('../config');

let store = null;

function getStore() {
  if (store) return store;

  if (config.dbDriver === 'mysql') {
    // Required inside the function on purpose: mysql2 is only loaded when needed.
    store = require('./mysqlStore')();
  } else {
    store = require('./memoryStore')();
  }
  return store;
}

const repository = {
  driver: config.dbDriver,
  ready: () => getStore().init(),
  list: (query) => getStore().list(query),
  findById: (id) => getStore().findById(id),
  create: (data) => getStore().create(data),
  replace: (id, data) => getStore().replace(id, data),
  update: (id, patch) => getStore().update(id, patch),
  remove: (id) => getStore().remove(id),
};

module.exports = repository;