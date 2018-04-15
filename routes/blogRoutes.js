const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const Blog = mongoose.model('Blog');
const { clearHash } = require('../services/cache');
const cleanCache = require('../middlewares/cleanCache');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    // const redis = require('redis');
    // const url = 'redis://127.0.0.1:6379';
    // const client = redis.createClient(url);
    // const util = require('util');
    // //as redis doesnt have native support to return a promise,
    // //promisify - takes any function whuch has a callback as last params
    // // and makes a promise and returns it as function
    // // and hence we need not use a callback
    //
    // client.get = util.promisify(client.get);
    // const cachedBlogs = await client.get(req.user.id);
    // //do we have any cached data in redis to this query
    // // if yes, return response right away
    // if(cachedBlogs){
    //   console.log('Serving from Cache');
    //   return res.send(JSON.parse(cachedBlogs));
    // }
    // //if no, respond and update our cache to store data fo future
    // const blogs = await Blog.find({ _user: req.user.id });
    // console.log('Serving from Server');
    // res.send(blogs);
    // client.set(req.user.id,JSON.stringify(blogs));
    const blogs = await Blog.find({ _user: req.user.id })
                            .cache({ key: req.user.id });
    res.send(blogs);
  });

  app.post('/api/blogs', requireLogin, cleanCache, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);

    } catch (err) {
      res.send(400, err);
    }
    
  });
};
