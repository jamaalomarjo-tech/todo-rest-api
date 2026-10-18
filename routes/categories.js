var express = require('express');
var router = express.Router();
var jsend = require('jsend');
var db = require('../models');
const isAuth = require('../middleware/middleware');

router.use(jsend.middleware);

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Return all categories for the logged-in user
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Missing or invalid JWT
 *       500:
 *         description: Could not retrieve categories
 */

// Return all categories for the logged-in user
router.get('/', isAuth, async (req, res) => {
	try {
		const categories = await db.Category.findAll({
			where: {
				UserId: req.user.id
			}
		});

		return res.status(200).jsend.success({
			statusCode: 200,
			result: categories
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not retrieve categories'
		});
	}
});

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Add a category for the logged-in user
 *     tags:
 *       - Categories
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Work
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category name is required
 *       401:
 *         description: Missing or invalid JWT
 *       500:
 *         description: Could not create category
 */

// Add a new category for the logged-in user
router.post('/', isAuth, async (req, res) => {
	try {
		const { name } = req.body;

		if (!name) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'Category name is required'
			});
		}

		const category = await db.Category.create({
			name: name,
			UserId: req.user.id
		});

		return res.status(201).jsend.success({
			statusCode: 201,
			result: category
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not create category'
		});
	}
});

/**
 * @swagger
 * /category/{id}:
 *   put:
 *     summary: Update a category belonging to the logged-in user
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: personal
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Category name is required
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Category not found
 *       500:
 *         description: Could not update category
 */

// Update a category belonging to the logged-in user
router.put('/:id', isAuth, async (req, res) => {
	try {
		const { name } = req.body;

		if (!name) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'Category name is required'
			});
		}

		const category = await db.Category.findOne({
			where: {
				id: req.params.id,
				UserId: req.user.id
			}
		});

		if (!category) {
			return res.status(404).jsend.fail({
				statusCode: 404,
				result: 'Category not found'
			});
		}

		category.name = name;
		await category.save();

		return res.status(200).jsend.success({
			statusCode: 200,
			result: category
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not update category'
		});
	}
});

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete a category belonging to the logged-in user
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Category cannot be deleted because it is assigned to a Todo
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Category not found
 *       500:
 *         description: Could not delete category
 */

// Delete a category belonging to the logged-in user
router.delete('/:id', isAuth, async (req, res) => {
	try {
		const category = await db.Category.findOne({
			where: {
				id: req.params.id,
				UserId: req.user.id
			}
		});

		if (!category) {
			return res.status(404).jsend.fail({
				statusCode: 404,
				result: 'Category not found'
			});
		}

		const todoUsingCategory = await db.Todo.findOne({
			where: {
				CategoryId: category.id,
				UserId: req.user.id
			}
		});

		if (todoUsingCategory) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'Category cannot be deleted because it is assigned to a Todo'
			});
		}

		await category.destroy();

		return res.status(200).jsend.success({
			statusCode: 200,
			result: 'Category deleted successfully'
		});
	} catch (error) {
		console.error(error);

		return res.status(500).jsend.error({
			message: 'Could not delete category'
		});
	}
});

module.exports = router;