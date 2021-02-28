//convert the index.ejs file to surround the button in a form and use the post funtion with the middleware
//I cannot do it like this because I can't access the back end from the front end
document.getElementById("cookbookButton").onclick = function(e){

      var recipe_name = e.target.parentNode.firstChild.innerHTML

      console.log(recipe_name);

      MongoClient.connect(uri, async function(err, db){
        if(err) throw err;
        var dbo = db.db(dbname);
        var users = dbo.collection("cookbook");
        var elem = dbo.collection("cookbook").find({ name: elem });
        var elem_array = await elem.toArray();
        console.log(elem_array);
        if(elem_array.length>0){
          console.log("Recipe Found");
          dbo.collection("cookbook").insertOne(elem_array[0],function(err, res) {
            if (err) throw err;
            console.log("Recipe added");
          });
        }
        db.close();
      });
}
