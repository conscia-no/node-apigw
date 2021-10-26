const jwt = require('jsonwebtoken');
/**
 * authorize() - middleware that can be run as part of a Koa route to protect resources
 * 
 * @param {String} token 
 * @returns 
 */
const authorizeJwtToken = async (token, authConfig) => {

    if (!token) {
        return Promise.reject();
    }
    
    try {
        let payload = await jwt.verify(token, authConfig.jwt.secretKey);
        return Promise.resolve(payload)
    } catch (error) {
        return Promise.reject();
    }
}

const signJwtToken = async (tokenData, authConfig) => {

    let expiresIn = authConfig.jwt.expiresIn || '24h';

    const token = jwt.sign(
        tokenData, 
        authConfig.jwt.secretKey,
        { expiresIn: expiresIn });

    return token;
}


module.exports = {
    authorizeJwtToken: authorizeJwtToken,
    signJwtToken: signJwtToken
};