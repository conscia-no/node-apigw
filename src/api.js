const Koa = require('koa');
const Router = require('@koa/router');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');
const koaLogger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const Logger = require('./lib/log');
const { enforceAuth } = require('./lib/auth');

class APIGateway {
    constructor(config) {
        this.config = config;

        this.log = new Logger(config.get('log'));
        

        this.app = new Koa();

        // Load middleware 
        this.app.use(koaLogger());
        this.app.use(cors({ origin: '*', credentials: true }));
        this.app.use(bodyParser());
        // Load Endpoints
        const router = new Router();


        /**
         * Enable health probe endpoint
         */
        if (this.config.get("health.probe")) {
            router.get('/_health', async ctx => {
                ctx.status = 200;
                ctx.body = {"status": "healthy"}
            })
        }

        /**
         * Enable Swagger UI
         */
        if (this.config.get("docs.enabled")) {
            router.get('/docs', async ctx => {
                ctx.status = 200;
                ctx.body = "docs"
            });
        }

        /**
         * Enable showing the swagger ui on the default endpoint
         */
        if (this.config.get("docs.redirect")) {
            router.get('/', async ctx => {
                ctx.redirect('/docs');
            });
        } else {
            router.get('/', async ctx => {
                ctx.status = 204;
            });
        }

        /**
         * Authentication 
         */
        if (this.config.get('auth.jwt.enabled')) {
            // Mount the validate endpoint
            router.post(this.config.get('auth.jwt.endpoints.validate'), async (ctx) => {
                const { token } = ctx.request.body;

                if (!token) {
                    ctx.status = 401;
                    ctx.body = '';
                }

                // Validate token somehow kekw
            })
        }

        if (this.config.get('auth.oauth.enabled')) {
            if (this.config.get('auth.oauth.azure')) {
                
                const clientId = this.config.get('auth.oauth.azure.clientId');
                const clientSecret = this.config.get('auth.oauth.azure.clientSecret');

                // Build our oauth redirect uri
                router.get(this.config.get('auth.oauth.azure.redirectUri'), async ctx => {

                    const { code } = ctx.params.query;
                    
                    try {
                        // Fetching token from oauth provider
                        let response = await fetch(`${this.config.get('auth.oauth.azure.tokenUri')}?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`);
                        
                        if (response.ok) {
                            let data = await response.json();
                            ctx.status = 200;
                            // TODO: We need to return some proper tokens here. JWT??
                        } else {
                            ctx.status = response.status;
                            ctx.body = ''
                        }
                    } catch (error) {
                        ctx.status = 500;
                        this.log.publish(error);
                    }
                })
            }
        }
        /**
         * Load endpoints from configuration file 
         */
        const endpoints = this.config.get("endpoints");
        endpoints.forEach((endpoint) => {

            // Letting config be written as POST or post. 
            let method = endpoint.method.toLowerCase();
            
            router[method](
                endpoint.name, 
                endpoint.path, 

                // If endpoint has authentication we catch in this middleware
                async (ctx, next) => {

                    try {
                        await enforceAuth(ctx, endpoint);
                    } catch (authError) {
                        ctx.status = authError.status;
                        return;
                    }

                    return await next();
                },
                // END: Middleware
                async (ctx) => {

                    
                    const controller = new AbortController();

                    const timeout = setTimeout(() => {
                        controller.abort();
                    }, endpoint.timeout || 300);

                    try {
                        let response;
                        let commonHeaders = {
                            'Content-Type': 'application/json'
                        };

                        if (method == 'post' || method == 'put' || method == 'patch') { // using lowercase since we already made the string lowercase 
                            let requiredParams = endpoint.body?.required;
                            let bodyParams = ctx.request.body; 
                            let evaluateTypes = false;
                            let matchedParams = 0;
                            
                            if (requiredParams) {
                                let searchableBodyKeys = Object.keys(bodyParams);
                                
                                // TODO: Check if there are required body parameters.
                                for (let x = 0; x<requiredParams.length; x++) {
                                    if (typeof requiredParams[x] === 'object') {
                                       evaluateTypes = true;
                                    }

                                    let paramKey = Object.keys(requiredParams[x])[0];
                                    let paramVal = requiredParams[x][paramKey];
                                    
                                    let foundKey = searchableBodyKeys.indexOf(paramKey);

                                    if (foundKey > -1) {
                                        // Check if the param is of the correct type
                                        if (paramVal) { 
                                            if (typeof bodyParams[searchableBodyKeys[foundKey]] === paramVal) {
                                                matchedParams++;
                                            }
                                        } else {
                                            matchedParams++;
                                        }
                                        
                                    }
                                }

                                if (matchedParams < requiredParams.length) {
                                    // We found less parameters than ones that was configured
                                    ctx.status = 403;
                                    ctx.body = 'Request missing expected body parameters'
                                    return;
                                }
                             
                            }
                            response = await fetch(`${endpoint.remotePath}`, {
                                method: endpoint.method,
                                body: JSON.stringify(ctx.request.body),
                                headers: Object.assign({}, commonHeaders)
                            })
                        }

                        if (method == 'get' || method == 'delete') {
                            response = await fetch(`${endpoint.remotePath}`, {
                                method: endpoint.method,
                                headers: Object.assign({}, commonHeaders)
                            })
                        }

                        

                        if (response.ok) {
                            let data = await response.json();
                        
                            ctx.status = 200;
                            ctx.body = data;
                        } else {
                            ctx.status = response.status;
                            // Add check and endpoint config parameter to shuffle in service error instead of statusText
                            if (endpoint.forwardError) {
                                //
                            } else {
                                ctx.body = { status: response.statusText, text: response.body };
                                
                            }
                            
                        }

                    } catch (error) {
                        ctx.status = 500;
                        this.log.publish(error);
                    } finally {
                        clearTimeout(timeout);
                    }
                })
        });

        // Mount the routes
        this.app.use(router.routes());
    }

    boot = async () => {
        this.app.listen(this.config.get("port"));
        this.log.publish('API Gateway is alive and running on ' + this.config.get("baseUrl") + ':' + this.config.get("port"));
    }
}

module.exports = APIGateway;