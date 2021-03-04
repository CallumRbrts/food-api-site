var express = require('express');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
var unirest = require("unirest");
var app = express();
var {user, password, dbname, secretKey, apiKey, searchAPIkey} = require('./config.json');
const imageSearch = require('image-search-google');
const client = new imageSearch('92bdea160fd4dc820', searchAPIkey);
const options = {page:1};
const mongoManager = require('./js/mongoManager.js');
const passwordEncrypt = require('./js/passwordEncrypt.js');
const expressValidator = require('express-validator');
var session = require('express-session');
const schedule = require('node-schedule');
const jwtAuth = require('./js/jwtAuth.js');
const MongoClient = require('mongodb').MongoClient;
const PORT = process.env.PORT || 8000;
const uri = "mongodb+srv://"+user+":"+password+"@web-entreprise-systems.enfbr.mongodb.net/"+dbname+"?retryWrites=true&w=majority";
var port = PORT;


//check if collected recipe has an image, if not either use a default image or run another recipe with an image
var j = schedule.scheduleJob({hour: 00, minute: 00}, async function(){
  console.log("Running Scheduled Job");
  await mongoManager.emptyCollection("dailyRecipes");
  let url = "https://api.spoonacular.com/recipes/random";
  var request = unirest("GET", url);
  request.query({
    "apiKey": apiKey,
    "number": 6,
    "includeNutrition": true
  });

  request.end(async function(res) {
     if (res.error) throw new Error(res.error);
     //console.log(res.body.recipes);

     for (var y = 0; y < res.body.recipes.length; ++y){
       var recipe = res.body.recipes[y];

       if(!("image" in recipe)){
         new_images = await client.search(recipe.title, options)
             .catch(error => console.log(error));
        try{
          recipe.image = new_images[0].url;
        }
        catch(err){
          console.log("image not found");
          recipe.image = "";
        }
      }
    }
     mongoManager.addToDB("dailyRecipes", res.body.recipes)
  });
});


//app.use(__dirname+'/css', express.static('public'))

//Use to load static files like css
app.use(express.static(__dirname));
app.use(cookieParser());
app.use(session({
  name: 'session',
  resave: true,
  saveUninitialized: true, //HttpOnly
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


    //result of get is return through a callback, so I need to do the dynamic html in the callback (variable can't be passed up due to async)
    mongoManager.getFromDB("dailyRecipes", function(result){
      //console.log(result);
      var recipes = [];


      for (let i = 0; i < result.length; ++i){
        //console.log(result[i].extendedIngredients[0]);
        var ingredients = "";
        for(let j= 0; j < result[i].extendedIngredients.length; ++j){
          var metric = result[i].extendedIngredients[j].measures.metric
          //console.log(metric.amount + " " + metric.unitShort + " " + result[i].extendedIngredients[j].originalName);
          var ingredient = '<li>'+ Math.round(metric.amount) + " " + metric.unitShort + " " + result[i].extendedIngredients[j].originalName + ' </li>';
          //ingredients.push(ingredient)
          ingredients += ingredient;
        }
        var instructions = "";
        for (let k = 0; k < result[i].analyzedInstructions[0]['steps'].length; ++k) {
          var instruction = '<li>' + result[i].analyzedInstructions[0]['steps'][k]['step'] + '</li>';
          instructions += instruction;
        }

        // for (ingredient in result[i].extendedIngredients){
        //   console.log(ingredient);
        //   ingredients.push('<li>'+ ingredient.originalString+ ' </li>')
        // }

        //change instructions display to analyzedInstructions
        var tagline = '<div class="col-md-6 col-lg-4 mb-5"><div class="portfolio-item mx-auto" data-toggle="modal" data-target="#portfolioModal'+i+'"><div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100"><div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div></div><img class="img-fluid" src="'+result[i].image+'" alt="" /></div></div>';
        var card ='<div class="portfolio-modal modal fade" id="portfolioModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="portfolioModal1Label" aria-hidden="true"><div class="modal-dialog modal-xl" role="document"><div class="modal-content"><button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fas fa-times"></i></span></button><div class="modal-body text-center"><div class="container"><div class="row justify-content-center"><div class="col-lg-8"><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">'+result[i].title+'</h2><div class="divider-custom"><div class="divider-custom-line"></div><div class="divider-custom-icon"><i class="fas fa-star"></i></div><div class="divider-custom-line"></div></div><img class="img-fluid rounded mb-5" src="'+result[i].image+'" alt="" /><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Ingredients</h2><p class="mb-5"><ul>'+ingredients+'</ul></p></br><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Instructions</h2></br><p style="text-align: center;" class="mb-5"><ol>'+instructions+'</ol></p><button id="cookbookButton" class="btn btn-primary cookbook"><i class="fas fa-times fa-fw"></i>Add to Cookbook</button></div></div></div></div></div></div></div>'

        recipes.push([tagline, card]);
      }

      //console.log(recipes);

      res.render(__dirname+'/index.ejs',{
        recipes: recipes
      });

    });
    //console.log(recipes);
    //const tagline = '<div class="col-md-6 col-lg-4 mb-5"><div class="portfolio-item mx-auto" data-toggle="modal" data-target="#portfolioModal1"><div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100"><div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div></div><img class="img-fluid" src="assets/img/portfolio/cabin.png" alt="" /></div></div>';
  })
  .post(function(req,res){
    var recipe_name = req.body.recipe
    console.log(recipe_name);
    //could get recipe from DB, this would save on API requests
    //but it would create a bug in which the user wouldn't be able to add
    //a recipe to their cookbook at midnight when the new daily recipes are generated
    //this is because I delete the collection at the end of every day
    let url = "https://api.spoonacular.com/recipes/complexSearch"
    var request = unirest("GET", url);
    request.query({
      "apiKey": apiKey,
      "query": recipe_name,
      "number": 1,
      "addRecipeInformation" : true,
      "addRecipeNutrition": true
    });

    request.end(async function(res) {
      console.log(res.body);
      //console.log(res.body.results[0].analyzedInstructions);
      var recipe = res.body.results[0];
      mongoManager.searchDB("cookbook", recipe.id, function(bool){
        if (bool) {
          console.log("Elem exists in collection");
        } else {
          console.log("Elem doesn't exist in collection");
          mongoManager.addToDB("cookbook", recipe);
        }
      });
    });
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

//SSL cloudflare?
app.route('/login')
  .get(function(req,res){
    res.sendFile(__dirname+'/login.html');

      var output = 'getting the login! ';
})
  .post(function(req,res){
    console.log('processing');
    var email = req.body.email;
    var password = req.body.password;
    mongoManager.loginUser(email, password, function(result, user = null){
      if(result){
        token = jwtAuth.createToken(user);
        console.log({
          id: user._id,
          username: user.username,
          email: user.email,
          accessToken: token
        });
        req.session.x_access_token = token;
        res.redirect('/cookbook');
      }else{
        console.log("Invalid Login Details");
        //res.status(400).send({ message: "Invalid Login Details" });
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
     passwordEncrypt.encrypt(username, email, password, res);
   });

function addToDB(dbo, myobj, collection) {
    dbo.collection(collection).insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log("1 user inserted");
    });
}

app.listen(PORT);
console.log('Express server running at http://127.0.0.1:'+PORT+'/');
