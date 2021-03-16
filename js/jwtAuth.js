const jwt = require("jsonwebtoken");
var {user,password,dname,secretKey} = require("../config.json");

module.exports = {
  //verifies user's jsonwebtoken to authorize access to cookbook
  verifyToken: function(req, res, next){
    let session_token = req.session.x_access_token;
    if (!session_token) {
      console.log("No Session Token");
      return res.redirect('/');
    }

  jwt.verify(session_token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
},
  //creates jsonwebtoken token for user
  createToken: function(user){
    var token = jwt.sign({ id: user._id }, secretKey, {
      expiresIn: 86400 // 24 hours
    });
    return token;
  }
}
