// Page elements
var mapDiv				= $('#map');
var quantityBtn			= $('#quantityBtn');
var valueBtn 			= $('#valueBtn');
var percentBtn 			= $('#percentBtn');
var percentType 		= $('#percentType');
var similarityBtn 		= $('#similarityBtn');
var similarityThreshold	= $('#similarityThreshold');
var countryClusterBtn 	= $('#countryClusterBtn');
var simDownload 		= $('#simDownload');
var itemClusterBtn 		= $('#itemClusterBtn');
var refreshBtn 			= $('#refreshBtn');
var triadBtn 			= $('#triadBtn');
var exportBtn 			= $('#exportBtn');
var importBtn 			= $('#importBtn');
var legend 				= $('#legend');
var loading 			= $('#loading');
var clusterLoading 		= $('#clusterLoading');
var loadingVal 			= $('#loadingVal');
var countryName 		= $('#countryName');
var countryFlag 		= $('#countryFlag');
var yearSlider 			= $('#yearSlider');



//Global vars
var valToShow 	= null;
var pType 		= null
var simThreshold = null;
var direction 	= null;
var minYear		= null;
var maxYear		= null;
var year 		= null;
var item 		= [];
var country 	= null;
var mortifPos = 1;
var showTriads = false;
var triadValueType = 'count';
var triadInfo = null;

var itemCodes = {};
var FAOtoPOP = {};
var POPtoFAO = {};
var layers = [];
var topTradeCountryData = null;
// var layerCenters = [];

// btn functions
$(quantityBtn).click(btnClick);
$(valueBtn).click(btnClick);
$(percentBtn).click(btnClick);
$(similarityBtn).click(btnClick);
$(exportBtn).click(btnClick);
$(importBtn).click(btnClick);
$(triadBtn).click(triadBtnClick);
$(refreshBtn).click(updateMap);

$('#positionalBtn').click(function(e) {
	e.stopPropagation();
	$(this).addClass('btn-down');
	$('#groupedBtn').removeClass('btn-down');
	triadSelect();
});
$('#groupedBtn').click(function(e) {
	e.stopPropagation();
	$(this).addClass('btn-down');
	$('#positionalBtn').removeClass('btn-down');
	triadSelect();
});


// DONT DELETE
// $('#sendMap').click(function(){
// 	var msg = {
// 		valToShow: valToShow,
// 		direction: direction,
// 		minYear: minYear,
// 		maxYear: maxYear,
// 		item: item,
// 		country: country,
// 		simThreshold: simThreshold,
// 		pType: pType
// 	}
// 	console.log(layers)
// 	socket.emit('message', msg);
// })


// select function
$(itemFilter).keyup(filterChange);
$(itemFilter).focusin(function(){
	$(itemFilter).val("");
	$(itemFilter).keyup();
	$('#itemsList').show('blind', 500);
});
$( "#itemsList" ).hover(
  function() {
    $(itemFilter).blur();
  }, function() {
    $(this).hide('blind', 500);
    if(!showTriads) {
    	updateMap();
    }
    else {
    	console.log("shouldn't be here");
    	updateTriads();
    }
  }
);
$(similarityThreshold).change(thresholdChange);
$(percentType).change(percentTypeChange);

var g_triadPositionHistogram =  {
        data: null,
        svg: null,
        chartGroup: null,
        size: {
            width: 864,
            height: 400
        },
        chartSize: {
            width: 600,
            height: 240
        },
        topLeft: {
            x: 200,
            y: 0
        },
        colors: ['#1b9e77', '#d95f02', '#7570b3'],
        scale: null
};

var shpFile;
var map;
var selectedCountry;
var HC;
var clustering_flag = 'country';
var mapBounds = [[-69.761568,-169.179395],[83.933328,192.228819]];

$(document).ready(init);

// $('#mapState').click(function() {
// 	console.log('Bounds: ', map.getBounds());
// 	console.log('Zoom: ', map.getZoom());
// 	console.log('Center: ', map.getCenter());
// 	console.log($(window).height())
// 	console.log($(mapDiv).offset().top)
// 	console.log($(mapDiv).height())
// 	console.log($(mapDiv).height() + $(mapDiv).offset().top)
	
// })

var rtime;
var timeout = false;
var delta = 100;
$(window).resize(function() {
	setMapSize();
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeend, delta);
    }
});

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta);
    } else {
        timeout = false;
        map.invalidateSize(false)
        resizeMap();
    }               
}

// /////////////////////////////////////////////////////////////////////////////////////

function init() {
	// Set initial values
	valToShow = QUANTITY;
	direction = EXPORT;

	// Set buttons to initial position
	$('#quantityBtn').addClass('btn-down');
	$('#exportBtn').addClass('btn-down');
	$('#positionalBtn').addClass('btn-down');

	setMapSize();

	triadSelect();

	// Load base map tiles and shp geometry
	map = loadBaseMap();
	shpFile = loadShpFile("./data/worldTest");

	// Load DB codes
	getDBCodes();

	pieBtnClick();

	initTriadPositionHistogram();
	// Set the range of years
	getYearData();
	initSlider();

}
function setMapSize() {
	$(mapDiv).height($(window).height() - $(mapDiv).offset().top - 20);
	$(mapDiv).width($(mapDiv).height()*1.3538);
	$(loading).height($(mapDiv).height());
	$(loading).width($(mapDiv).width());	
}
function resizeMap() {
	map.setMinZoom(0);
	map.fitBounds(mapBounds);
	map.once('zoomend', function() {
		map.setMinZoom(map.getZoom());
	});
}
// function 
// loadBaseMap() loads all of the tiles from Mapbox,
// sets the initial position and zoom of the map
function loadBaseMap() {


	var map = L.map('map', {
		center: [35, 10],
	    zoom: 2,
	    zoomSnap: 0.001,
	    zoomDelta: 0.001,
	    //minZoom: 1.7,
	    maxBounds: mapBounds,
	    attributionControl: false,
	    zoomControl: false,
	});

	map.dragging.disable();
	
	map.fitBounds(mapBounds);
	map.once('zoomend', function() {
		map.setMinZoom(map.getZoom());
	});

	L.tileLayer('https://api.mapbox.com/styles/v1/' + MBSTYLE + '/tiles/256/{z}/{x}/{y}?access_token=' + MBTOKEN).addTo(map);
	//L.tileLayer('https://api.mapbox.com/styles/v1/rsimmons/ciphclieh0033bbm6qxwg6hos/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnNpbW1vbnMiLCJhIjoiY2lrOHRnbGl6MDA5enV4a3VwNHc2ODAzdyJ9.qWBulmAz-M8jWe_TTi7OQA')
	

	

	// L.mapbox.accessToken = MBTOKEN;
	// var map = L.mapbox.map('map', 'mapbox.light', {
	//     center: [35, 10],
	//     zoom: 2,
	//     minZoom: 2,
	//     //maxBounds: [[-60,-175],[85,175]],
	//     attributionControl: false,
	//     zoomControl: false,
	// });
	// //map.fitWorld();
	// L.mapbox.styleLayer(MBSTYLE).addTo(map);

	return map;
}

// loadShpFile loads the local shp file and the geojson
function loadShpFile(url) {
	var result = {};
	shp(url).then(function(geojson){
		result.layer = L.geoJson(geojson, {
			style: countryInitial,
			onEachFeature: onEachFeature
		}).addTo(map);
		result.geojson = geojson;
	});
	return result;
}

