var {user, password, dbname, secretKey, apiKey} = require('../config.json');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const uri = "mongodb+srv://"+user+":"+password+"@web-entreprise-systems.enfbr.mongodb.net/"+dbname+"?retryWrites=true&w=majority";
const jwtAuth = require('./jwtAuth.js');
const passwordEncrypt = require('./passwordEncrypt.js');

module.exports = {
  //adds json object to a collection
  addToDB: function(collection, myobj){
    MongoClient.connect(uri, async function(err,db){
      if(err) throw err;
      var dbo = db.db(dbname);
      var users = dbo.collection(collection);
      dbo.collection(collection).insert(myobj, function(err, res){
        if (err) throw err;
        if (myobj.length == undefined) {
          console.log(1 + " object inserted");
        }
        else{
          console.log(myobj.length + " object(s) inserted");
        }
      });
      db.close();
    });
  },
  //deletes all elements in a collection
  emptyCollection: function(collection){
    MongoClient.connect(uri, function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      dbo.collection(collection).deleteMany( { }, function(err, res){
        if (err) throw err;
        console.log("emptied the " + collection + " collection");
      });
      db.close();
    });
  },
  //returns all elements from a collection in a callback
  getFromDB: async function(collection, callback){
    MongoClient.connect(uri, async function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      var users = dbo.collection(collection);
      var elem = dbo.collection(collection).find();
      var elem_array = await elem.toArray();
      console.log("Collected " + elem_array.length + " recipes");
      db.close();
      return callback(elem_array);
    });
  },
  //checks if elem exists in collection
  searchDB: function(collection, id, callback){
    MongoClient.connect(uri, async function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      var elem = await dbo.collection(collection).findOne({id: id}) //await?
      db.close();
      if (elem == null) {
        return callback(false);
      }else{
        return callback(true);
      }
    });
  },
  //add a user to the db
  addUser: function(username, email, password, callback){
    MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     var existingUsername = users.find({ username: username });
     var existingEmail = users.find({ email: email });
     const allEmails = await existingEmail.toArray();
     const allUsernames = await existingUsername.toArray();
     //checks if user already exists
     if(allEmails.length > 0){
       console.log('Email in use');
       db.close();
       return callback("Failed! Email is already in use!");

     } else if (allUsernames.length > 0) {
       console.log('Username already taken');
       db.close();
       return callback("Failed! Username is already in use!");
     } else {
       console.log("User Doesn't Exist");
       var myobj = { username: username, email: email, password: password, cookbook: [], clicks_index: 0, clicks_alt: 0, role: "member"};
       dbo.collection("users").insertOne(myobj, function(err, res) {
         if (err) throw err;
         console.log("1 user inserted");
       });
       db.close();
       return callback("Success");
       //res.redirect('/login');
     }
   });
 },
 //checks users login details
 loginUser: function(email, password, callback){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     //find email then check password
     var existingUser = users.find({email: email});
     const allUsers = await existingUser.toArray();

     if (allUsers.length > 0) {
       //decrypt password and compare
       passwordEncrypt.decrypt(password, allUsers[0].password, function(result){
         if (result){
           console.log("Login Successful");
           db.close();
           return callback(true, allUsers[0]);
         }else{
           console.log('Password Incorrect');
           db.close();
           return callback(false);
         }
       });
     }else{
       console.log('Invalid Email');
       db.close();
       return callback(false);
     }
   });
 },
 //adds recipe to users cookbook
 addToUser: function(myobj, req){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     var existingUser = users.find({_id: ObjectId(req.session.user)});
     const allUsers = await existingUser.toArray();
     var currentUser = allUsers[0];
     var currCookbook = currentUser.cookbook;
     currCookbook.push(myobj);
     currentUser.cookbook = currCookbook;
     users.replaceOne({_id: ObjectId(req.session.user)},{username: currentUser.username, email: currentUser.email, password: currentUser.password, cookbook: currCookbook, clicks_index:currentUser.clicks_index, clicks_alt: currentUser.clicks_alt, role: currentUser.role});
     console.log("Added recipe to cookbook");
   });
 },
 //get all user information from the db
 getUserFromDB: function(id, callback){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var elem = dbo.collection("users").find({_id: ObjectId(id)});
     var user = await elem.toArray();
     user = user[0];
     callback(user);
   });
 },
 //add click to users account
 incrementClick: function(req, type){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     var existingUser = users.find({_id: ObjectId(req.session.user)});
     const allUsers = await existingUser.toArray();
     var currentUser = allUsers[0];
     var currCounter = 0;
     //checks which page the user clicked on and adds accordingly
     if(type == "page_clicks_index"){
        currCounter = currentUser.clicks_index;
        currCounter++;
        users.replaceOne({_id: ObjectId(req.session.user)},{username: currentUser.username, email: currentUser.email, password: currentUser.password, cookbook: currentUser.cookbook, clicks_index:currCounter, clicks_alt: currentUser.clicks_alt, role: currentUser.role});
     }else{
        currCounter = currentUser.clicks_alt;
        currCounter++;
        users.replaceOne({_id: ObjectId(req.session.user)},{username: currentUser.username, email: currentUser.email, password: currentUser.password, cookbook: currentUser.cookbook, clicks_index:currentUser.clicks_index, clicks_alt: currCounter, role: currentUser.role});
     }
     console.log("Counter Incremented");
   });
 },
 //removes recipe from users cookbook
 removeElem: function(index, req){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     var existingUser = users.find({_id: ObjectId(req.session.user)});
     const allUsers = await existingUser.toArray();
     var currentUser = allUsers[0];
     var currCookbook = currentUser.cookbook;
     currCookbook.splice(index, 1);
     currentUser.cookbook = currCookbook;
     users.replaceOne({_id: ObjectId(req.session.user)},{username: currentUser.username, email: currentUser.email, password: currentUser.password, cookbook: currCookbook, clicks_index:currentUser.clicks_index, clicks_alt: currentUser.clicks_alt, role: currentUser.role});
     console.log("Removed Recipe");
   });
 },
 //deletes User information
 deleteUser: function(req){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     var existingUser = users.remove({_id: ObjectId(req.session.user)});
   });
 }
}
