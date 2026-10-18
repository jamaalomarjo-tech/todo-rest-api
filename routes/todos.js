var express = require('express');
var router = express.Router();

var jsend = require('jsend');
const isAuth = require('../middleware/middleware');
var db = require('../models');
const { Op } = require('sequelize');

router.use(jsend.middleware);

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Return all non-deleted Todos for the logged-in user
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todos retrieved successfully
 *       401:
 *         description: Missing or invalid JWT
 *       500:
 *         description: Could not retrieve Todos
 */

/* Return all the logged in users todos with the category associated with each todo and
status that is not the deleted status */
router.get('/', isAuth, async (req, res) => {
	try {
		const deletedStatus = await db.Status.findOne({
			where: {
				status: 'Deleted'
			}
		});

		if (!deletedStatus) {
			return res.status(500).jsend.error({
				message: 'Deleted status could not be found'
			});
		}

		const todos = await db.Todo.findAll({
			where: {
				UserId: req.user.id,
				StatusId: {
					[Op.ne]: deletedStatus.id
				}
			},
			include: [
				{
					model: db.Category
				},
				{
					model: db.Status
				}
			]
		});

		return res.status(200).jsend.success({
			statusCode: 200,
			result: todos
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not retrieve Todos'
		});
	}
});

/**
 * @swagger
 * /todos/all:
 *   get:
 *     summary: Return all Todos for the logged-in user including deleted Todos
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All Todos retrieved successfully
 *       401:
 *         description: Missing or invalid JWT
 *       500:
 *         description: Could not retrieve Todos
 */

// Return all the users todos including todos with a deleted status
router.get('/all', isAuth, async (req, res) => {
	try {
		const todos = await db.Todo.findAll({
			where: {
				UserId: req.user.id
			},
			include: [
				{
					model: db.Category
				},
				{
					model: db.Status
				}
			]
		});

		return res.status(200).jsend.success({
			statusCode: 200,
			result: todos
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not retrieve Todos'
		});
	}
});

/**
 * @swagger
 * /todos/deleted:
 *   get:
 *     summary: Return deleted Todos for the logged-in user
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted Todos retrieved successfully
 *       401:
 *         description: Missing or invalid JWT
 *       500:
 *         description: Could not retrieve deleted Todos
 */

// Return all the todos with the deleted status
router.get('/deleted', isAuth, async (req, res) => {
	try {
		const deletedStatus = await db.Status.findOne({
			where: {
				status: 'Deleted'
			}
		});

		if (!deletedStatus) {
			return res.status(500).jsend.error({
				message: 'Deleted status could not be found'
			});
		}

		const todos = await db.Todo.findAll({
			where: {
				UserId: req.user.id,
				StatusId: deletedStatus.id
			},
			include: [
				{
					model: db.Category
				},
				{
					model: db.Status
				}
			]
		});

		return res.status(200).jsend.success({
			statusCode: 200,
			result: todos
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not retrieve deleted Todos'
		});
	}
});

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Add a new Todo for the logged-in user
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Finish assignment
 *               description:
 *                 type: string
 *                 example: Complete the Todo API assignment
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Todo created successfully
 *       400:
 *         description: Required Todo data is missing
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Category not found
 *       500:
 *         description: Could not create Todo
 */

// Add a new todo with their category for the logged in user
router.post('/', isAuth, async (req, res) => {
	try {
		const { name, description, categoryId } = req.body;

		if (!name || !description || !categoryId) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'Name, description and category are required'
			});
		}

		const category = await db.Category.findOne({
			where: {
				id: categoryId,
				UserId: req.user.id
			}
		});

		if (!category) {
			return res.status(404).jsend.fail({
				statusCode: 404,
				result: 'Category not found'
			});
		}

		const status = await db.Status.findOne({
			where: {
				status: 'Not Started'
			}
		});

		if (!status) {
			return res.status(500).jsend.error({
				message: 'Not Started status could not be found'
			});
		}

		const todo = await db.Todo.create({
			name: name,
			description: description,
			CategoryId: category.id,
			StatusId: status.id,
			UserId: req.user.id
		});

		return res.status(201).jsend.success({
			statusCode: 201,
			result: todo
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not create Todo'
		});
	}
});

/**
 * @swagger
 * /todos/statuses:
 *   get:
 *     summary: Return all Todo statuses
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statuses retrieved successfully
 *       401:
 *         description: Missing or invalid JWT
 *       500:
 *         description: Could not retrieve statuses
 */

// Return all the statuses from the database
router.get('/statuses', isAuth, async (req, res) => {
	try {
		const statuses = await db.Status.findAll();

		return res.status(200).jsend.success({
			statusCode: 200,
			result: statuses
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not retrieve statuses'
		});
	}
});

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Update a Todo belonging to the logged-in user
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Todo
 *               description:
 *                 type: string
 *                 example: Updated description
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               statusId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Todo, Category or Status not found
 *       500:
 *         description: Could not update Todo
 */

// Change/update a specific todo for logged in user
router.put('/:id', isAuth, async (req, res) => {
	try {
		const { name, description, categoryId, statusId } = req.body;

		const todo = await db.Todo.findOne({
			where: {
				id: req.params.id,
				UserId: req.user.id
			}
		});

		if (!todo) {
			return res.status(404).jsend.fail({
				statusCode: 404,
				result: 'Todo not found'
			});
		}

		if (categoryId) {
			const category = await db.Category.findOne({
				where: {
					id: categoryId,
					UserId: req.user.id
				}
			});

			if (!category) {
				return res.status(404).jsend.fail({
					statusCode: 404,
					result: 'Category not found'
				});
			}

			todo.CategoryId = category.id;
		}

		if (statusId) {
			const status = await db.Status.findOne({
				where: {
					id: statusId
				}
			});

			if (!status) {
				return res.status(404).jsend.fail({
					statusCode: 404,
					result: 'Status not found'
				});
			}

			todo.StatusId = status.id;
		}

		if (name) {
			todo.name = name;
		}

		if (description) {
			todo.description = description;
		}

		await todo.save();

		return res.status(200).jsend.success({
			statusCode: 200,
			result: todo
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not update Todo'
		});
	}
});

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Soft delete a Todo belonging to the logged-in user
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo marked as Deleted
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Todo not found
 *       500:
 *         description: Could not delete Todo
 */

// Delete a specific todo if for the logged in user
router.delete('/:id', isAuth, async (req, res) => {
	try {
		const todo = await db.Todo.findOne({
			where: {
				id: req.params.id,
				UserId: req.user.id
			}
		});

		if (!todo) {
			return res.status(404).jsend.fail({
				statusCode: 404,
				result: 'Todo not found'
			});
		}

		const deletedStatus = await db.Status.findOne({
			where: {
				status: 'Deleted'
			}
		});

		if (!deletedStatus) {
			return res.status(500).jsend.error({
				message: 'Deleted status could not be found'
			});
		}

		todo.StatusId = deletedStatus.id;
		await todo.save();

		return res.status(200).jsend.success({
			statusCode: 200,
			result: todo
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not delete Todo'
		});
	}
});

module.exports = router;