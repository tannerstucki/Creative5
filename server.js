const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// Knex Setup
const env = process.env.NODE_ENV || 'development';
const config = require('./knexfile')[env];  
const knex = require('knex')(config);

// jwt setup
const jwt = require('jsonwebtoken');
let jwtSecret = process.env.jwtSecret;
//console.log(jwtSecret);
if (jwtSecret === undefined) {
  console.log("You need to define a jwtSecret environment variable to continue.");
  knex.destroy();
  process.exit();
};

// bcrypt setup
let bcrypt = require('bcrypt');
const saltRounds = 10;

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token)
    return res.status(403).send({ error: 'No token provided.' });
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if (err)
      return res.status(500).send({ error: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.userID = decoded.id;
    next();
  });
}

app.post('/api/login', (req, res) => {
  if (!req.body.email || !req.body.password)
    return res.status(400).send();
  knex('users').where('email',req.body.email).first().then(user => {
    if (user === undefined) {
      res.status(403).send("Invalid credentials");
      throw new Error('abort');
    }
    return [bcrypt.compare(req.body.password, user.hash),user];
  }).spread((result,user) => {
    //if (result)
      //res.status(200).json({user:{username:user.username,name:user.name,id:user.id}});
    //else
      //res.status(403).send("Invalid credentials");
    if (result) {
       let token = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: 86400 // expires in 24 hours
       });
      res.status(200).json({user:{username:user.username,name:user.name,id:user.id},token:token});
    } else {
       res.status(403).send("Invalid credentials");
    }
    return;
  }).catch(error => {
    if (error.message !== 'abort') {
      console.log(error);
      res.status(500).json({ error });
    }
  });
});

app.post('/api/users', (req, res) => {
  if (!req.body.email || !req.body.password || !req.body.username || !req.body.name)
    return res.status(400).send();
  knex('users').where('email',req.body.email).first().then(user => {
    if (user !== undefined) {
      res.status(403).send("Email address already exists");
      throw new Error('abort');
    }
    return knex('users').where('username',req.body.username).first();
  }).then(user => {
    if (user !== undefined) {
      res.status(409).send("User name already exists");
      throw new Error('abort');
    }
    return bcrypt.hash(req.body.password, saltRounds);
  }).then(hash => {
    return knex('users').insert({email: req.body.email, hash: hash, username:req.body.username,
				 name:req.body.name, role: 'user'});
  }).then(ids => {
    return knex('users').where('id',ids[0]).first().select('username','name','id');
  }).then(user => {
    //res.status(200).json({user:user});
    let token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).json({user:user,token:token});
    return;
  }).catch(error => {
    if (error.message !== 'abort') {
      console.log(error);
      res.status(500).json({ error });
    }
  });
});

app.get('/api/users/:id/things', (req, res) => {
  let id = parseInt(req.params.id);
  knex('users').join('things','users.id','things.user_id')
    .where('users.id',id)
    .orderBy('frequency','asc')
    .select('things.id','thing','username','name','created', 'price', 'quantity', 'frequency').then(things => {
      //console.log(things);
      res.status(200).json({things:things});
    }).catch(error => {
      res.status(500).json({ error });
    });
});

//app.post('/api/users/:id/things', (req, res) => {
  app.post('/api/users/:id/things', verifyToken, (req, res) => {
  let id = parseInt(req.params.id);
  if (id !== req.userID) {
    res.status(403).send();
    return;
  }
  //console.log(req.body.thing);
  //console.log(req.body.price);
  //console.log(req.body.quantity);
  //console.log(req.body.thing.frequency);
  knex('users').where('id',id).first().then(user => {
    return knex('things').insert({user_id: id, thing:req.body.thing, price:req.body.price, quantity:req.body.quantity, frequency:req.body.frequency, created: new Date()});
  }).then(ids => {
    return knex('things').where('id',ids[0]).first();
  }).then(thing => {
    res.status(200).json({thing:thing});
    return;
  }).catch(error => {
    console.log(error);
    res.status(500).json({ error });
  });
});

//app.delete('/api/users/:id/things/:thing_number', (req,res) => {
  app.delete('/api/users/:id/things/:thing_number', verifyToken, (req,res) => {
  //console.log(req.params);
  //console.log(req.params.id);
  //console.log(req.params.thing_number);
  // check this id
  let id = parseInt(req.params.id);
  let thing_id = parseInt(req.params.thing_number);
  if (id !== req.userID) {
    res.status(403).send();
    return;
  }
  knex('users').where('id',id).first().then(user => {
    return knex('users').where('id',thing_id).first();
  }).then(user => {
    return knex('things').where({'user_id':id,'id':thing_id}).first().del();
  }).then(ids => {
    res.sendStatus(200);
    return;
  }).catch(error => {
    console.log(error);
    res.status(500).json({error});
  });
});

app.put('/api/users/:id/things/:thing_number', (req,res) => {
  let id = parseInt(req.params.id);
  let thing_id = parseInt(req.params.thing_number);
  //console.log(req.body);
  //console.log(req.body.quantity);
  knex('users').where('id',id).first().then(user => {
    return knex('users').where('id',thing_id).first();
  }).then(user => {
    return knex('things').where({'user_id':id,'id':thing_id}).update({quantity: req.body.quantity});
  }).then(ids => {
    res.sendStatus(200);
    return;
  }).catch(error => {
    console.log(error);
    res.status(500).json({error});
  });
});

// Get my account
app.get('/api/me', verifyToken, (req,res) => {
  knex('users').where('id',req.userID).first().select('username','name','id').then(user => {
    res.status(200).json({user:user});
  }).catch(error => {
    res.status(500).json({ error });
  });
});

app.listen(3000, () => console.log('Server listening on port 3000!'));