# node-apigw

A Simplistic and easy-to-use API Gateway for backend services written in NodeJS

## Usage

In your project install the package from github;

```npm install --save https://github.com/kheide/node-apigw.git```

Create your yaml configuration and load it with node-config; 

```
npm install --save config js-yaml
```

In your code: 

```
const config = require('config');

const api = new APIGateway(config);

try {
    await api.boot();
} catch (error) {
    process.exit()
}
```