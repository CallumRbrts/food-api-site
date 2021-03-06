var express = require('express');
const cookieParser = require('cookie-parser');
var app = express();
var {user, password, dbname, secretKey, apiKey, searchAPIkey} = require('./config.json');
const mongoManager = require('./js/mongoManager.js');
const passwordEncrypt = require('./js/passwordEncrypt.js');
const expressValidator = require('express-validator');
var session = require('express-session');
const schedule = require('node-schedule');
const jwtAuth = require('./js/jwtAuth.js');
const api = require('./js/api.js');
const MongoClient = require('mongodb').MongoClient;
const PORT = process.env.PORT || 8000;
const uri = "mongodb+srv://"+user+":"+password+"@web-entreprise-systems.enfbr.mongodb.net/"+dbname+"?retryWrites=true&w=majority";
var port = PORT;

//scheduled Job that refreshes recipes daily at midnight
var j = schedule.scheduleJob({hour: 00, minute: 00}, async function(res){
  console.log("Running Scheduled Job");
  await mongoManager.emptyCollection("dailyRecipes");
  api.getRandomRecipes(6, res);
});


//Use to load static files like css
app.use(express.static(__dirname));
app.use(cookieParser());
app.use(session({ //ask about position of this
  name: 'session',
  resave: true,
  saveUninitialized: true, //HttpOnly
  secret: secretKey,
  login: false,
  special: false,
}));
//declare as ejs
app.set('view engine', 'ejs');

//since the content type of our form is set to x-www-form-urlencoded we need to add this
app.use(express.urlencoded({
  extended: true
}));

