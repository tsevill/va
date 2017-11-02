d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
function deg2rad(deg){
	return Math.PI * deg / 180;
}

function rad2deg(rad){
	return 180 * rad / Math.PI;
}
var acled_event_types = [	
            "Battle-No change of territory", 
			"Battle-Non-state actor overtakes territory", 
			"Battle-Government regains territory",
			"Headquarters or base established",
			"Non-violent activity by a conflict actor",
			"Riots/Protests",
			"Violence against civilians",
			"Non-violent transfer of territory",
			"Remote Violence"
		];

var triad_count_color = ['white','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'];

triadInfo = null;
overlayInfo = null;
d3Overlay=null;
triadLinksOverlay = null;

// Global constants
const QUANTITY 		= 1;
const VALUE 		= 2;
const PERCENT 		= 3;
const SIMILARITY	= 6;
const IMPORT		= 4;
const EXPORT		= 5;

// Global constants relating to mapbox
const MBTOKEN = 'pk.eyJ1IjoicnNpbW1vbnMiLCJhIjoiY2lrOHRnbGl6MDA5enV4a3VwNHc2ODAzdyJ9.qWBulmAz-M8jWe_TTi7OQA';
const MBSTYLE = 'rsimmons/cipsv4r64002sbbnndg5mikn4';

// Socket
//var socket = io();


//service_url = 'http://localhost:8080/TradeData/services/';
service_url = 'services/'

function makeTextFile(text) {
    var textFile = null;
	var data = new Blob([text], {type: 'text/plain'});
    textFile = window.URL.createObjectURL(data);

    return textFile;
 };