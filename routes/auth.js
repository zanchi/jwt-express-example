const bcrypt = require('bcryptjs');
const bluebird = require('bluebird');
const express = require('express');
const router = express.Router();
const optional = require('optional');

// redis connection
const redis = require('redis');
const config = optional('../redis.json');
const client = redis.createClient(process.env.REDIS_URL || config);
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// jwt
const jwt = require('jsonwebtoken');
const secret = require('../secret.json');
bluebird.promisifyAll(jwt);

router.post('/login', async function(req, res){
  const {user, pass} = req.body;
  if(!user || !pass) return res.status(400).send('user and pass are required');

  // get password hash from redis
  const hash = await client.getAsync(user);
  if(!hash) return res.status(401).send('User doesn\'t exist');

  const isCorrect = await bcrypt.compare(pass, hash);

  if(isCorrect){
    const token = await jwt.signAsync({user}, secret, {expiresIn: '1h'});
    res.status(200).send(token);
  }
  else res.status(401).send('Incorrect username or password');
});

router.post('/create', async function(req, res){
  const {user, pass} = req.body;

  if(!user || !pass)
    return res.status(400).send('user and pass are required');

  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(pass, salt);

  // try to put new user in redis
  const alreadyExists = await client.setnxAsync(user, hash) === 0;

  if(alreadyExists)
    return res.status(409).send('User already exists');

  res.status(201).send('User created!');
});

module.exports = router;
