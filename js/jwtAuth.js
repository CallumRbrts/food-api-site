const jwt = require("jsonwebtoken");
var {user,password,dname,secretKey} = require("../config.json");

module.exports = {
  verifyToken: function(req, res, next){
    //let token = req.cookies["x-access-token"];
    let session_token = req.session.x_access_token
  //  console.log(token);
    console.log(session_token);
    if (!session_token) {
      //res.status(403).send({ message: "No token provided!" });
      return res.redirect('/');
    }

  jwt.verify(session_token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
    //res.sendFile(__dirname+'/cookbook.html')

  });
},
  createToken: function(user){
    //add a delete function when user closes browser
    var token = jwt.sign({ id: user._id }, secretKey, {
      expiresIn: 86400 // 24 hours
    });
    return token;
  }
}
