const bcrypt = require('bcrypt');
const saltRounds = 10;


module.exports = {
  //encrypt password and create user in DB
  encrypt: function(username, email, password, res){
    bcrypt.hash(password, saltRounds, function(err, hash) {
      // Store hash in your password DB.
      //mongoManager here to fix heroku
      const mongoManager = require('./mongoManager.js');
      mongoManager.addUser(username, email, hash, function(result){
        if(result == "Success"){
          res.redirect('/login');
        }
        else {
          res.status(400).send({ message: result});
        }
      });
      console.log("User Added");
    });
  },
  //decrypt password and compare
  decrypt: function(password, hash, callback){
    bcrypt.compare(password, hash, function(err, result) {
      callback(result);
    });
  }
}
