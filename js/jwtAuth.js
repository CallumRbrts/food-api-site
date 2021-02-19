const jwt = require("jsonwebtoken");
var {user,password,dname,secretKey} = require("../config.json");

module.exports = {
  verifyToken: function(req, res){
    let token = req.cookies["x-access-token"];
    console.log(token);
    if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    res.sendFile(__dirname+'/cookbook.html')

  });
},
  createToken: function(user){
    var token = jwt.sign({ id: user._id }, secretKey, {
      expiresIn: 86400 // 24 hours
    });
    return token;
  }
}
