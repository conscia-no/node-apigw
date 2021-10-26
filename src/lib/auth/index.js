const { authorizeJwtToken } = require('./jwt');

const enforceAuth = async (ctx, endpoint, authConfig) => {

    let payload; 

    // JWT
    if (endpoint.auth?.jwt?.protect) {
        // Check if header exists
        const authHeader = ctx.get("Authorization");

        if (!authHeader) {
            return Promise.reject({ status: 401 });
        }

        const token = authHeader.split(" ")[1];

        try {
            payload = await authorizeJwtToken(token, authConfig);

        } catch (authorizeTokenError) {
            return Promise.reject({ status: 500 });
        }
        return Promise.resolve(payload);
    } else {
        return Promise.reject({ status: 500, message: 'Endpoint configured for auth but no auth method set'});
    }

}

module.exports = {
    enforceAuth
}