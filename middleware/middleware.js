var jwt = require('jsonwebtoken');

// Middleware function to determine if the API endpoint request
// is from an authenticated user
function isAuth(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({
			status: 'fail',
			data: {
				statusCode: 401,
				result: 'Authentication token is required'
			}
		});
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({
			status: 'fail',
			data: {
				statusCode: 401,
				result: 'Authentication token is required'
			}
		});
	}

	try {
		const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);

		req.user = decodedToken;

		next();
	} catch (error) {
		return res.status(401).json({
			status: 'fail',
			data: {
				statusCode: 401,
				result: 'Invalid or expired token'
			}
		});
	}
}

module.exports = isAuth;