//main page
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

    //change button if logged in
    if(req.session.login){
      var loginButton = '<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="/logout">Logout</a></li>'
    }else {
      var loginButton = '<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="/login">Login</a></li>'
    }

    //load refresh button if admin user
    if(req.session.special){
      var refreshButton = '<div class="col text-center"><button id="refresh" class="btn btn-primary btn-lg">Refresh Recipes</button></div>';
    }else {
      var refreshButton ='<div class="col text-center" id="refresh"></div>';
    }
    //result of get is return through a callback, so I need to do the dynamic html in the callback (variable can't be passed up due to async)
    mongoManager.getFromDB("dailyRecipes", function(result){
      var recipes = [];
      //parse results and create html to render
      for (let i = 0; i < result.length; ++i){
        var ingredients = "";
        for(let j= 0; j < result[i].extendedIngredients.length; ++j){
          var metric = result[i].extendedIngredients[j].measures.metric;
          var ingredient = '<li>'+ Math.round(metric.amount) + " " + metric.unitShort + " " + result[i].extendedIngredients[j].originalName + ' </li>';
          ingredients += ingredient;
        }
        var instructions = "";
        try {
          for (let k = 0; k < result[i].analyzedInstructions[0]['steps'].length; ++k) {
            var instruction = '<li>' + result[i].analyzedInstructions[0]['steps'][k]['step'] + '</li>';
            instructions += instruction;
          }
        } catch (e) {
          var instructions = "none provided";
        }
        if(req.session.login){
          var tagline = '<div class="col-md-6 col-lg-4 mb-5"><div class="portfolio-item mx-auto" data-toggle="modal" data-target="#portfolioModal'+i+'"><div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100"><div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div></div><img class="img-fluid" src="'+result[i].image+'" alt="" /></div></div>';
          var card ='<div class="portfolio-modal modal fade" id="portfolioModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="portfolioModal1Label" aria-hidden="true"><div class="modal-dialog modal-xl" role="document"><div class="modal-content"><button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fas fa-times"></i></span></button><div class="modal-body text-center"><div class="container"><div class="row justify-content-center"><div class="col-lg-8"><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">'+result[i].title+'</h2><div class="divider-custom"><div class="divider-custom-line"></div><div class="divider-custom-icon"><i class="fas fa-star"></i></div><div class="divider-custom-line"></div></div><img class="img-fluid rounded mb-5" src="'+result[i].image+'" alt="" /><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Ingredients</h2><p class="mb-5"><ul>'+ingredients+'</ul></p></br><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Instructions</h2></br><p style="text-align: center;" class="mb-5"><ol>'+instructions+'</ol></p><button id="cookbookButton" class="btn btn-primary cookbook"><i class="fas fa-times fa-fw"></i>Add to Cookbook</button></div></div></div></div></div></div></div>';
        }else{
          var tagline = '<div class="col-md-6 col-lg-4 mb-5"><div class="portfolio-item mx-auto" data-toggle="modal" data-target="#portfolioModal'+i+'"><div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100"><div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div></div><img class="img-fluid" src="'+result[i].image+'" alt="" /></div></div>';
          var card ='<div class="portfolio-modal modal fade" id="portfolioModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="portfolioModal1Label" aria-hidden="true"><div class="modal-dialog modal-xl" role="document"><div class="modal-content"><button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fas fa-times"></i></span></button><div class="modal-body text-center"><div class="container"><div class="row justify-content-center"><div class="col-lg-8"><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">'+result[i].title+'</h2><div class="divider-custom"><div class="divider-custom-line"></div><div class="divider-custom-icon"><i class="fas fa-star"></i></div><div class="divider-custom-line"></div></div><img class="img-fluid rounded mb-5" src="'+result[i].image+'" alt="" /><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Ingredients</h2><p class="mb-5"><ul>'+ingredients+'</ul></p></br><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Instructions</h2></br><p style="text-align: center;" class="mb-5"><ol>'+instructions+'</ol></p></div></div></div></div></div></div></div>';
        }
        recipes.push([tagline, card]);
      }
      //render ejs
      res.render(__dirname+'/index.ejs',{
        recipes: recipes,
        loginButton: loginButton,
        refreshButton: refreshButton
      });

    });
  })
  .post(function(req,res){
    var recipe_name = req.body.recipe;
    //if clicked on refresh button
    if(recipe_name == 'refresh'){
      mongoManager.emptyCollection("dailyRecipes");
      api.getRandomRecipes(6, res);
      res.status(202).send();
    }else{
      //could get recipe from DB, this would save on API requests
      //but it would create a bug in which the user wouldn't be able to add
      //a recipe to their cookbook at midnight when the new daily recipes are generated
      //this is because I delete the collection at the end of every day
      api.complexSearch(recipe_name, res, req);
      //gets all recipes that have been clicked on and increments the total number of adds to users cookbooks
      mongoManager.getFromDB("cookbook", function(results){
        var toAdd = true;
        for(let n = 0; n<results.length; n++){
          if(results[n].name == recipe_name){
            console.log(recipe_name);
            var adds = results[n].clicks;
            adds++;
            MongoClient.connect(uri, async function(err, db){
              if(err) throw err;
              var dbo = db.db(dbname);
              var users = dbo.collection("cookbook");
              users.replaceOne({name: recipe_name}, {name: recipe_name, clicks: adds});
              db.close();
            });
            toAdd = false;
          }
        }
        if(toAdd){
          let obj = {name: recipe_name, clicks: 1};
          mongoManager.addToDB("cookbook", obj);
        }
        console.log(results.length);
        if(results.length == 0){
          let obj = {name: recipe_name, clicks: 1};
          mongoManager.addToDB("cookbook", obj);
        }
      });
    }
    //increment click for this page
    mongoManager.incrementClick(req, "page_clicks_index");
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

//checks users token before redirecting to cookbook page
basicRouter.get('/cookbook',[jwtAuth.verifyToken], function(req, res){

  var loginButton = '<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="/logout">Logout</a></li>'
  //get users clicks and recipes and renders them
  mongoManager.getUserFromDB(req.session.user, function(result){
    var indexCounter = result.clicks_index;
    var altCounter = result.clicks_alt;
    result = result.cookbook;
    mongoManager.getFromDB("cookbook", function(cookbookResults){
      var recipes = [];
      for (let n = 0; n < cookbookResults.length; ++n){
        for (let i =0; i<result.length; ++i ){
          if(cookbookResults[n].name == result[i].title){
            result[i].clicks = cookbookResults[n].clicks;
            break;
          }
        }
      }
      for (let i = 0; i < result.length; ++i){
        if(result[i].clicks == undefined){
          result[i].clicks = 0;
        }
        var ingredients = "";
        for(let j= 0; j < result[i].nutrition.ingredients.length; ++j){
          var metric = result[i].nutrition.ingredients[j];
          var ingredient = '<li>'+ metric.amount + " " + metric.unit + " " + metric.name + '</li>';
          ingredients += ingredient;
        }
        var instructions = "";
        try {
          for (let k = 0; k < result[i].analyzedInstructions[0]['steps'].length; ++k) {
            var instruction = '<li>' + result[i].analyzedInstructions[0]['steps'][k]['step'] + '</li>';
            instructions += instruction;
          }
        } catch (e) {
          var instructions = "none provided";
        }
        var card ='<div class="portfolio-modal modal fade" id="portfolioModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="portfolioModal1Label" aria-hidden="true"><div class="modal-dialog modal-xl" role="document"><div class="modal-content"><button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fas fa-times"></i></span></button><div class="modal-body text-center"><div class="container"><div class="row justify-content-center"><div class="col-lg-8"><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">'+result[i].title+'</h2><div class="divider-custom"><div class="divider-custom-line"></div><div class="divider-custom-icon"><i class="fas fa-star"></i></div><div class="divider-custom-line"></div></div><img class="img-fluid rounded mb-5" src="'+result[i].image+'" alt="" /><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Ingredients</h2><p class="mb-5"><ul>'+ingredients+'</ul></p></br><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Instructions</h2></br><p style="text-align: center;" class="mb-5"><ol>'+instructions+'</ol></p><button id="cookbookButton" class="btn btn-primary cookbook"><i class="fas fa-times fa-fw"></i>Add to Cookbook</button></div></div></div></div></div></div></div>';
        var tagline = '<div class="card mb-3"><div class="card-body"><h5 class="card-title">'+result[i].title+'</h5><div class="float-container"><div class="float-child"><ul>'+ingredients+'</ul></div><div class="float-child">Added to '+result[i].clicks+' cookbook(s) </div><div class="float-child"><img class="img" src="'+result[i].image+'" alt="" /></div></div></br><button id="cookbookButton" class="btn btn-danger cookbook"><i class="fas fa-times fa-fw"></i>Remove from Cookbook</button></div></div>';
        recipes.push([tagline, card]);
      }

      if(result.length == 0){
        recipes.push(['<div class="card mb-3"><div class="card-body"><h5 class="card-title">No Recipes Added</h5></div></div>',"none"])
      }
      res.render(__dirname+'/cookbook.ejs',{
        recipes: recipes,
        clicks_index: indexCounter,
        clicks_alt: altCounter,
        loginButton: loginButton
      });
    });
  });
});

basicRouter.post('/cookbook',[jwtAuth.verifyToken], function(req, res){
  var recipe_name = req.body.recipe
  //checks if user wants to delete account
  if(recipe_name == "delete"){
    mongoManager.deleteUser(req);
    res.status(202).send();

  }else{
    //remove clicked elem from cookbook
    mongoManager.getUserFromDB(req.session.user, function(user){
      var userCookbook = user.cookbook;
      for(var y = 0; y < userCookbook.length; ++y){
        if(userCookbook[y].title == recipe_name){
          //remove
          mongoManager.removeElem(y, req);
          break;
        }
      }
    });
  }
});


app.get('/', function( req, res ) {
  res.sendFile( path.join( __dirname, 'css', 'index.html' ));
});

app.use('/admin', adminRouter);
app.use('/', basicRouter);

//SSL cloudflare?
app.route('/login')
  .get(function(req,res){
    res.sendFile(__dirname+'/login.html');
})
  .post(function(req,res){
    console.log('processing');
    var email = req.body.email;
    var password = req.body.password;
    //checks users details and updates session accordingly
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
        req.session.user = user._id;
        req.session.login = true;
        if(user.role == "admin"){
          req.session.special = true;
        }
        res.redirect('/cookbook');
      }else{
        console.log("Invalid Login Details");
        res.status(403).send({ message: "Invalid Login Details" });
      }
    });
});

