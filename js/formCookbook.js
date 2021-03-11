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
    console.log(response);
    document.getElementById("answer").innerHTML = response;
  }
  if(this.status == 202){
    //wait for db change to be made
    setTimeout(() => {  window.location.reload(); }, 1000);
  }
};

//This button shouldn't exist normally as it would constantly change the DB for each user that clicks on it, it is mearly for testing purposes
var refreshButton = document.getElementById('delete');
refreshButton.onclick = function(e){
  var params = 'recipe=delete';
  req.open('POST', "/cookbook?", true);
  req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.send(params);
  console.log(params);
  //window.location.reload();
}

var allButtons = document.getElementsByClassName('cookbook');
console.log("Found", allButtons.length, "div which class starts with “button”.");
for(var i = 0; i < allButtons.length; i++){
  allButtons[i].onclick = function(e){
    var recipe_name = e.target.parentNode.firstChild.innerHTML
    e.target.innerHTML = "Removed!";
    e.target.classList.remove("btn-danger");
    e.target.classList.add("btn-outline-danger");
    e.target.classList.add("disabled");

    // req.open("GET", "/register?username=" + username + "&email=" + email + "&password=" + password, true);
    // req.send();
    //console.log(recipe_name);
    var params = 'recipe=' + recipe_name;
    req.open('POST', "/cookbook?", true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.send(params);

  }
}
