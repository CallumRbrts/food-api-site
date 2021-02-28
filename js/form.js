var req;
if (window.XMLHttpRequest) {
    req = new XMLHttpRequest();
}
else if (window.ActiveXObject) {
    req = new ActiveXObject("Msxml2.XMLHTTP");
}
else {
    // Ajax not supported

}
req.onreadystatechange = function() {
  var txt = "";
  if (this.readyState == 4 && this.status == 200) {
    var response = this.responseText;
    console.log (response);
    document.getElementById("answer").innerHTML = response;
  }
};

var allButtons = document.getElementsByClassName('cookbook');
console.log("Found", allButtons.length, "div which class starts with “button”.");

for(var i = 0; i < allButtons.length; i++){
  allButtons[i].onclick = function(e){
    var recipe_name = e.target.parentNode.firstChild.innerHTML

    // req.open("GET", "/register?username=" + username + "&email=" + email + "&password=" + password, true);
    // req.send();

    var params = 'recipe=' + recipe_name;
    req.open('POST', "/?", true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.send(params);

  }
}
