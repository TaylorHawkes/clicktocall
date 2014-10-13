clicktocall
===========

Website button that allows visitors to call the website owner in there browser. 

<h1>RingRoost ClickToCall</h1>

<p>RingRoost ClickToCall is a html button that allows website visitors to call you directly from their browser. The button can be installed on any website, and is currently compatible with all major browsers (Chrome, Firefox, IE, Safari, Opera). </p>


<p>Give it a try:<p>

<div notsupported_text="<a href='tel:17043436748'>Call Us: 704.343.6748 </a>"
text="Talk To Agent Now" 
call="17043436748"
id="ringroost_c2c" 
class="rr_blue"></div>


<p>You can see another working example at:<a href="http://www.ringroost.com/click2call.php"> http://www.ringroost.com/click2call.php</a></p>

<h1>Installation </h1>

<h2>Step 1. Include JS/CSS Files in page head</h2>
<textarea style="width:400px;height:80px;">
<script src="SIPml-api.js" type="text/javascript"> </script>
<script src="rr_clicktocall.js" type="text/javascript"> </script>
<link rel="stylesheet" href="clicktocall.css">
</textarea>

<h2>Step 2. Add the html div tag with id "ringroost_c2c" </h2>
Add the following div tag in your html wherever you want the button to show up.

<textarea style="width:800px;height:80px;">
<div id="ringroost_c2c"  notsupported_text="<a href='tel:17043436748'>Call Us:704.343.6748</a>" text="Call Us" call="17043436748" class="rr_blue"></div>
</textarea>

<h2>Step 3. Set Required Properties </h2>

<strong>Required properties</strong>
<table>
<tr> <td> id </td> <td> Must be set to "ringroost_c2c" </td> </tr>
<tr> <td> call</td> <td> Telephone number that will button will call when pressed. </td> </tr>
<tr> <td> text</td> <td>This is the text that will be shown in your button. </td> </tr>
</table>

<strong>Optional properties</strong>
<table>
<tr> <td> notsupported_text </td> <td> What to display in case that a browser is not compatible with the button. You may embed html in the attribute. </td> </tr>
<tr> <td> class</td> <td> (rr_grey| rr_red|rr_blue|rr_green|rr_black|rr_yellow|rr_purple|rr_gblue|rr_button1)
You can set a class on the div in order to change it’s appearance. Button styles corrispond (roughly) to these buttons: http://www.joepettersson.com/demo/css3-buttons/
 </td> </tr>
</table>



<p>

Note: If you have your own SIP server/gateway your welcome to integrate this clicktocall button with that. You will need change the appropriate setting in "rr_clicktocall.js" (this is kinda advanced, so make sure you know what you are doing).
</p>

