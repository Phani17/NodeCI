const mongoose = require('mongoose');
const util = require('util');
const exec = mongoose.Query.prototype.exec;
const redis = require('redis');
const keys = require('../config/keys');
//const url = 'redis://127.0.0.1:6379';
const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.cache = function(options={}){
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  return this;
}

mongoose.Query.prototype.exec = async function(){
  if(!this.useCache){
    return exec.apply(this,arguments);
  }

  console.log('i am about to run query');
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));
  const cacheValue = await client.hget(this.hashKey, key);
  if(cacheValue){
    //return new this.model(JSON.parse(cacheValue));
    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }
  const result = await exec.apply(this, arguments);
  client.hmset(this.hashKey, key, JSON.stringify(result), 'EX', 10);
  return result;
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}
