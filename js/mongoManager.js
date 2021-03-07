var {user, password, dbname, secretKey, apiKey} = require('../config.json');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const uri = "mongodb+srv://"+user+":"+password+"@web-entreprise-systems.enfbr.mongodb.net/"+dbname+"?retryWrites=true&w=majority";
const jwtAuth = require('./jwtAuth.js');
const passwordEncrypt = require('./passwordEncrypt.js');

module.exports = {
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
  emptyCollection: function(collection){
    MongoClient.connect(uri, async function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      dbo.collection(collection).deleteMany( { }, function(err, res){
        if (err) throw err;
        console.log("emptied the " + collection + " collection");
      });
      db.close();
    });
  },
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
  searchDB: async function(collection, id, callback){
    MongoClient.connect(uri, async function(err, db){
      if(err) throw err;
      var dbo = db.db(dbname);
      var elem = await dbo.collection(collection).findOne({id: id})
      console.log(elem);
      db.close();
      if (elem == null) {
        return callback(false);
      }else{
        return callback(true);
      }
    });
  },
  addUser: function(username, email, password, callback){
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
       return callback("Failed! Email is already in use!");
       //res.status(400).send({ message: "Failed! Email is already in use!" });
       //res.redirect('/register');

     } else if (allUsernames.length > 0) {
       console.log('Username already taken');
       db.close();
      // res.status(400).send({ message: "Failed! Username is already in use!" });
       return callback("Failed! Username is already in use!");
     } else {
       console.log("User Doesn't Exist");
       var myobj = { username: username, email: email, password: password, cookbook: []};
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
 loginUser: function(email, password, callback){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     var existingUser = users.find({email: email});
     const allUsers = await existingUser.toArray();
     console.log(allUsers);
     if (allUsers.length > 0) {
       passwordEncrypt.decrypt(password, allUsers[0].password, function(result){
         if (result){
           console.log("Login Successful");
          // token = jwtAuth.createToken(allUsers[0]);
           db.close();
           return callback(true, allUsers[0]);
           // console.log({
           //   id: allUsers[0]._id,
           //   username: allUsers[0].username,
           //   email: allUsers[0].email,
           //   accessToken: token
           // });
           // req.session.x_access_token = token;
           // res.redirect('/cookbook');
         }else{
           console.log('Password Incorrect');
           db.close();
           return callback(false);
           //res.status(400).send({ message: "Invalid Login Details" });
         }
       });
     }else{
       console.log('Invalid Email');
       db.close();
       return callback(false);
       //res.status(400).send({ message: "Invalid Login Details" });
     }
   });
 },
 addToUser: function(myobj, req){
   console.log(req.session.user);
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var users = dbo.collection("users");
     //add if elem exists
     var existingUser = users.find({_id: ObjectId(req.session.user)});
     const allUsers = await existingUser.toArray();
     var currentUser = allUsers[0];
     var currCookbook = currentUser.cookbook;
     currCookbook.push(myobj);
     currentUser.cookbook = currCookbook;
     console.log(currentUser);
     users.replaceOne({_id: ObjectId(req.session.user)},{username: currentUser.username, email: currentUser.email, password: currentUser.password, cookbook: currCookbook});
     //users.findAndModify({query: {_id: req.session.user }, update: {cookbook: }});
     console.log("Added recipe to cookbook");
   });
 },
 getUserFromDB: function(id, callback){
   MongoClient.connect(uri, async function(err, db){
     if(err) throw err;
     var dbo = db.db(dbname);
     var elem = dbo.collection("users").find({_id: ObjectId(id)});
     var user = await elem.toArray();
     user = user[0];
     callback(user);
   });
 }
}
