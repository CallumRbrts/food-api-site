
//create request
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
//when server responds
req.onreadystatechange = function() {
  var txt = "";
  if (this.readyState == 4 && this.status == 200) {
    var response = this.responseText;
    document.getElementById("answer").innerHTML = response;
  }
  if(this.status == 202){
    //wait for db change to be made
    setTimeout(() => {  window.location.reload(); }, 1000);
  }
  if(this.status == 400){
    console.log("Invalid Login Details");
    document.getElementById("error").innerHTML = "Invalid Login Details";
  }
};

//admin button to force refresh of recipes
var refreshButton = document.getElementById('refresh');
refreshButton.onclick = function(e){
  var params = 'recipe=refresh';
  req.open('POST', "/?", true);
  req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.send(params);
}

//looks for all buttons with cookbook class
var allButtons = document.getElementsByClassName('cookbook');
console.log("Found", allButtons.length, "div which class starts with “button”.");
//gives each button a listener
for(var i = 0; i < allButtons.length; i++){
  allButtons[i].onclick = function(e){
    var recipe_name = e.target.parentNode.firstChild.innerHTML
    //change css onclick
    e.target.innerHTML = "Added!";
    e.target.classList.remove("btn-primary");
    e.target.classList.add("btn-outline-primary");
    e.target.classList.add("disabled");

    //create POST request
    var params = 'recipe=' + recipe_name;
    req.open('POST', "/?", true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.send(params);

  }
}
