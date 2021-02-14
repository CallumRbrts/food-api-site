var express = require('express');
var app = express();
const expressValidator = require('express-validator');
var {user, password, dbname} = require('./config.json');
const PORT = process.env.PORT || 8080;



//app.use(__dirname+'/css', express.static('public'))

//Use to load static files like css
app.use(express.static(__dirname));
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://"+user+":"+password+"@web-entreprise-systems.enfbr.mongodb.net/"+dbname+"?retryWrites=true&w=majority";

var port = PORT;

app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});


var adminRouter = express.Router();
var basicRouter = express.Router();

//before .get
adminRouter.use(function(req,res,next){
  console.log("Admin Routes ", req.method, req.url);
  next();
});

basicRouter.use(function(req,res,next){
  console.log("Basic Routes: ", req.method, req.url);
  next();
});

adminRouter.param('name', function(req,res,next,name){
  console.log("validating my little pogchamp's name");

  req.params.name = name.charAt(0).toUpperCase() + name.slice(1);
  next();
});

basicRouter.get('/cookbook', function(req, res){
  res.sendFile(__dirname+'/cookbook.html')
});

adminRouter.get('/users', function(req,res){
  res.send('I show all the users');
});

adminRouter.get('/users/:name', function(req,res){
  res.send('Hello ' + req.params.name + '! Are you my little pogchamp?');
});

app.get( '/', function( req, res ) {
  res.sendFile( path.join( __dirname, 'css', 'index.html' ));
});

app.use('/admin', adminRouter);
app.use('/', basicRouter);


app.route('/login')
  .get(function(req,res){
    res.sendFile(__dirname+'/login.html');
      var output = 'getting the login! ';
      var username = req.query.username;
      var email = req.query['email'];
      var password = req.query.password
     //  if (typeof input1 != 'undefined' && typeof input2 != 'undefined') {
     //    output+=('There was input: ' + input1 + ' and ' + input2);
     //    res.send(output);
     // }
     console.log('Start the database stuff');
     console.log('The Params: ' + username + " " + email + " " + password);
     MongoClient.connect(uri, function(err, db){
       if(err) throw err;
       var dbo = db.db(dbname);
       var myobj = { username: username, email: email, password: password };
       dbo.collection("users").insertOne(myobj, function(err, res) {
         if (err) throw err;
         console.log("1 user inserted");
         db.close();
       });
       console.log('End of DB stuff');
     });
})
  .post(function(req,res){
    console.log('processing');
    res.send('processing login form!');
});

app.route('/register')
  .get(function(req,res){
    res.sendFile(__dirname+'/register.html');
   })
   .post(function(req,res){
     var username = req.query.username;
     var email = req.query['email'];
     var password = req.query.password



     console.log(email);
     res.send('processing register form!');
   });


app.listen(PORT);
console.log('Express server running at http://127.0.0.1:'+PORT+'/');
