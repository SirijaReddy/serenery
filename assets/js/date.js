/*var current = new Date()
var todaysdate = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`
var deliverydate =  `${current.getDate()+3}/${current.getMonth()+1}/${current.getFullYear()}`
return toda*/
var date = new Date();

var day = date.getDate();
var month = date.getMonth() + 1;
var year = date.getFullYear();

if (month < 10) month = "0" + month;
if (day < 10) day = "0" + day;

var today = year + "-" + month + "-" + day;       
document.getElementById("theDate").value = today;