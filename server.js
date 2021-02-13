var express = require('express');
var app = express();
const PORT = process.env.PORT || 8080;

//const MongoClient = require('mongodb').MongoClient;
//const uri = "mongodb+srv://<user>:<passwd>@web-entreprise-systems.enfbr.mongodb.net/test?retryWrites=true&w=majority";

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


app.use('/admin', adminRouter);
app.use('/', basicRouter);


app.route('/login')
  .get(function(req,res){
    res.sendFile(__dirname+'/login.html');
      var output = 'getting the login! ';
      var input1 = req.query.input1;
      var input2 = req.query['input2'];
      if (typeof input1 != 'undefined' && typeof input2 != 'undefined') {
        output+=('There was input: ' + input1 + ' and ' + input2);
        res.send(output);
     }
     console.log('Start the database stuff');
     console.log('The Params: ' + input1 + " " + input2);
     MongoClient.connect(uri, function(err, db){
       if(err) throw err;
       var dbo = db.db("test");
       var myobj = { firstInput: input1, secondInput: input2 };
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



app.listen(PORT);
console.log('Express server running at http://127.0.0.1:'+PORT+'/');