// getDBCodes() pulls tables from the DB containing information
// and their codes in the DB
function getDBCodes() {
	// Get the countries table and store the codes in 2 lookup
	// dictionaries. One to lookup a POP code from an FAO code,
	// and one to look up an FAO code from a POP code
	getDBTable('ALL_Countries', function(countries) {
		for(i in countries) {
			if(countries[i]['POP_CountryCode'] != 0 && countries[i]['POP_CountryCode'] != 0) {
				POPtoFAO[countries[i]['POP_CountryCode']] = countries[i]['FAO_CountryCode'];
				FAOtoPOP[countries[i]['FAO_CountryCode']] = countries[i]['POP_CountryCode'];
			}
			// CHINA FIX
			POPtoFAO["156"] = "41";
			FAOtoPOP["41"] = "156";
			// SUDAN FIX
			POPtoFAO["736"] = "206";
			FAOtoPOP["206"] = "736";
			// Switzerland FIX
			POPtoFAO["744"] = "211";
			FAOtoPOP["211"] = "744";
		}
	});

	// Get all of the items in DB, storing each one in a lookup
	// dictionary by code. Also populate the item dropdown on
	// the page
	getDBTable('FAO_Items', function(items) {
		items.sort(function(a, b){
			if(a.Item < b.Item){
				return -1;
			}
			else if(a.Item > b.Item){
				return 1;
			}
			else{
				return 0;
			}
		});

		for(i in items) {
			itemCodes[items[i]['ItemCode']] = items[i]['Item']
			$('#itemsList').append('<button class="btn btn-xs btn-default" value=' + items[i]['ItemCode'] + '>' + items[i]['Item'] + '</button>');
		}

		$('#itemsList').children().click(function(){
			if(!$(this).hasClass('item-active')) {
				$(this).addClass('item-active');
				var chosen = $(this).clone();
				$(chosen).append('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>');
				$(chosen).click(function(){
					topTradeCountryData = null;
					var str = $(this).val();
					$(this).remove();
					if($('#itemsSelected').children().length == 1) {
						$('#itemsSelectedMsg').show();
					}
					item.splice(item.indexOf(str), 1);
					$('#itemsList').children().each(function(){
						if($(this).val() == str) {
							$(this).removeClass('item-active');
						}
					})
				});
				$('#itemsSelectedMsg').hide();
				$('#itemsSelected').append(chosen);
				item.push($(this).val());
				topTradeCountryData = null;
				console.log(item);
			}
		})
	});
}

function getYearData() {
	$.ajax({
		url: service_url + 'dbyeardata/?callback=?',
		dataType: 'jsonp',
		success: function(result){
			minYear = parseInt(result[0].MinYear);
			maxYear = parseInt(result[0].MaxYear);
			getYearSlider();
		}
	});
}
// getDBTable() is a helper function that pulls a given table from the DB
function getDBTable(tableName, callback) {
	$.ajax({
		url: service_url + 'dbgettable/?tableName=' + tableName + '&callback=?',
		dataType: 'jsonp',
		success: callback
	});
}

// Called when shp file is loaded. Stores each layer in a local array
// and sets user interaction functions
function onEachFeature(feature, layer) {
	layers[layer.feature.properties.UN] = layer;
	layer.bindPopup(L.popup({
		className : 'hoverPopup',
		autoPan: false,
		keepInView: true,
		maxWidth: 1000
	}));
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		mousemove: movePopup,
		click: selectCountry,
	});
// var center = layer.getBounds().getCenter();
// layerCenters[layer.feature.properties.UN] = center;
}

// Called when a user hovers on a layer
function highlightFeature(e) {
	var layer = e.target;
	var props = layer.feature.properties;
	
	layer.fillColor = e.layer ? e.layer.options.fillColor : e.target.options.fillColor;
	layer.fillOpacity = e.layer ? e.layer.options.fillOpacity : e.target.options.fillOpacity;

	if(selectedCountry != layer || showTriads) {
		layer.setStyle(countryHover);
	}
	layer.setPopupContent('<h4><span id="countryFlag" class="flag-icon flag-icon-' + props.ISO2.toLowerCase() + '"></span>' +
	    	'<span id="countryName">' + props.NAME + '</span></h4>' +
	    	'<div class="popuploading"><img src="loading.gif"/></div>');

	getTopData(e, layer);
}

// Called when a user moves mouse out of a country
function resetHighlight(e) {
	var layer = e.target;
	layer.closePopup();
	if(selectedCountry != layer) {
		layer.setStyle(countryInitial);
		layer.setStyle({"fillColor": layer.fillColor,
						"fillOpacity": layer.fillOpacity});
	}
}

// Called when a user clicks (selects) a country
function selectCountry(e) {
	var layer = e.target;
	layer.closePopup();
	if(!showTriads){
		if(selectedCountry != layer) {
			var props = layer.feature.properties;
			$(countryName).text(props.NAME);
			$(countryFlag).removeClass();
			$(countryFlag).addClass("flag-icon flag-icon-" + props.ISO2.toLowerCase());
	
			if(selectedCountry) {
				shpFile.layer.resetStyle(selectedCountry);
			}
			selectedCountry = layer;
			country = props.UN;
			updateMap();
			layer.setStyle(countryClicked);
		}
		else {
			var props = layer.feature.properties;
			$(countryName).text("No Country Selected");
			$(countryFlag).removeClass();
	
			shpFile.layer.resetStyle(selectedCountry);
			highlightFeature(e);
			selectedCountry = null;
			country = null;
		}
	}
	else{
		// draw triad links
//		if(selectedCountry != layer){
			var props = layer.feature.properties;
			$(countryName).text(props.NAME);
			$(countryFlag).removeClass();
			$(countryFlag).addClass("flag-icon flag-icon-" + props.ISO2.toLowerCase());
			if(selectedCountry) {
				shpFile.layer.resetStyle(selectedCountry);
			}
			selectedCountry = layer;
			country = props.UN;
			
			updateTriadLinks();
//		}
	}
	updateTriadPositionHistogram();
}

function movePopup(e) {
	e.target.getPopup().setLatLng(map.containerPointToLatLng([e.containerPoint.x, e.containerPoint.y - 50]))
}

function getTopData(e, layer) {
	var props = layer.feature.properties;
	var countryCode = POPtoFAO[props.UN];

	if(countryCode && valToShow && direction && minYear && maxYear) {
		if(valToShow == PERCENT) {
			$.ajax({
			 	url: service_url + 'dbtoppercentdata?' + 
			 		'country=' + countryCode + '&' + 
			 		'valToShow=' + valToShow + '&' +
			 		'direction=' + direction + '&' +
			 		'minYear=' + minYear + '&' +
			 		'maxYear=' + maxYear + '&' +
			 		'callback=?',
			 	dataType: 'jsonp',
			 	success: function(result){

			 		var html = '<h4><span id="countryFlag" class="flag-icon flag-icon-' + props.ISO2.toLowerCase() + '"></span>' +
							'<span id="countryName">' + props.NAME + '</span></h4><table><tr>';
					for(var i in result) {
						if(i%2 == 0) {
							html += '</tr><tr>';
						}
						html += '<td><div class="block">';
						
						if(layers[FAOtoPOP[result[i][0].Source]]) {
							html += '<h5><span id="countryFlag" class="flag-icon flag-icon-' + layers[FAOtoPOP[result[i][0].Source]].feature.properties.ISO2.toLowerCase() + '"></span>' +
								'<span id="countryName">' + layers[FAOtoPOP[result[i][0].Source]].feature.properties.NAME + '</span></h5>';
						}
						else {
							html += '<h5><span id="countryName">Country Unknown</span></h5>';
						}

						html += '<div class="popup-left">';
				 		for(var j in result[i]) {
				 			html += '<div class="popup-label-sm"><small>' + itemCodes[result[i][j].ItemCode] + '</small></div>';
				 		}
				 		html += '</div>';
				 		html += '<div class="popup-right">';
				 		for(var j in result[i]) {
				 			html += '<div class="popup-bar-container-sm">';
				 			html += '<div class="popup-bar-sm" style="width:' + (100*result[i][j].Value) + 'px">';
				 			html += '<div class="popup-bar-text-sm"><small>' + (100*result[i][j].Value).toFixed(2) + '%</small></div></div></div>';
				 		}
				 		html += '</div><div style="clear:both;"></div></div></td>';
					}
					html += '</tr></table>';
			 		layer.setPopupContent(html);
			 	}
			});
		}
		else {
			$.ajax({
			 	url: service_url + 'dbtopdata?' + 
			 		'country=' + countryCode + '&' + 
			 		'valToShow=' + valToShow + '&' +
			 		'direction=' + direction + '&' +
			 		'minYear=' + minYear + '&' +
			 		'maxYear=' + maxYear + '&' +
			 		'callback=?',
			 	dataType: 'jsonp',
			 	success: function(result){
			 		// var html = layers[country].getPopup().getContent();
			 		var html = '<h4><span id="countryFlag" class="flag-icon flag-icon-' + props.ISO2.toLowerCase() + '"></span>' +
							'<span id="countryName">' + props.NAME + '</span></h4>';
			 		html += '<div class="popup-left">';
			 		for(var i in result) {
			 			html += '<div class="popup-label">' + itemCodes[result[i].ItemCode] + '</div>';
			 		}
			 		html += '</div>';
			 		html += '<div class="popup-right">';
			 		for(var i in result) {
			 			html += '<div class="popup-bar-container">';
			 			html += '<div class="popup-bar" style="width:' + (200*result[i].Value) + 'px">';
			 			html += '<div class="popup-bar-text">' + (100*result[i].Value).toFixed(2) + '%</div></div></div>';
			 		}
			 		html += '</div><div style="clear:both;"></div>';
			 		layer.setPopupContent(html);		 		
			 	}
			});
		}
		layer.openPopup(map.containerPointToLatLng([e.containerPoint.x, e.containerPoint.y - 50]));
	}
	
}

