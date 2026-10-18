var express = require('express');
var router = express.Router();

var jsend = require('jsend');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var db = require('../models');

router.use(jsend.middleware);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in a registered user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: Test1234
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Incorrect email or password
 *       500:
 *         description: Could not log in
 */

// Post for registered users to be able to login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'Email and password are required'
			});
		}

		const user = await db.User.findOne({
			where: { email: email }
		});

		if (!user) {
			return res.status(401).jsend.fail({
				statusCode: 401,
				result: 'Incorrect email or password'
			});
		}

		const encryptedPassword = crypto.pbkdf2Sync(
			password,
			user.salt,
			1000,
			64,
			'sha512'
		);

		if (!crypto.timingSafeEqual(encryptedPassword, user.encryptedPassword)) {
			return res.status(401).jsend.fail({
				statusCode: 401,
				result: 'Incorrect email or password'
			});
		}

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email
			},
			process.env.TOKEN_SECRET,
			{
				expiresIn: '2h'
			}
		);

		return res.status(200).jsend.success({
			statusCode: 200,
			result: {
				token: token
			}
		});
	} catch (error) {
		return res.status(500).jsend.error({
			statusCode: 500,
			message: 'Could not log in'
		});
	}
});

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Test User
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: Test1234
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid signup data or email already exists
 *       500:
 *         description: Could not create user
 */

// Post for new users to register / signup
router.post('/signup', async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'Name, email and password are required'
			});
		}

		const existingUser = await db.User.findOne({
			where: { email: email }
		});

		if (existingUser) {
			return res.status(400).jsend.fail({
				statusCode: 400,
				result: 'A user with this email already exists'
			});
		}

		const salt = crypto.randomBytes(16);

		const encryptedPassword = crypto.pbkdf2Sync(
			password,
			salt,
			1000,
			64,
			'sha512'
		);

		const user = await db.User.create({
			name: name,
			email: email,
			encryptedPassword: encryptedPassword,
			salt: salt
		});

		return res.status(201).jsend.success({
			statusCode: 201,
			result: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		});
	} catch (error) {
		return res.status(500).jsend.error({
			statusCode: 500,
			message: 'Could not create user'
		});
	}
});

module.exports = router;