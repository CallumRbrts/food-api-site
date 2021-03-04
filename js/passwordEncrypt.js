const bcrypt = require('bcrypt');
const saltRounds = 10;
const mongoManager = require('./mongoManager.js');


module.exports = {
  encrypt: function(username, email, password, res){
    console.log(password);
    bcrypt.hash(password, saltRounds, function(err, hash) {
      console.log(hash);
      // Store hash in your password DB.
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
  decrypt: function(password, hash, callback){

    bcrypt.compare(password, hash, function(err, result) {
      // result == true
      callback(result);
    });
  }
}
