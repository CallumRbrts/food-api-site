var express = require('express');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
var unirest = require("unirest");
var app = express();
const mongoManager = require('./js/mongoManager.js');
const expressValidator = require('express-validator');
var session = require('express-session');
const schedule = require('node-schedule');
const jwtAuth = require('./js/jwtAuth.js');
const MongoClient = require('mongodb').MongoClient;
var {user, password, dbname, secretKey, apiKey} = require('./config.json');
const PORT = process.env.PORT || 8000;
const uri = "mongodb+srv://"+user+":"+password+"@web-entreprise-systems.enfbr.mongodb.net/"+dbname+"?retryWrites=true&w=majority";
var port = PORT;


//app.use(__dirname+'/css', express.static('public'))

//Use to load static files like css
app.use(express.static(__dirname));
app.use(cookieParser());
app.use(session({
  name: 'session',
  resave: true,
  saveUninitialized: true,
  secret: secretKey,
 }));
app.use(flash());
app.set('view engine', 'ejs');



//app.use(express.json())
//since the content type of our form is set to x-www-form-urlencoded we need to add this
app.use(express.urlencoded({
  extended: true
}));


// app.get('/', function(req, res){
//   res.render(__dirname+'/index.html');
// });

app.route('/')
  .get(function (req,res){
    if(req.session.page_views){
     req.session.page_views++;
     console.log("You visited this page " + req.session.page_views + " times");
   }else{
     req.session.page_views = 1;
     console.log("Welcome to this page for the first time!");
   }
    // respond with the session object
    console.log(req.session);


    var j = schedule.scheduleJob({hour: 00, minute: 00}, function(){
      mongoManager.emptyCollection("dailyRecipes");
      let url = "https://api.spoonacular.com/recipes/random";
      var request = unirest("GET", url);
      request.query({
        "apiKey": apiKey,
  	    "number": 2,
        "includeNutrition": true
      });

      request.end(function(res) {
  	     if (res.error) throw new Error(res.error);
  	     console.log(res.body.recipes);
         mongoManager.addToDB("dailyRecipes", res.body.recipes)
      });
    });


    res.render(__dirname+'/index.ejs');
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

basicRouter.get('/cookbook',[jwtAuth.verifyToken], function(req, res){
  //var token = req.cookies["x-access-token"];
  //console.log(token);

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
})
  .post(function(req,res){
    console.log('processing');
    var email = req.body.email;
    var password = req.body.password;

    MongoClient.connect(uri, async function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      var users = dbo.collection("users");
      var existingUser = users.find({ email: email, password: password});
      //var existingUser = users.find({$and:[{email: email},{password:password}]});

      const allUsers = await existingUser.toArray();
      console.log(allUsers);
      if (allUsers.length > 0) {
        console.log('Login Successful');
        // var token = jwt.sign({ id: allUsers[0]._id }, secretKey, {
        //   expiresIn: 86400 // 24 hours
        // });
        token = jwtAuth.createToken(allUsers[0]);
        db.close();
        console.log({
          id: allUsers[0]._id,
          username: allUsers[0].username,
          email: allUsers[0].email,
          accessToken: token
        });
        //Attempting to use session instead of cookies - Both seem to work
        //I have decided to try and use session instead of cookies as they are safer
        //Session is safer for storing user data because it can not be modified by the end-user and
        //can only be set on the server-side.
        //Cookies on the other hand can be hijacked because they are just stored on the browser
        
        //res.cookie('x-access-token',token);
        //res.clearCookie('x-access-token')
        req.session.x_access_token = token;

        res.redirect('/cookbook');

      }else{
        console.log('Username already taken');
        db.close();
        res.status(400).send({ message: "Invalid Login Details" });
      }

    });
});

app.route('/register')
  .get(function(req,res){
    res.sendFile(__dirname+'/register.html');
   })
   .post(function(req,res){
     var username = req.body.username;
     var email =  req.body.email;//another possibility req.params['email']
     var password = req.body.password;
     MongoClient.connect(uri, async function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      var users = dbo.collection("users");
      var existingUsername = users.find({ username: username });
      var existingEmail = users.find({ email: email });
      const allEmails = await existingEmail.toArray();
      const allUsernames = await existingUsername.toArray();
      console.log(allEmails);
      console.log(allUsernames);
      if(allEmails.length > 0){
        console.log('Email in use');
        db.close();
        res.status(400).send({ message: "Failed! Email is already in use!" });
        //res.redirect('/register');


      } else if (allUsernames.length > 0) {
        console.log('Username already taken');
        db.close();
        res.status(400).send({ message: "Failed! Username is already in use!" });

      } else {
        console.log("User Doesn't Exist");
        var myobj = { username: username, email: email, password: password };
        dbo.collection("users").insertOne(myobj, function(err, res) {
          if (err) throw err;
          console.log("1 user inserted");
        });
        db.close();
        res.redirect('/login');
      }
     });


     console.log('The Register Params: ' + username + " " + email + " " + password);
     //res.send('processing register form!');
   });

function addToDB(dbo, myobj, collection) {
    dbo.collection(collection).insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log("1 user inserted");
    });
}

app.listen(PORT);
console.log('Express server running at http://127.0.0.1:'+PORT+'/');