function shadeCountry(country, val, max) {
	if(!country) {
		console.log("Country not found on map");
	}
	else {
		if(selectedCountry != country) {
			if(valToShow == SIMILARITY) {
				if(colorbrewer.PuBu[simThreshold]) {
					country.setStyle({"fillColor": colorbrewer.PuBu[simThreshold][val-1]});
				}
				else {
					country.setStyle({"fillColor": colorbrewer.PuBu[5][Math.ceil(val/2) - 1]});
				}
			}
			else if(valToShow == PERCENT) {
				if(val < .005) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][0]});
				}
				else if(val < .01) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][1]});
				}
				else if(val < .02) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][2]});
				}
				else if(val < .05) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][3]});
				}
				else if(val < .1) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][4]});
				}
				else if(val < .2) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][5]});
				}
				else {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][6]});
				}
			}
			else {
				if(val < (max/7)*2) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][1]});
				}
				else if(val < (max/7)*3) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][2]});
				}
				else if(val < (max/7)*4) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][3]});
				}
				else if(val < (max/7)*5) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][4]});
				}
				else if(val < (max/7)*6) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][5]});
				}
				else if(val <= (max)) {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][6]});
				}
				else {
					country.setStyle({"fillColor": colorbrewer.PuBu[7][0]});
				}
			}
		}
	}
}

function haveSelections() {
	if(valToShow && valToShow == SIMILARITY) {
		return (simThreshold && direction && minYear && maxYear && item.length > 0 && country);
	}
	else if(valToShow && valToShow == PERCENT) {
		return (pType && direction && minYear && maxYear && item.length > 0 && country);
	}
	else {
		return (valToShow && direction && minYear && maxYear && item.length > 0 && country);
	}
}

function btnClick() {
	if($(this).hasClass('btn-element')) {
		$('.btn-element').each(function() {$(this).removeClass('btn-down')});
		$(similarityThreshold).hide(100);
		$(itemClusterBtn).hide(100);
		$(percentType).hide(100);
		$(countryClusterBtn).hide(100);
		$(simDownload).hide(100);
		$(this).addClass('btn-down');

		switch($(this).attr('id')) {
			case 'quantityBtn':
				valToShow = QUANTITY;
				break;
			case 'valueBtn':
				valToShow = VALUE;
				break;
			case 'percentBtn':
				valToShow = PERCENT;
				pType = $(percentType).find(":selected").val();
				$(percentType).show(500);
				break;
			case 'similarityBtn':
				valToShow = SIMILARITY;
				$(similarityThreshold).show(500);
				$(countryClusterBtn).show(500);
				$(itemClusterBtn).show(500);
				$(simDownload).show(500);
				simThreshold = $(similarityThreshold).find(":selected").val();
				break;
		}
	}

	if($(this).hasClass('btn-direction')) {
		$('.btn-direction').each(function() {$(this).removeClass('btn-down')});
		$(this).addClass('btn-down');
		topTradeCountryData = null;

		switch($(this).attr('id')) {
			case 'exportBtn':
				direction = EXPORT;
				break;
			case 'importBtn':
				direction = IMPORT;
				break;
		}
	}
	if(!showTriads)
		updateMap();
}

function triadBtnClick(){
	if($(this).hasClass('active')){
		$(this).removeClass('active');
	}
	else{
		$(this).addClass('active');
	}
	if($(this).hasClass('active')){
		showTriads = true;
		if(showTriads && item && mortifPos){
			updateTriads();
		}
	}
	else{
		showTriads = false;
		updateMap();
	}
}

function filterChange() {
	var words = $(this).val().match(/\w+/gi);
	var REstr = "";
	$(words).each(function(){
		REstr+= "(?=.*\\b" + this + ")";
	});
	var regex = new RegExp(REstr,"gi");
	$('#itemsList').children().each(function(){
    	if(!regex.test($(this).text().toLowerCase())) {
			$(this).hide();
		}
		else {
			$(this).show();
		}
	})
}

function percentTypeChange() {
	pType = $(percentType).find(":selected").val();
	if(showTriads) {
		updateTriads();
	}
    updateMap();
    updateTriadPositionHistogram();
}

function thresholdChange() {
	simThreshold = parseInt($(similarityThreshold).find(":selected").val());
	if(showTriads) {
		updateTriads();
	}
    updateMap();
    updateTriadPositionHistogram();
}

// ////////////////////////////////////////////////////////////////////////////////////////////////////

function updateMap() {
	if(!haveSelections()) {
		console.log('Missing:');
		if(!valToShow) console.log('valToShow');
		if(!direction) console.log('direction');
		if(!minYear) console.log('minYear');
		if(!maxYear) console.log('maxYear');
		if(!item) console.log('item');
		if(!country) console.log('country');
	}
	else if(valToShow == SIMILARITY) {
		$(loading).fadeIn(200);

		var countryCode = POPtoFAO[country];
 		var similarity = {};

 		if(!topTradeCountryData) {
 			loadTopTradeCountryData(loadSimilarityMap);
 		}
 		else {
 			var sim_country;
 			loadSimilarityMap();
 		}

 		
		
 		function loadSimilarityMap() {
 			var topForAll = {};
	 		for(var i in topTradeCountryData) {
	 			if(!topForAll[topTradeCountryData[i].Source]) {
	 				topForAll[topTradeCountryData[i].Source] = [];
	 				topForAll[topTradeCountryData[i].Source].push(topTradeCountryData[i].Partner);
	 			}
	 			else if(topForAll[topTradeCountryData[i].Source].length < simThreshold) {
	 				topForAll[topTradeCountryData[i].Source].push(topTradeCountryData[i].Partner);
	 			}
	 		}
	 		
	 		for(var j in topForAll[countryCode]) {
	 			for(var k in topForAll) {
	 				if(topForAll[k].indexOf(topForAll[countryCode][j]) > -1) {
		 				if(similarity[FAOtoPOP[k]]) {
			 				similarity[FAOtoPOP[k]]++;
						}
						else {
							similarity[FAOtoPOP[k]] = 1;
						}
		 			}
		 		}
	 		}

	 		for(var i in layers) {
	 			if(selectedCountry != layers[i]) {
		 			layers[i].setStyle({
				 				"color": "#cccccc",
								"fillOpacity": 0.7,
								"fillColor": "#FFFFFF"
					});
				}
	 		}
			for(var l in similarity) {
				shadeCountry(layers[l], similarity[l], top.length);
			}

			updateLegend(top.length);
			$(loading).fadeOut(200);
			
			var simsArr = [];
			for(var i in similarity){
				if(similarity.hasOwnProperty(i)){
					if(layers[i]){
					sim_country = layers[i].feature.properties.NAME;
					if(sim_country){
	 					simsArr.push({
	 						'country' : sim_country,
	 						'sim' : similarity[i] / simThreshold
	 					});
					}
					}
				}
			}
			simsArr.sort(function(a, b){
				return b.sim - a.sim;
			});
			
			var simStr = simsArr.reduce(function(pre, cur, ind){
				return pre + '\"' + cur.country + '\",' + cur.sim + '\n';
			}, '');
			
		
			(function () {
				var textFile = null,
				  makeTextFile = function (text) {
				    var data = new Blob([text], {type: 'text/plain'});
			
				    // If we are replacing a previously generated file we need to
				    // manually revoke the object URL to avoid memory leaks.
				    if (textFile !== null) {
				      window.URL.revokeObjectURL(textFile);
				    }
			
				    textFile = window.URL.createObjectURL(data);
			
				    return textFile;
				  };
				    var link = document.getElementById('simDownload');
				    link.href = makeTextFile(simStr);
				    link.style.display = 'block';

			})();
 		}		
	}
	else {
		$(loading).fadeIn(200);
		var countryCode = POPtoFAO[country];
		$.ajax({
		 	url: service_url + 'dbtradedata?' + 
		 		'country=' + countryCode + '&' + 
		 		'valToShow=' + valToShow + '&' +
		 		(valToShow == PERCENT ? ('pType=' + pType) : '') + '&' +
		 		'items=' + JSON.stringify(item) + '&' +
		 		'direction=' + direction + '&' +
		 		'minYear=' + minYear + '&' +
		 		'maxYear=' + maxYear + '&' +
		 		'callback=?',
		 	dataType: 'jsonp',
		 	success: function(result){
		 		// Get rid of the loading animation
		 		$(loading).fadeOut(200);

		 		// Loop through every layer we have and set it as the low bin color
		 		for(var i in layers) {
		 			if(selectedCountry != layers[i]) {
			 			layers[i].setStyle({
					 				"color": "#cccccc",
									"fillOpacity": 0.7,
									"fillColor": "#FFFFFF"
						});
					}
		 			else{
		 				layers[i].setStyle(countryClicked);
		 			}
		 		}
		 		
		 		var max = -Infinity;
		 		for(var i in result) {
		 			var value = valToShow == PERCENT ? result[i].Value : Math.log(result[i].Value);
		 			max = Math.max(max, value);
		 		}

		 		for(var i in result) {
		 			var value = valToShow == PERCENT ? result[i].Value : Math.log(result[i].Value);
		 			var partner = result[i].Partner;

		 			shadeCountry(layers[FAOtoPOP[partner]], value, max);
		 		}

		 		// Generate the legend
		 		updateLegend(max);

		 	}
		});
	}
	if(triadInfo){
//		triadInfo.removeFrom(map);
		map.removeControl(triadInfo);
		triadInfo = null;
	}
}

