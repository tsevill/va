// Page elements
var map1				= $('#map1');
var map2                = $('#map2');
var map3                = $('#map3');
var map4                = $('#map4');
var legend 				= $('#legend');
var loading 			= $('#loading');

// Global vars
var valToShow       = null;
var pType           = null
var simThreshold    = null;
var direction       = null;
var minYear         = null;
var maxYear         = null;
var year            = null;
var item            = [];
var country         = null;
var mortifPos       = 1;
var showTriads      = false;
var triadValueType  = 'count';
var itemCodes       = {};
var FAOtoPOP        = {};
var POPtoFAO        = {};
var layers          = [];
var topTradeCountryData = null;
var shpFile;
var map;
var selectedCountry;
var HC;
var clustering_flag = 'country';

$(document).ready(init);

socket.on('message', function(msg){
    console.log(msg);
    valToShow = msg.valToShow;
    direction = msg.direction;
    minYear = msg.minYear;
    maxYear = msg.maxYear;
    item = msg.item;
    country = msg.country;
    simThreshold = msg.simThreshold;
    pType = msg.pType;
    selectedCountry = layers[country];    
    updateMap();
    selectedCountry.setStyle(countryHover);
    selectedCountry.setStyle(countryClicked);
});

function init() {
    // Get viewport size and set map height
    $(map1).height($(window).height()/2);
    $(map2).height($(window).height()/2);
    $(map3).height($(window).height()/2);
    $(map4).height($(window).height()/2);

    // Load base map tiles and shp geometry
    maps = loadBaseMaps();
    map1 = maps[0];
    map2 = maps[1];
    map3 = maps[2];
    map4 = maps[3];
    
    shpFile = loadShpFile("./data/worldTest");
    getDBCodes();
}

// loadBaseMap() loads all of the tiles from Mapbox,
// sets the initial position and zoom of the map
function loadBaseMaps() {
    L.mapbox.accessToken = MBTOKEN;
    var options = {
        center: [0, 0],
        zoom: 1,
        // minZoom: 1,
        //maxBounds: [[-57,-175],[84,178]],
        attributionControl: false,
        zoomControl: false
    }
    var map1 = L.mapbox.map('map1', 'mapbox.light', options);
    var map2 = L.mapbox.map('map2', 'mapbox.light', options);
    var map3 = L.mapbox.map('map3', 'mapbox.light', options);
    var map4 = L.mapbox.map('map4', 'mapbox.light', options);

    // map1.fitWorld();
    // map2.fitWorld();
    // map3.fitWorld();
    // map4.fitWorld();

    L.mapbox.styleLayer(MBSTYLE).addTo(map1);
    L.mapbox.styleLayer(MBSTYLE).addTo(map2);
    L.mapbox.styleLayer(MBSTYLE).addTo(map3);
    L.mapbox.styleLayer(MBSTYLE).addTo(map4);
    return [map1, map2, map3, map4];
}

// loadShpFile loads the local shp file and the geojson
function loadShpFile(url) {
    var result = {};
    shp(url).then(function(geojson){
        result.layer = L.geoJson(geojson, {
            style: countryInitial,
            onEachFeature: onEachFeature
        }).addTo(map1);
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

function onEachFeature(feature, layer) {
    layers[layer.feature.properties.UN] = layer;
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
                console.log(result);
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
}

function updateLegend(max) {
    $(legend).show(1000);
    legend.empty();

    if(valToShow == PERCENT) {
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
        },
        success: function(result){
            topTradeCountryData = result;
            callback();
        }
    });
}