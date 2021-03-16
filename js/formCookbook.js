
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
    //console.log(response);
    document.getElementById("answer").innerHTML = response;
  }
  if(this.status == 202){
    //wait for db change to be made
    setTimeout(() => {  window.history.back() }, 1000);
  }
};

//looks for all buttons with cookbook class
var allButtons = document.getElementsByClassName('cookbook');
console.log("Found", allButtons.length, "div which class starts with “button”.");
//gives each button a listener
for(var i = 0; i < allButtons.length; i++){
  allButtons[i].onclick = function(e){
    var recipe_name = e.target.parentNode.firstChild.innerHTML
    //change css onclick
    e.target.innerHTML = "Removed!";
    e.target.classList.remove("btn-danger");
    e.target.classList.add("btn-outline-danger");
    e.target.classList.add("disabled");

    //create POST request
    var params = 'recipe=' + recipe_name;
    req.open('POST', "/cookbook?", true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.send(params);

  }
}
