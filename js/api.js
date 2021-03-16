var unirest = require("unirest");
const mongoManager = require('./mongoManager.js');
var {user, password, dbname, secretKey, apiKey, searchAPIkey, googleUser} = require('../config.json');
const imageSearch = require('image-search-google');
const client = new imageSearch(googleUser, searchAPIkey);
const options = {page:1};

module.exports = {
  //gets random recipes from spoonacular api
  getRandomRecipes: function(number, res){
    console.log("Getting New Recipes");
    let url = "https://api.spoonacular.com/recipes/random";
    var request = unirest("GET", url);
    //request params
    request.query({
      "apiKey": apiKey,
      "number": number,
      "includeNutrition": true
    });
    //result
    request.end(async function(res) {
       if (res.error) throw new Error(res.error);
       for (var y = 0; y < res.body.recipes.length; ++y){
         var recipe = res.body.recipes[y];
         //check if recipe has an image
         if(!("image" in recipe)){
           //uses created search engine to look for images with the recipe name
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
      //add these recipes to the dailyRecipes DB
       mongoManager.addToDB("dailyRecipes", res.body.recipes)
    });
  },
  //searches spoonacular api for recipe name and adds it to the users cookbook
  complexSearch: function(recipe_name, res, req){
    let url = "https://api.spoonacular.com/recipes/complexSearch";
    var request = unirest("GET", url);
    //params
    request.query({
      "apiKey": apiKey,
      "query": recipe_name,
      "number": 1,
      "addRecipeInformation" : true,
      "addRecipeNutrition": true
    });

    request.end(function(res) {
      var recipe = res.body.results[0];
      //get session user to add recipe to their cookbook
      mongoManager.getUserFromDB(req.session.user, function(user){
        var userCookbook = user.cookbook;
        var bool = false;
        //checks for duplicates
        for(var y = 0; y < userCookbook.length; ++y){
          if(userCookbook[y].title == recipe.title){
            console.log("Elem exists in collection");
            bool = true;
            break;
          }
        }
        if(!bool){
          console.log("Elem doesn't exist in collection");
          mongoManager.addToUser(recipe, req)
        }
      });
    });
  }
}