function updateTriadLinks(){
	var countryCode = POPtoFAO[country];
	var url = service_url + 'loadtriadlinks?callback=?';
	var config = {
		'countryCode' : countryCode,
		'mortifPos' : mortifPos,
		'items' : JSON.stringify(item),
		'minYear' : minYear,
		'maxYear' : maxYear,
		'grouped' : $('#groupedBtn').hasClass('btn-down') ? true : false
	};
	
	$.ajax({
	 	url: url,
	 	data : config,
	 	dataType: 'jsonp',
	 	beforeSend : function(){
	 		$(loading).fadeIn(200);
	 	},
	 	error: function(){
	 		console.log('ajax error');
	 	},
	 	success: function(link_data){
	 		$(loading).fadeOut(200);
	 		
	 		if(triadLinksOverlay){
	 			map.removeLayer(triadLinksOverlay);
	 		}
	 		triadLinksOverlay = L.d3SvgOverlay(function(selection, projection){
	 			var node_data= {};
	 			var links = [];
	 			link_data.forEach(function(link){
	 				var source_layer = layers[FAOtoPOP[link.source]];
		 			var target_layer = layers[FAOtoPOP[link.target]];
		 			if(source_layer && target_layer){
		 				var source_centroid = [source_layer.feature.properties.LAT, source_layer.feature.properties.LON];
		 				var target_centroid = [target_layer.feature.properties.LAT, target_layer.feature.properties.LON];
		 				var source_x = projection.latLngToLayerPoint(source_centroid).x;
		 				var source_y = projection.latLngToLayerPoint(source_centroid).y;
		 				
		 				var target_x = projection.latLngToLayerPoint(target_centroid).x;
		 				var target_y = projection.latLngToLayerPoint(target_centroid).y;
		 				
		 				var source = node_data[link.source];
		 				if(!source){
		 					node_data[link.source] = {
		 						x : source_x,
		 						y : source_y
		 					};
		 				}
		 			
		 				var target = node_data[link.target];
		 				if(!target){
		 					node_data[link.target] = {
		 						x : target_x,
		 						y : target_y
		 					};
		 				}
		 				links.push(link);
		 			}
	 			});
	 			
	 			//left to right gradient
	 			var gradient_left2right = selection.append('defs')
	 			.append('linearGradient')
	 			.attr('id', 'gradient_left2right');
	 			
	 			gradient_left2right.append('stop')
	 			.attr('offset', '0%')
	 			.attr('stop-color', 'blue');
	 			
	 			gradient_left2right.append('stop')
	 			.attr('offset', '100%')
	 			.attr('stop-color', 'red');
	 			
	 			//right to left gradient
	 			var gradient_right2left = selection.select('defs')
	 			.append('linearGradient')
	 			.attr('id', 'gradient-right2left');
	 			
	 			gradient_right2left
	 			.append('stop')
	 			.attr('offset', '0%')
	 			.attr('stop-color', 'red');
	 			
	 			gradient_right2left
	 			.append('stop')
	 			.attr('offset', '100%')
	 			.attr('stop-color', 'blue');
	 			
	 			//top to bottom gradient
	 			var gradient_top2bottom = selection.select('defs')
	 			.append('linearGradient')
	 			.attr('id', 'gradient_top2bottom')
	 			.attr('x1', '0%').attr('x2', '0%').attr('y1', '0%').attr('y2', '100%');
	 			
	 			gradient_top2bottom.append('stop')
	 			.attr('offset', '0%')
	 			.attr('stop-color', 'blue');
	 			
	 			gradient_top2bottom.append('stop')
	 			.attr('offset', '100%')
	 			.attr('stop-color', 'red');
	 			
	 			//bottom to top gradient
	 			var gradient_bottom2top = selection.select('defs')
	 			.append('linearGradient')
	 			.attr('id', 'gradient_bottom2top')
	 			.attr('x1', '0%').attr('x2', '0%').attr('y1', '0%').attr('y2', '100%');
	 			
	 			gradient_bottom2top
	 			.append('stop')
	 			.attr('offset', '0%')
	 			.attr('stop-color', 'red');
	 			
	 			gradient_bottom2top
	 			.append('stop')
	 			.attr('offset', '100%')
	 			.attr('stop-color', 'blue');
	 			
	 			
	 			
	 			if(links.length < 500){
		 			var fbundling = d3.ForceEdgeBundling().nodes(node_data).edges(links)
	//	 			.iterations(10)
	//	 			.cycles(3)
	//	 			.step_size(0.5)
	//                .compatibility_threshold(0.6);
		 			
		 			var plinks = fbundling();
		 			for(var i = 0; i < plinks.length; i++){
		 				plinks[i].direction = links[i].direction;
		 			}
		 			
		 			var d3line = d3.svg.line()
		            .x(function(d){ return d.x; })
	                .y(function(d){ return d.y; })
	                .interpolate("linear");
		 				
		 			
		 			
		 			var updateSelection = selection.selectAll('.map-triad-link')
		 			.data(plinks);
		 			
		 			var linkEnter = updateSelection.enter()
		 			.append('path')
		 			.attr('class', 'map-triad-link')
		 			.attr('d', d3line)
		 			.attr('stroke', function(d, i){
		 				if(d.direction == 0){
		 					return '#d95f02';
		 				}
		 				else{
		 					var source_node = node_data[links[i].source];
		 					var target_node = node_data[links[i].target];
		 					if(source_node.x < target_node.x){
		 						return 'url(#gradient_left2right)';
		 					}
		 					else if(source_node.x > target_node.x){
		 						return 'url(#gradient-right2left)';
		 					}
		 					else if(source_node.y < target_node.y){
		 						return 'url(#gradient-top2bottom)';
		 					}
		 					else if(source_node.y > target_node.y){
		 						return 'url(#gradient-bottom2top)';
		 					}
		 				}
		 			})
		 			.attr('stroke-width', 0.3)
		 			.attr('opacity', 0.5)
		 			.attr('fill', 'none');
	 			
	 			}
	 			else{
	 				var updateSelection = selection.selectAll('.map-triad-link')
		 			.data(links);
	 				
	 				var updateSelection = selection.selectAll('.map-triad-link')
		 			.data(links);
	 				
	 				var linkEnter = updateSelection.enter()
	 				.append('line')
	 				.attr('x1', function(d){
	 					return node_data[d.source].x;
	 				})
	 				.attr('y1', function(d){
	 					return node_data[d.source].y;
	 				})
	 				.attr('x2', function(d){
	 					return node_data[d.target].x;
	 				})
	 				.attr('y2', function(d){
	 					return node_data[d.target].y;
	 				})
	 				.style('stroke', function(d, i){
	 					if(d.direction == 0){
		 					return '#d95f02';
		 				}
		 				else{
		 					if(node_data[d.source].x < node_data[d.target].x){
		 						return 'url(#gradient_left2right)';
		 					}
		 					else if(node_data[d.source].x > node_data[d.target].x){
		 						return 'url(#gradient-right2left)';
		 					}
		 					else if(node_data[d.source].y < node_data[d.target].y){
		 						return 'url(#gradient-top2bottom)';
		 					}
		 					else if(node_data[d.source].y > node_data[d.target].y){
		 						return 'url(#gradient-bottom2top)';
		 					}
		 					
		 				}
	 				})
	 				.style('stroke-width', '0.3px')
	 				.style('opacity', 0.5)
	 				.style('fill', 'none');
	 			}
	 		});
	 		triadLinksOverlay.addTo(map);
	 	}
	});
}

