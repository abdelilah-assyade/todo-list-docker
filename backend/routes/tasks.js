const express = require('express');
const controller = require('../controllers/taskController');

const router = express.Router();

router.get('/', controller.listTasks);
router.post('/', controller.createTask);

router.get('/:id', controller.getTask);
router.put('/:id', controller.replaceTask);
router.patch('/:id', controller.patchTask);
router.delete('/:id', controller.deleteTask);

module.exports = router;