const request = require('supertest');
const app = require('./app');
const db = require('./models');

let token;
let createdTodoId;
let createdCategoryId;
let createdUserId;

const testEmail = `jest-${Date.now()}@example.com`;
const testPassword = 'Test1234';

describe('Todo API tests', () => {
	beforeAll(async () => {
		await app.dbReady;
	});

	test('Valid login', async () => {
		const signupResponse = await request(app)
			.post('/users/signup')
			.send({
				name: 'Jest Test User',
				email: testEmail,
				password: testPassword
			});

		expect(signupResponse.statusCode).toBe(201);
		createdUserId = signupResponse.body.data.result.id;

		const response = await request(app)
			.post('/users/login')
			.send({
				email: testEmail,
				password: testPassword
			});

		expect(response.statusCode).toBe(200);
		expect(response.body.status).toBe('success');
		expect(response.body.data.result.token).toBeDefined();

		token = response.body.data.result.token;
	});

	test('Get all Todos with valid JWT', async () => {
		const response = await request(app)
			.get('/todos')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(200);
		expect(response.body.status).toBe('success');
		expect(Array.isArray(response.body.data.result)).toBe(true);
	});

	test('Add a Todo with valid JWT', async () => {
		const categoryResponse = await request(app)
			.post('/category')
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Jest Test Category'
			});

		expect(categoryResponse.statusCode).toBe(201);

		createdCategoryId = categoryResponse.body.data.result.id;

		const response = await request(app)
			.post('/todos')
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Jest Test Todo',
				description: 'Todo created by Jest and Supertest',
				categoryId: createdCategoryId
			});

		expect(response.statusCode).toBe(201);
		expect(response.body.status).toBe('success');
		expect(response.body.data.result.id).toBeDefined();

		createdTodoId = response.body.data.result.id;
	});

	test('Delete the Todo created in the previous test', async () => {
		const response = await request(app)
			.delete(`/todos/${createdTodoId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(200);
		expect(response.body.status).toBe('success');
		expect(response.body.data.result.id).toBe(createdTodoId);
	});

	test('Get Todos without JWT', async () => {
		const response = await request(app)
			.get('/todos');

		expect(response.statusCode).toBe(401);
		expect(response.body.status).toBe('fail');
	});

	test('Get Todos with invalid JWT', async () => {
		const response = await request(app)
			.get('/todos')
			.set('Authorization', 'Bearer invalidtoken');

		expect(response.statusCode).toBe(401);
		expect(response.body.status).toBe('fail');
	});
});

afterAll(async () => {
	if (createdTodoId) {
		await db.Todo.destroy({ where: { id: createdTodoId } });
	}

	if (createdCategoryId) {
		await db.Category.destroy({ where: { id: createdCategoryId } });
	}

	if (createdUserId) {
		await db.User.destroy({ where: { id: createdUserId } });
	}

	await db.sequelize.close();
});