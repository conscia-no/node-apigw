const jwt = require('jsonwebtoken');
const config = require('config');
/**
 * authorize() - middleware that can be run as part of a Koa route to protect resources
 * 
 * @param {String} token 
 * @returns 
 */
const authorizeJwtToken = async (token) => {

    if (!token) {
        return Promise.reject();
    }
    
    try {
        let payload = await jwt.verify(token, config.get('auth.jwt.secretKey'));
        return Promise.resolve(payload)
    } catch (error) {
        return Promise.reject();
    }
}

const signJwtToken = async (tokenData) => {

    const token = jwt.sign(
        tokenData, 
        config.get('auth.jwt.secretKey'),
        { expiresIn: "2h"});

    return token;
}


module.exports = {
    authorizeJwtToken: authorizeJwtToken,
    signJwtToken: signJwtToken
};