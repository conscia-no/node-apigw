const { authorizeJwtToken } = require('./jwt'); 

export const enforceAuth = async (ctx, endpoint) => {
    // Is authentication for the endpoint configured?
    if (endpoint.auth) {

        // JWT
        if (endpoint.auth?.jwt?.protect) {
            // Check if header exists
            const authHeader = ctx.get("Authorization");

            if (!authHeader) {
                return Promise.reject({ status: 401 });
            }

            const token = authHeader.split(" ")[1];

            try {
                await authorizeJwtToken(token);

            } catch (authorizeTokenError) {
                return Promise.reject({ status: 500 });
            }
            return Promise.resolve()
        } else {
            return Promise.resolve();
        }
    }
}