//init the interactions of Position Histogram button
function initTriadPositionHistogram() {
    var width = g_triadPositionHistogram.size.width;
    var height = g_triadPositionHistogram.size.height;
    var svg = d3.select("#histogramDiv").append("svg")
        .attr("width", width)
        .attr("height", height);
    g_triadPositionHistogram.svg = svg;
    var i, k;
    g_triadPositionHistogram.data = [];
    for(i=0; i<13; ++i) {
        g_triadPositionHistogram.data.push([]);
        for(k=0; k<3; ++k) {
            g_triadPositionHistogram.data[i].push({
                value: 0,
                sum: 0
            });
        }
    }
    // the default scale always returns 0
    var chartSize = g_triadPositionHistogram.chartSize;
    g_triadPositionHistogram.scale = d3.scale.linear().domain([0, 1]).range([0, chartSize.width]);
    g_triadPositionHistogram.chartGroup = svg.append('g').attr('transform',
            'translate(' + g_triadPositionHistogram.topLeft.x + ',' + g_triadPositionHistogram.topLeft.y + ')');
    //  the initial histogram
    updateTriadPositionHistogramVis();
}

function updateTriadPositionHistogram() {
    var i, k;
    if(item === null || item == '' || country === null || country == '') {
        var data = g_triadPositionHistogram.data;
        for(i=0; i<data.length; ++i) {
            for(k=0; k<data[i].length; ++k) {
                data[i][k].value = 0;
            }
        }
        g_triadPositionHistogram.data = data;
        updateTriadPositionHistogramVis();
        return;
    }
    var url = service_url + 'dbtriadhistogram?callback=?';
    $.ajax(url, {
        data: {
            items: JSON.stringify(item),
            country: POPtoFAO[country]
        },
        dataType: 'jsonp',
        success: function(histoData) {
            var i, k;
            var data = g_triadPositionHistogram.data;
            for(var i=0; i<histoData.length; ++i) {
                for(var k=0; k<histoData[i].length; ++k) {
                    data[i][k].value = histoData[i][k];
                }
            }
            g_triadPositionHistogram.data = data;
            updateTriadPositionHistogramVis();
        },
        error : function( jqXHR, textStatus, errorThrown){
        	console.log(textStatus);
        	console.log(errorThrown);
        }
    });
}

function updateTriadPositionHistogramVis() {
    // update prefix sum
    var i, k;
    var data = g_triadPositionHistogram.data;
    var maxSum = 0;
    for(i=0; i<data.length; ++i) {
        for(k=0; k<data[i].length; ++k) {
            data[i][k].sum = data[i][k].value;
        }
        for(k=data[i].length-2; k>=0; --k) {
            data[i][k].sum += data[i][k+1].sum; 
        }
        maxSum = Math.max(maxSum, data[i][0].sum);
    }
    maxSum = Math.max(maxSum, 1);
    g_triadPositionHistogram.data = data;
    var scale = g_triadPositionHistogram.scale;
    scale.domain([0, maxSum]);
    g_triadPositionHistogram.scale = scale;
    
    var svg = g_triadPositionHistogram.svg;
    var chartGroup = g_triadPositionHistogram.chartGroup;
    
    var chartSize = g_triadPositionHistogram.chartSize;
    var columnWidth = chartSize.width / data.length;
    var padding = 4;
    var barWidth = columnWidth - padding * 2;
    
    var columnsSelection = chartGroup.selectAll('.stacked_bar').data(data); 
    columnsSelection.remove();
    var columns = columnsSelection.enter().append('g')
        .attr('class', 'stacked_bar')
        .attr('transform', function(d, x_index) {
            return 'translate(' + (x_index * columnWidth) + ',0)';
        });
    
    columns.selectAll('rect').data(function(d) {return d;}).enter().append('rect')
        .attr('x', padding)
        .attr('y', function(v) {return chartSize.height - scale(v.sum);})
        .attr('width', barWidth)
        .attr('height', function(v) {return scale(v.value);})
        .style('fill', function(v, y_index) {return g_triadPositionHistogram.colors[y_index];});
}

