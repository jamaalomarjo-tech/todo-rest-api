var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
var swaggerUi = require('swagger-ui-express');
var swaggerSpec = require('./swagger');

var db = require('./models');

const dbReady = db.sequelize.sync().then(async () => {
	const statuses = ['Not Started', 'Started', 'Completed', 'Deleted'];

	for (const statusName of statuses) {
		await db.Status.findOrCreate({
			where: { status: statusName },
		});
	}
});

var usersRouter = require('./routes/users');
var todosRouter = require('./routes/todos');
var categoriesRouter = require('./routes/categories');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/users', usersRouter);
app.use('/todos', todosRouter);
app.use('/category', categoriesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	const statusCode = err.status || 500;

	return res.status(statusCode).json({
		status: 'error',
		result: err.message || 'Internal server error'
	});
});
app.dbReady = dbReady;

module.exports = app;