# node-apigw

A Simplistic and easy-to-use API Gateway for backend services written in NodeJS. The purpose of this project is to be able to structure unstructured APIs behind a singular gateway with real API capabilities like authentication, throttling etc. You can also create endpoints that fetches data from multiple backend services and joins the data in a single response. It could also be used as a frontend API for a distributed services architecture.

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