//removes all users session info when loggin out
app.route('/logout')
  .get(function(req, res){
    req.session.user = "";
    req.session.login = false;
    req.session.x_access_token = "";
    req.session.special = false;
    res.redirect('/');
  });

//register page for users
app.route('/register')
  .get(function(req,res){
    res.sendFile(__dirname+'/register.html');
   })
   .post(function(req,res){
     var username = req.body.username;
     var email =  req.body.email;
     var password = req.body.password;
     //encrypts password and checks for existing user
     passwordEncrypt.encrypt(username, email, password, res);
   });

//alternative page
app.route('/altIndex')
  .get(function (req,res){
    if(req.session.page_views){
     req.session.page_views++;
     console.log("You visited this page " + req.session.page_views + " times");
   }else{
     req.session.page_views = 1;
     console.log("Welcome to this page for the first time!");
   }

   if(req.session.login){
     var loginButton = '<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="/logout">Logout</a></li>'
   }else {
     var loginButton = '<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="/login">Login</a></li>'
   }

   if(req.session.special){
     var refreshButton = '<div class="col text-center"><button id="refresh" class="btn btn-primary btn-lg">Refresh Recipes</button></div>';
   }else {
     var refreshButton ='<div class="col text-center" id="refresh"></div>';
   }

    // respond with the session object
    console.log(req.session);
    //result of get is return through a callback, so I need to do the dynamic html in the callback (variable can't be passed up due to async)
    mongoManager.getFromDB("dailyRecipes", function(result){
      var recipes = [];
      //parses json and creates html to be rendered
      for (let i = 0; i < result.length; ++i){
        var ingredients = "";
        for(let j= 0; j < result[i].extendedIngredients.length; ++j){
          var metric = result[i].extendedIngredients[j].measures.metric;
          var ingredient = '<li>'+ Math.round(metric.amount) + " " + metric.unitShort + " " + result[i].extendedIngredients[j].originalName + ' </li>';
          ingredients += ingredient;
        }
        var instructions = "";
        try {
          for (let k = 0; k < result[i].analyzedInstructions[0]['steps'].length; ++k) {
            var instruction = '<li>' + result[i].analyzedInstructions[0]['steps'][k]['step'] + '</li>';
            instructions += instruction;
          }
        } catch (e) {
          var instructions = "none provided";
        }
        if(req.session.login){
          var card ='<div class="portfolio-modal modal fade" id="portfolioModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="portfolioModal1Label" aria-hidden="true"><div class="modal-dialog modal-xl" role="document"><div class="modal-content"><button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fas fa-times"></i></span></button><div class="modal-body text-center"><div class="container"><div class="row justify-content-center"><div class="col-lg-8"><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">'+result[i].title+'</h2><div class="divider-custom"><div class="divider-custom-line"></div><div class="divider-custom-icon"><i class="fas fa-star"></i></div><div class="divider-custom-line"></div></div><img class="img-fluid rounded mb-5" src="'+result[i].image+'" alt="" /><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Ingredients</h2><p class="mb-5"><ul>'+ingredients+'</ul></p></br><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Instructions</h2></br><p style="text-align: center;" class="mb-5"><ol>'+instructions+'</ol></p><button id="cookbookButton" class="btn btn-primary cookbook"><i class="fas fa-times fa-fw"></i>Add to Cookbook</button></div></div></div></div></div></div></div>';
          var tagline = '<div class="card mb-3"><div class="card-body"><h5 class="card-title">'+result[i].title+'</h5><div class="float-container"><div class="float-child"><ul>'+ingredients+'</ul></div><div class="float-child"><img class="img" src="'+result[i].image+'" alt="" /></div></div></br><button id="cookbookButton" class="btn btn-primary cookbook">Add to Cookbook</button></div></div>';
        }else{
          var card ='<div class="portfolio-modal modal fade" id="portfolioModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="portfolioModal1Label" aria-hidden="true"><div class="modal-dialog modal-xl" role="document"><div class="modal-content"><button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fas fa-times"></i></span></button><div class="modal-body text-center"><div class="container"><div class="row justify-content-center"><div class="col-lg-8"><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">'+result[i].title+'</h2><div class="divider-custom"><div class="divider-custom-line"></div><div class="divider-custom-icon"><i class="fas fa-star"></i></div><div class="divider-custom-line"></div></div><img class="img-fluid rounded mb-5" src="'+result[i].image+'" alt="" /><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Ingredients</h2><p class="mb-5"><ul>'+ingredients+'</ul></p></br><h2 class="portfolio-modal-title text-secondary text-uppercase mb-0" id="portfolioModal1Label">Instructions</h2></br><p style="text-align: center;" class="mb-5"><ol>'+instructions+'</ol></p><button id="cookbookButton" class="btn btn-primary cookbook"><i class="fas fa-times fa-fw"></i>Add to Cookbook</button></div></div></div></div></div></div></div>';
          var tagline = '<div class="card mb-3"><div class="card-body"><h5 class="card-title">'+result[i].title+'</h5><div class="float-container"><div class="float-child"><ul>'+ingredients+'</ul></div><div class="float-child"><img class="img" src="'+result[i].image+'" alt="" /></div></div></br></div></div>';
        }
        recipes.push([tagline, card]);
      }
      //render ejs
      res.render(__dirname+'/altIndex.ejs',{
        recipes: recipes,
        loginButton: loginButton,
        refreshButton: refreshButton
      });

    });
  })
  .post(function(req,res){
    var recipe_name = req.body.recipe;
    //checks if refresh button was clicked
    if(recipe_name == 'refresh'){
      mongoManager.emptyCollection("dailyRecipes");
      api.getRandomRecipes(6, res);
      res.status(202).send();
    }else{
      api.complexSearch(recipe_name, res, req);
      //adds clicked recipe to cookbook and checks for duplicates
      mongoManager.getFromDB("cookbook", function(results){
        var toAdd = true;
        for(let n = 0; n<results.length; n++){
          if(results[n].name == recipe_name){
            console.log(recipe_name);
            var adds = results[n].clicks;
            adds++;
            MongoClient.connect(uri, async function(err, db){
              if(err) throw err;
              var dbo = db.db(dbname);
              var users = dbo.collection("cookbook");
              users.replaceOne({name: recipe_name}, {name: recipe_name, clicks: adds});
              db.close();
            });
            toAdd = false;
          }
        }
        if(toAdd){
          let obj = {name: recipe_name, clicks: 1};
          mongoManager.addToDB("cookbook", obj);
        }
        console.log(results.length);
        if(results.length == 0){

          let obj = {name: recipe_name, clicks: 1};
          mongoManager.addToDB("cookbook", obj);
        }
      });
    }
    //increment click for this page
    mongoManager.incrementClick(req, "page_clicks_alt");
  });

app.listen(PORT);
console.log('Express server running at http://127.0.0.1:'+PORT+'/');