function updateLegend(max) {
	$(legend).show(1000);
	legend.empty();
	if(showTriads){
	}
	else if(valToShow == PERCENT) {
		legend.append("<strong>Exported Percentage of Selected Good</strong><nav class='legend clearfix'>");
		
		for(var i in colorbrewer.PuBu[7]) {
			legend.append('<span style="background:' + colorbrewer.PuBu[7][i] + '; opacity: 0.7;"></span>');
		}

		legend.append("<label>0% - 0.5%</label>" +
			"<label>0.5% - 1%</label>" +
			"<label>1% - 2%</label>" +
			"<label>2% - 5%</label>" +
			"<label>5% - 10%</label>" +
			"<label>10% - 20%</label>" +
			"<label>20% - 100%</label>");
	}
	else if(valToShow == SIMILARITY) { 

		if(selectedCountry){
			legend.append("<strong>Similarity to " +
				selectedCountry.feature.properties.NAME +
				" in Quantity of " +  (direction == EXPORT ? "Exported ":"Imported ") +
				itemCodes[item] + "</strong><nav class='legend clearfix'>");
			
			if(colorbrewer.PuBu[simThreshold]) {
				for(var i = 0; i < simThreshold; i++) {
					legend.append('<span style="background:' + colorbrewer.PuBu[simThreshold][i] + '; opacity: 0.7; width: ' + (1/(simThreshold))*100 + '%;"></span>');
				}
				for(var i = 1; i <= simThreshold; i++) {
					legend.append('<label style="width: ' + (1/(simThreshold))*100 + '%;">' + i + '</label>');
				}
			}
			else {
				for(var i = 0; i < 6; i++) {
					legend.append('<span style="background:' + colorbrewer.PuBu[5][i] + '; opacity: 0.7; width: ' + (1/5)*100 + '%;"></span>');
				}
				for(var i = 1; i <= 10; i+=2) {
					legend.append('<label style="width: ' + (1/5)*100 + '%;">' + i + ' - ' + (i+1) + '</label>');
				}
			}
		}
	}
	else {
		var convertedMax = Math.pow(Math.E, max);
		var interval = max / colorbrewer.PuBu[7].length;

		var val = (valToShow == QUANTITY) ? "Quantity (tonnes)" : "Value ($1000)";

		legend.append("<strong>Exported " + val + " of Selected Good</strong><nav class='legend clearfix'>");
		for(var i in colorbrewer.PuBu[7]) {
			legend.append('<span style="background:' + colorbrewer.PuBu[7][i] + '; opacity: 0.7;"></span>');
		}
		for(var i in colorbrewer.PuBu[7]) {
			legend.append("<label>" + ((valToShow == VALUE) ? "$" : "") + 
							  numberWithCommas(Math.round(Math.pow(Math.E, interval * (+i)))) +
							  " - " + ((valToShow == VALUE) ? "$" : "") +
							  numberWithCommas(Math.round(Math.pow(Math.E, interval * ((+i)+1)))) +
						  "</label>");
		}
	}
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function updatePieChart(){
	var config = {
		'minYear' : minYear,
		'maxYear' : maxYear
	};
	
	$.ajax({
	 	url: service_url + 'loadconflicts?callback=?',
	 	dataType: 'jsonp',
	 	data : config,
	 	success: function(data){
	 		console.log('pie data', data);
	 		var zoom = map.getZoom();

	 		var sizeExtent = d3.extent(data, function(d){return d.size;});
	 		var sizeScale = d3.scale.sqrt().domain(sizeExtent).range([0, 10/4 * Math.pow(2, zoom)]);
	 		var color = d3.scale.ordinal()
	 		.range(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6']);
	 		d3Overlay = L.d3SvgOverlay(function(selection, projection){
	 			var updateSelection = selection.selectAll('.map-pie').data(data);
	 			var dots = updateSelection.enter()
	 			.append('g')
	 			.attr('class', 'map-pie')
	 			.attr('transform', function(d, i){
	 				var x = projection.latLngToLayerPoint(d.centroid).x;
	 				var y = projection.latLngToLayerPoint(d.centroid).y;
	 				return 'translate(' + [x, y] + ')';
	 			});


	 			var arcs = dots.selectAll('.map-pie-arc')
	 			.data(function(d, i){
	 				var pie = d3.layout.pie()
	 			    .sort(null)
	 			    .value(function(g) {return g;});

	 				var pieDat = pie(d.counts);
	 				var sum = (function(){
	 					var s = 0;
	 					for(var i = 0; i < d.counts.length; i++){
	 						s+= d.counts[i];
	 					}
	 					return s;
	 				})();
	 				var percents = d.counts.map(function(g){
	 					return g/sum;
	 				});
	 				return pieDat.map(function(g, i){
	 					g.size = d.size;
	 					g.index = i;
	 					g.percent = percents[i];
	 					return g;
	 				});
	 			})
	 			.enter()
	 			.append('g')
	 			.attr('class', 'map-pie-arc');


	 			arcs.append('path')
	 			.attr('d', function(d){
	 				var arcFun = d3.svg.arc()
		 		    .outerRadius(sizeScale(d.size))
		 		    .innerRadius(0);
	 				return arcFun(d);
	 			})
	 			.attr('fill', function(d, i){
	 				return color(i);
	 			});

	 			dots
	 			.on('mouseover', function(d, i){
//	 				var sizeScale = d3.scale.sqrt().domain(sizeExtent).range([0, 10/4 *
//	 				Math.pow(2, map.getZoom())]);
	 				d3.select(this).moveToFront();
	 				d3.select(this).selectAll('.map-pie-arc').selectAll('path')
	 				.attr('d', function(g, i){
	 					var arcFun = d3.svg.arc()
			 		    .outerRadius(20/4 * Math.pow(2, zoom))
			 		    .innerRadius(0);
	 					return arcFun(g);
	 				});
	 				d3.select(this).selectAll('.map-pie-arc').append('text')
	 				.attr('text-anchor', function(d){
						var center = rad2deg((d.startAngle + d.endAngle) / 2);
						return center <= 180 ? 'start' : 'end';
					})
	 				.attr('transform', function(d){
	 					var center = rad2deg((d.startAngle + d.endAngle) / 2);
	 					if((center - 90) > 45 && (center - 90) < 135){
	 						return 'rotate(' + (center - 90) + ') translate(' +[10, 0]+') rotate(' + (90 - center) + ')';
	 					}
	 					else{
	 						return 'rotate(' + (center - 90) + ') translate('+[12, 0]+') rotate(' + (90 - center) + ')';
	 					}

	 				})
	 				.attr('font-size', function(d, i){
	 					if(d.percent <= 0.1){
	 						return 0;
	 					}
	 					else{
	 						return 3;
	 					}
	 				})
	 				.text(function(d){
	 					return d3.round(d.percent * 100, 0) + '%';
	 				});
	 			})
	 			.on('mouseout', function(d, i){
//					var sizeScale = d3.scale.sqrt().domain(sizeExtent).range([0, 10/4 *
//					Math.pow(2, map.getZoom())]);
	 				d3.select(this).selectAll('g').selectAll('path')
	 				.attr('d', function(g, i){
	 					var arcFun = d3.svg.arc()
			 		    .outerRadius(sizeScale(d.size))
			 		    .innerRadius(0);
	 					return arcFun(g);
	 				});

	 				d3.select(this).selectAll('g').selectAll('text').remove();
	 			});

	 		});
	 		d3Overlay.addTo(map);

	 		if(!overlayInfo){
		 		overlayInfo = L.control();
	
		 		overlayInfo.onAdd = function (map) {
		 			var div = L.DomUtil.create('div', 'info legend');
		 			var labels = [];
	
					for (var i = 0; i < acled_event_types.length; i++) {
						labels.push(
							'<i style="background:' + color(i) + '"></i> ' + acled_event_types[i]);
					}
	
					div.innerHTML = labels.join('<br>');
					return div;
		 		};
	
		 		overlayInfo.addTo(map);
	 		}
	 	}
	});
}
function pieBtnClick(){
	$('#piechartBtn').click(function(e){
		if($(this).hasClass('active')){
			$(this).removeClass('active');
		}
		else{
			$(this).addClass('active');
		}
		
		
		if($(this).hasClass('active')){
			updatePieChart();
		}
		else{
			map.removeLayer(d3Overlay);
			map.removeControl(overlayInfo);
			d3Overlay = null;
			overlayInfo = null;
		}
	});
}


function getYearSlider() {

	var margin = {top: 0, right: 35, bottom: 20, left: 35},
    width = 1200 - margin.left - margin.right,
    height = 50 - margin.top - margin.bottom;

	var x = d3.scale.linear()
	    .domain([minYear - .4, maxYear + 1.4])
	    .range([0, width]);

	var brush = d3.svg.brush()
	    .x(x)
	    .extent([minYear, maxYear + 1])
	    .on("brushend", brushended);

	var svg = d3.select("#yearSlider").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("rect")
	    .attr("class", "grid-background")
	    .attr("width", width)
	    .attr("height", height);

	svg.append("g")
	    .attr("class", "x grid")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.svg.axis()
	        .scale(x)
	        .orient("bottom")
	        .ticks(30)
	        .tickSize(-height)
	        .tickFormat(d3.format("d")))
	  .selectAll(".tick")
	    .classed("minor", function(d) { return d; })

	var gBrush = svg.append("g")
	    .attr("class", "brush")
	    .call(brush)
	    .call(brush.event);

	gBrush.selectAll("rect")
	    .attr("height", height);

	function brushended() {
	    if (!d3.event.sourceEvent) return;

	    var extent0 = brush.extent();
	    var extent1 = extent0.map(Math.round);

	    if (extent1[0] >= extent1[1]) {
	        extent1[0] = Math.floor(extent0[0]);
	        extent1[1] = Math.ceil(extent0[1]);
	    }

	    d3.select(this).transition()
	        .call(brush.extent(extent1))
	        .call(brush.event);

	    minYear = extent1[0];
	    maxYear = extent1[1] - 1;
	    topTradeCountryData = null;
	    if(showTriads){
	    	updateTriads();
	    }
	    else{
	    	updateMap();
	    }
	    if(d3Overlay){
	    	map.removeLayer(d3Overlay);
	    	updatePieChart();
	    }
	}
}

function updateTriads(){
	if(triadLinksOverlay){
		map.removeLayer(triadLinksOverlay);
	}
	var config = {
		'items' : JSON.stringify(item),
		'mortifPos' : mortifPos,
		'minYear': minYear,
		'maxYear': maxYear,
		'type' : triadValueType,
		'grouped' : $('#groupedBtn').hasClass('btn-down') ? true : false
	};
	$.ajax({
	 	url: service_url + 'loadtriaddata?callback=?',
	 	data: config,
	 	dataType: 'jsonp',
	 	beforeSend:function(){
	 		$(loading).fadeIn(200);
	 	},
	 	success: function(result){
	 		console.log('result triad', result);
	 		$(loading).fadeOut(200);
	 		var countryValueHashMap = d3.map(result, function(d){
	 			return d.country;
	 		});
	 		var extent = d3.extent(result, function(d){
	 			return d.value;
	 		});
	 		extent[0] = 0;
	 		if(extent[1] == 0){
	 			for(var layer in layers){
		 			layers[layer].setStyle({
		 				fillOpacity: 0.7,
		 				fillColor: 'white'
		 			});
		 		}	 	
	 		}
	 		else{
	 			console.log('extent', extent);
		 		var colorScale = d3.scale.quantize().domain(extent).range(triad_count_color);
		 		
		 		for(var layer in layers){
		 			var item = countryValueHashMap.get(POPtoFAO[layer]);
		 			if(item){
		 				var value = item.value;
		 			}
		 			else{
		 				value = 0;
		 			}
		 			layers[layer].setStyle({
		 				fillOpacity: 0.7,
		 				fillColor: colorScale(value)
		 			});
		 		}	 		
	 		}
	 		
	 		if(triadInfo){
//	 			triadInfo.removeFrom(map);
	 			map.removeControl(triadInfo);
	 			triadInfo = null;
	 		}
	 		
	 		triadInfo = L.control();
			
	 		triadInfo.onAdd = function (map) {
	 			var div = L.DomUtil.create('div', 'info legend');
	 			var labels = [];
				
				var interval = (extent[1] - extent[0]) / (triad_count_color.length - 1);
				var breaks = d3.range(0, triad_count_color.length).map(function(d){
					return d * interval;
				});
				
		 		for (var i = 0; i < triad_count_color.length; i++) {	
		 			if(triadValueType == 'count')
		 			{
		 				if(i === triad_count_color.length - 1)
		 					labels.push('<i style="background:' + triad_count_color[i] + '"></i> ' + d3.round(extent[1], 0));
		 				else
		 					labels.push('<i style="background:' + triad_count_color[i] + '"></i> ' + d3.round(breaks[i], 0));
		 			}
		 			else{
		 				labels.push('<i style="background:' + triad_count_color[i] + '"></i> ' + d3.round(breaks[i], 2));
		 			}
		 		}
	
		 		div.innerHTML = labels.join('<br>');
		 		return div;
		 	};
		 	
		 	
		 	triadInfo.addTo(map);
	 	}
	});
	$(legend).hide(1000);
	
}

function triadSelect(){

	var grouped = false;
	var data = [d3.range(1, 11),
		       	d3.range(11, 21),
		       	d3.range(21, 31)];

	if($('#groupedBtn').hasClass('btn-down')) {
		console.log('grouped')
		grouped = true;
		data = [[1,2,3,4,5],[6,7,8,9],[10,11,12,13]];
	}

	d3.select("#mortif-label").select('div').remove();
	make_mortif_figure(d3.select("#mortif-label").append('div'), 1, grouped);


	var divs = d3.select('#triad-type-select').selectAll('div')
		.data(data);

	divs.enter().append('div')
		.attr('class', 'col-sm-4');

	var options = divs.selectAll('button')
		.data(function(d){return d;});

	options.enter()
		.append('button')
		.attr('class', 'mortifBtn');
	
	options.exit().remove();

	options.each(function(d, i){
		d3.select(this).select('svg').remove();
		make_mortif_figure(d3.select(this), d, grouped);	
	});
	
	options.on('click', function(d, i){
		d3.select('#mortif-label').select('div').select('svg').remove();
		make_mortif_figure(d3.select("#mortif-label").select('div'), d, grouped);
		mortifPos = d;
		if(showTriads && item && mortifPos){
			selectedCountry = null;
			updateTriads();
		}
	});

}

$('input[name=triad-value-radio]').change(function(){
	triadValueType = $(this).val();
	if(showTriads){
		updateTriads();
	}
});

$('#removeTriadLinksBtn').click(function(){
	if(triadLinksOverlay){
		map.removeLayer(triadLinksOverlay);
	}
});


$('#countryClusterBtn').click(function(){
	if(!simThreshold){
		alert('Please choose a similairty threshold');
		return; 
	}
	
	if(topTradeCountryData){
		clusterCountriesBasedOnTradeSimilarity();
	}
	else{
		$(clusterLoading).show( );
		loadTopTradeCountryData(clusterCountriesBasedOnTradeSimilarity);
	}
});

$(itemClusterBtn).click(function(){
	if(!simThreshold){
		alert('Please choose a similarity threshold');
		return;
	}
	loadItemTopTradeCountry();
});
/*
 * Load the trade data for each country
 */
function loadTopTradeCountryData(callback){
	$.ajax({
	 	url: service_url + 'dbtradedata?' +
	 		'valToShow=' + valToShow + '&' + 
	 		'items=' + JSON.stringify(item) + '&' +
	 		'direction=' + direction + '&' +
	 		'minYear=' + minYear + '&' +
	 		'maxYear=' + maxYear + '&' +
	 		'limit=' + simThreshold + '&' +
	 		'callback=?',
	 	dataType: 'jsonp',
	 	beforeSend : function(){
	 		d3.select('#trade-cluster-div').select('svg').remove();
	 	},
	 	success: function(result){
	 		topTradeCountryData = result;
	 		callback();
	 	}
	});
}

function loadItemTopTradeCountry(){
	var url = service_url + 'dbtradedata?callback=?'
	var config = {
		'valToShow' : 7,
		'country': POPtoFAO[country],
		'direction' : direction,
		'minYear' : minYear,
		'maxYear' : maxYear,
		'limit' : simThreshold
	};
	$.ajax({
		url : url,
		data: config,
		dataType : 'jsonp',
		beforeSend : function(){
			d3.select('#trade-cluster-div').select('svg').remove();
			$(clusterLoading).show();
			
		},
		success : function(result){
			$(clusterLoading).hide(500);
			clusterItemsBasedOnTradeSimilarity(result);
		},
		error : function(jqXHR, textStatus, errorThrown ){
			console.log(textStatus);
			console.log(errorThrown);
		}
	});
}

function clusterItemsBasedOnTradeSimilarity(data){
	
	var nodes = data2nodes();
	HC = new dm.HierachicalCluster().data(nodes).dist_metric(function(a, b){
		var i, j;
		var s = 0;
		for(i = 0; i < a.length; i++){
			for(j = 0; j < b.length; j++){
				if(a[i] === b[j]){
					++s;
				}
			}
		}	
		return 1 -  s / simThreshold;
	})
	.dist_fun('max')
	.init()
	.cluster();
	
//	console.log('HC root', JSON.stringify(HC.root()));
	var clustering = HC.cut_opt('distance').cut($("#trade-cluster-dist-threshold-slider").slider('value'));
	clustering_flag = 'item';
	drawClustering(clustering, clustering_flag);
	function data2nodes(){
		var nodeMap = d3.map();
		var trade;
		var i, node;
		for(i = 0; i < data.length; i++){
			trade = data[i];
			node = nodeMap.get(trade.ItemCode);
			if(!node){
				node = {
					'name' : trade.ItemCode,
					'value' : {
						'point' : [trade.Partner]
					}
				}
				nodeMap.set(trade.ItemCode, node);
			}
			else if(node.value.point.length < simThreshold){
				node.value.point.push(trade.Partner);
			}
		}
		return nodeMap.values();
	}
}

/*
 * Cluster countries based on Trade Similarity
 */
function clusterCountriesBasedOnTradeSimilarity(){
	var container = 'trade-cluster-div';
	$(clusterLoading).hide(500);
//	console.log('topTradeCountryData', JSON.stringify(topTradeCountryData));
	var data = data2nodes().filter(function(d){
		return layers[FAOtoPOP[d.name]];
	});
	
//	console.log('nodes', data);
//	console.log('cluster data', JSON.stringify(data));
//	console.log('simThreshold', simThreshold);
	var dist_metric = function(a, b){
		var i, j;
		var s = 0;
		for(i = 0; i < a.length; i++){
			if(b.indexOf(a[i]) >= 0){
				++s;
			}
		}	
		return 1 -  s / (simThreshold + 1);
	};
	HC = new dm.HierachicalCluster().data(data).dist_metric(dist_metric)
	.name_fun(function(d){
		return (d.id * 10000).toString();
	})
	.dist_fun('max')
	.init()
	.cluster();
	
	var pairs = HC.leafPairs();
//	for(var i = 0; i < pairs.length; i++){
//		if(pairs[i].dist < 1){
//			console.log('p ' + pairs[i].dist);
//		}
//	}
//	console.log('pairs', JSON.stringify(HC.leafPairs()));
//	var str = JSON.stringify(HC.root());
//	d3.select('#' + container).append('a').attr('download', 'info.txt').attr('id', 'downloadlink').html('Download');
//	(function () {
//		var textFile = null,
//		  makeTextFile = function (text) {
//		    var data = new Blob([text], {type: 'text/plain'});
//	
//		    // If we are replacing a previously generated file we need to
//		    // manually revoke the object URL to avoid memory leaks.
//		    if (textFile !== null) {
//		      window.URL.revokeObjectURL(textFile);
//		    }
//	
//		    textFile = window.URL.createObjectURL(data);
//	
//		    return textFile;
//		  };
//		    var link = document.getElementById('downloadlink');
//		    link.href = makeTextFile(str);
//		    link.style.display = 'block';
//
//	})();
//	console.log('HC root', JSON.stringify(HC.root()));
	var clustering = HC.cut_opt('distance').cut($("#trade-cluster-dist-threshold-slider").slider('value'));
	clustering_flag = 'country';
	drawClustering(clustering, clustering_flag);
	function data2nodes(){
		var source, target;
		if(direction === EXPORT){
			source = 'Source';
			target = 'Partner';
		}
		else{
			source = 'Source';
			target = 'Partner';
		}
		var nodeMap = d3.map();
		var trade;
		var i, node;
		
		for(i = 0; i < topTradeCountryData.length; i++){
			trade = topTradeCountryData[i];
			node = nodeMap.get(trade[source]);
			if(!node){
				node = {
					'name' : trade[source],
					'value' : {
						'point' : [trade[source], trade[target]]
					}
				}
				nodeMap.set(trade[source], node);
			}
			else if(node.value.point.length < (simThreshold + 1)){
				node.value.point.push(trade[target]);
			}
		}
		return nodeMap.values();
	}
}

function drawClustering(clustering, clustering_flag){
	var container = 'trade-cluster-div';
	d3.selectAll('.cluster-nodes-tooltip').remove();
	
	var tooltip = d3.select('#' + container)
	.append('div')
	.attr('class', 'cluster-nodes-tooltip')
	.attr("z-index","99")
	.style('opacity', 0)
	.style('position', 'absolute')			
    .style('text-align', 'center')								
    .style('padding', '2px')				
    .style('font', '15px sans-serif')
   // .style('fill', 'white')
    .style('background', 'rgba(0,0,0,0.5)')	
    .style('border', '0px')
    .style('border-radius', '8px')
    .style('display', 'none');
	
	var root = {
		'name' : 'root',
		'children' : clustering.filter(function(d){
			return d.value.points.length > 1;
		}).map(function(d, i){
			return {
				'name' : d.name,
				'dist' : d.value.dist,
				'children' : d.value.points.map(function(child){
					return {
						'name' : child.name,
						'value' : {
							'point' : child.value.point
						},
						'size' : 100,
						'cluster_idx' : i
					};
				})
			};
		})
	};
	
//	console.log('root', root);
	
//	var tip = d3.tip()
//	.attr('class', 'd3-tip')
//	.offset([-10, 0])
//	.html(function(d) {
//		return "<span style='color:white'>" + d.dist + "</span>";
//	});
	
	
	var color = d3.scale.category20c();
	var width = 800, height = 600;
	var margin = {left:10, right:10, bottom:10, top:10};
	var W = width - margin.left - margin.right;
	var H = height - margin.top - margin.bottom;
	
	var div = d3.select('#' + container);
	if(div.select('svg')){
		div.select('svg').remove();
	}
	
	
	var svg = div.append('svg').attr('width', 800).attr('height', 600);
//	svg.call(tip);
	
	var g = svg.append('g')
	.attr('transform', 'translate(' + [margin.left, margin.right] + ')');
	
	var bubble = d3.layout.pack().sort(null).size([W, H])
	.value(function(d){
		return d.size;
	})
	.padding(1.5);
	
	var nodes = g.selectAll('.cluster-nodes')
	.data(bubble.nodes(root).filter(function(d){
		return (!d.children) || (!d.children.children);
	}))
	.enter().append('g')
	.attr('class', 'cluster-nodes')
	.attr('transform', function(d){
		return 'translate(' + [d.x, d.y] + ')';
	});
	
	nodes.append('circle')
	.attr('r', function(d){
		return d.r;
	})
	.attr('stroke', 'black').attr('stroke-width', 1)
	.attr('fill', function(d){
		if(!d.children)
			return color(d.cluster_idx);
		else{
			return 'white';
		}
	});
	
	nodes
	.filter(function(d){
		return !d.children;
	})
	.append('text')
	.attr('dominant-baseline', 'middle')
	.attr('text-anchor', 'middle')
	.text(function(d){
		var name;
		if(clustering_flag === 'item'){
			name = itemCodes[d.name];
			if(name){
				return name.substring(0, d.r/3);
			}
			else{
				console.log('d.name', d.name);
			}
		}
		else if(clustering_flag === 'country'){
			var layer = layers[FAOtoPOP[d.name]];
			if(layer){
				name = layer.feature.properties.NAME;
				
				return name.substring(0, d.r/3);
			}
			else{
//				console.log('d.name', d.name)
			}
		}
	});
	
	nodes
	.on('mouseover',function(d, i){
		
		if((!d.dist) && (!d.name || d.name === 'root')){
			
		}
		else{
			var mouse = d3.mouse(d3.select('#' + container).select('svg').node());
			
			tooltip.selectAll('div').remove();
			tooltip
			.style("padding-left", "5px")
			.style("padding-right", "5px")
			.style('width', function(g, i){
				return '150px';//d.dist.visualLength();
			})//80 + 'px')
	//		.style('height', 20 + 'px')
			.style("left", (mouse[0] + 20) + "px")		
	        .style("top", (mouse[1] - 30) + "px")
	        .style('z-index', 10);
			
			tooltip.append('div')
			.style('width', function(g, i){
				return '100px';//d.dist.visualLength();
			})//80 + 'px')
	//		.style('height', 20 + 'px')
	//		.style('overflow', 'auto')
			//.style("font-color","white")
			//.style("font-size","18px")
			.append("font")
			.attr("color","white")
	//			.attr("size",10)
			/*.append('span')
			.attr('color', 'white')*/			
			//.append("text")
			
			//.style("fill","white")
			
			.append("b")
			.html(function(){
				if(clustering_flag === 'item'){
					if(d.hasOwnProperty('dist')){
						return d3.round(1-d.dist, 2);
					}
					else if(d.name && d.name !== 'root')
						return itemCodes[d.name];
					else{
						return null;
					}
				}
				else if(clustering_flag === 'country'){
					if(d.hasOwnProperty('dist')){
						return d3.round(1-d.dist, 2);
					}
					else if(d.name && d.name !== 'root'){
						return layers[FAOtoPOP[d.name]].feature.properties.NAME;
					}
					else{
						return null;
					}
				}
			});
			
			
			tooltip
	        .style('display', null)
	        .style("opacity", 1);
		}
	}).on('mouseout', function(d, i){
		tooltip
		.style('opacity', 0);
		
		tooltip
		.style('display', 'none');
	});
	
}

function initSlider(){
	var width = 850;
	var height = 20;
	
	var s_width = 800;
	var pad = s_width / 10;
	
	var margin = {
		'left' : (width - s_width) / 2,
		'right' : (width - s_width) / 2,
		'bottom' : 0,
		'top' : 0
	};
	var svg = d3.select('#trade-cluster-dist-threshold-slider-ticks').append('svg')
	.attr('width', width)
	.attr('height', height);
	
	var g = svg.append('g').attr('transform', function(){
		return 'translate(' + [margin.left, margin.top] + ')';
	});
	
	var g_enter = g.selectAll('.trade-cluster-dist-threshold-slider-ticks-g')
	.data(d3.range(1, -0.1, -0.1))
	.enter()
	.append('g').attr('class', 'trade-cluster-dist-threshold-slider-ticks-g');
	
	g_enter.append('line')
	.attr('x1', function(d, i){
		return i * pad; 
	})
	.attr('x2', function(d, i){
		return i * pad;
	})
	.attr('y1', 0)
	.attr('y2', 8)
	.style('stroke', 'black')
	.style('stroke-width', '1px');
	
	g_enter.append('text')
	.attr('y', 10)
	.attr('x', function(d, i){
		return i * pad;
	})
	.attr('text-anchor', 'middle')
	.attr('dominant-baseline', 'hanging')
	.attr('font-size', 8)
	.text(function(d){
		return d;
	});
	
	$("#trade-cluster-dist-threshold-slider").slider({
		value:1,
		range: false,
		min: 0,
		max: 1,
		step: 0.1,
		slide: function(event, ui){
			var clustering = HC.cut_opt('distance').cut(ui.value);
			
			drawClustering(clustering, clustering_flag);
		}
	});
}


function getHoverBarCharts(layer) {
	var props = layer.feature.properties;
	var countryCode = POPtoFAO[props.UN];
	$.ajax({
	 	url: service_url + 'dbtoppercentdata?' + 
	 		'country=' + countryCode + '&' + 
	 		'valToShow=' + valToShow + '&' +
	 		'direction=' + direction + '&' +
	 		'minYear=' + minYear + '&' +
	 		'maxYear=' + maxYear + '&' +
	 		'callback=?',
	 	dataType: 'jsonp',
	 	success: function(result){
	 		
	 		var data = [];
	 		for(var i in result) {
	 			data.push({'Country':result[i][0].Source})
	 			for(var j in result[i]) {
		 			data[i][itemCodes[result[i][j].ItemCode]] = result[i][j].Value;
		 		}
	 		}

			var scale = {
				y: d3.scale.linear()
			};

			var totalWidth = 500;
			var totalHeight = 200;

			scale.y.domain([0, 100]);
			scale.y.range([totalHeight, 0]);

			var ages = [30, 22, 33, 45];
			var barWidth = 20;

			var div = document.createElement("div");

			var chart = d3.select(div).append('svg')
				.attr({
					'width': totalWidth,
					'height': totalHeight
			});

			var bars = chart
				.selectAll('g')
				.data(ages)
				.enter()
				.append('g');

			bars.append('rect')
				.attr({
					'x': function (d, i) {
						return i * barWidth;
					},
					'y': scale.y,
					'height': function (d) {
						return totalHeight - scale.y(d);
					},
					'width': barWidth - 1
				});

			layer.setPopupContent('<div width=200 height=200><svg><rect width=20 height=20></rect></svg>afdad<div>')
		}
	});
}
