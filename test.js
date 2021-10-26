const url = '_state_userId';

let re = /_state_(\w+)/g

let data = re.exec(url);

console.log(data[1]);