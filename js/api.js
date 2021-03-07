var unirest = require("unirest");
const mongoManager = require('./mongoManager.js');
var {user, password, dbname, secretKey, apiKey, searchAPIkey} = require('../config.json');
const imageSearch = require('image-search-google');
const client = new imageSearch('92bdea160fd4dc820', searchAPIkey);
const options = {page:1};

module.exports = {
  getRandomRecipes: function(number, res){
    console.log("Getting New Recipes");
    let url = "https://api.spoonacular.com/recipes/random";
    var request = unirest("GET", url);
    request.query({
      "apiKey": apiKey,
      "number": number,
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
  },
  complexSearch: function(recipe_name, res){
    let url = "https://api.spoonacular.com/recipes/complexSearch";
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
  }
}
