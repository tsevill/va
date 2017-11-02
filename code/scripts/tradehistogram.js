var selectedYear;
var selectedType;
var items;
var countries;
var rawData;
var rawJSON;
var filteredData;
var numberofBins = 10;
var pages = [ 15, 50, 100 ];
var pageSize = 24;
var selectedPage = 0;
var linkSizeThresholds = [ 1, 5, 20, 50 ];
var selectedLinkSizeThreshold = 1;
var selectedLinkSizeSecondaryThreshold = 1;
var byWeight = false;
var percents = [ 0, 1 ];
var minYear = 2013;
var maxYear = 2013;
var availableMinYear = 1986;
var availableMaxYear = 2013;
var itemCodes;
var FAOtoPOP;
var POPtoFAO;
var ISO3toCC;
var siFormat = function(d) {
	if (d < 1000)
		return d;
	return d3.format('.3s')(d).replace('G', 'B')
};
var layersToCascade = 1;
var simulate = false;
var itemToScale = [ {
	key : 56,
	value : 5000000
}, {
	key : 30,
	value : 2500000
}, {
	key : 236,
	value : 20000000
}, {
	key : 15,
	value : 1500000
}, ]

var numberOfPages = function() {
	if (rawData) {
		return Math.ceil(filteredData.length / pageSize);
	} else {
		return 1;
	}
}
var selectedItem;

var updateHistograms = function() {
	var data = []
			.concat(rawData.filter(function(d) {
				if (!selectedItem)
					return true;
				return +d.key == +selectedItem;
			}), [])
			.map(
					function(d) {
						var newD = {
							key : d.key,
							values : [].concat(d.values),
						}
						var count = d.values.length;
						newD.values = newD.values
								.filter(function(d, i) {
									if (!countries[d.ExportingCountryCode]
											|| !countries[d.ImportingCountryCode]) {
										return false;
									}
									return (+(d.TradeLinksValue / countries[d.ExportingCountryCode].TotalExportValue) >= percents[0])
											&& (+(d.TradeLinksValue / countries[d.ExportingCountryCode].TotalExportValue) <= percents[1]);
								})
						return newD;
					}, [])
	getTriadDistribution(data);
	drawAllHistograms(data);
}
var convert = [ 0, 3, 7, 8, 1, 2, 9, 10, 4, 5, 11, 13, 12, 6 ];
var unconvert = [ 0, 4, 5, 1, 8, 9, 13, 2, 3, 6, 7, 10, 12, 11 ];
var normalDistribution;
var init = true;
var getTriadDistribution = function() {
	d3.range(1, 14, 1).forEach(function(d) {
		d3.select("#triad_" + d).selectAll('.textPercentage').remove()
	})

	var distributionChartMargin = {
		bottom : 50,
		left : 50,
		top : 50,
		right : 50
	}, width = 600 - distributionChartMargin.left
			- distributionChartMargin.right, height = 400
			- distributionChartMargin.bottom - distributionChartMargin.top;
	var svg, g;
	var x = d3.scaleLinear().domain([ 1, 13 ]).rangeRound([ 0, width ]);

	var y = d3.scaleLinear().domain([ -1, 1 ]).rangeRound([ height, 0 ]);

	var triadLine = d3.line().x(function(d) {
		return x(d.triad);
	}).y(function(d) {
		return y(d.y);
	});
	if (init) {
		$.ajax({
			url : service_url + 'dbtriaddistribution?baseline=1&callback=?',
			dataType : 'jsonp',
			success : function(json) {

				svg = d3.select("#triadDistributionChartDiv").append('svg')
						.attr('id', 'distributionChart').attr('height', 400)
						.attr('width', 600);
				g = svg.append("g").attr('id', 'distributionChartGroup').attr(
						"transform",
						"translate(" + distributionChartMargin.left + ","
								+ distributionChartMargin.top + ")");
				g.append('text').text('Normal TSP').style('font-size', '2em')
						.attr('x', 20).attr('y', 350).style('text-anchor',
								'center').style('stroke', 'steelblue')
				g.append('text').text('Filtered TSP').style('font-size', '2em')
						.attr('x', 300).attr('y', 350).style('text-anchor',
								'center').style('stroke', 'green')
				g.append('g').attr('id', 'normalDistributionGroup')
				g.append('g').attr('id', 'currentDistributionGroup')
				g.append('g').attr('id', 'normalDistributionPercentageGroup')
				g.append('g').attr('id', 'currentDistributionPercentageGroup')
				g.append("line").attr('x1', 0).attr('y1', height / 2).attr(
						'x1', width).attr('y2', height / 2).style('stroke',
						'black')
				g.append("g").attr("class", "axis axis--x").attr("transform",
						"translate(0," + height + ")").call(
						d3.axisBottom().scale(x));
				g.append("g").attr("class", "axis axis--y").call(
						d3.axisLeft().scale(y));

				var thisDistribution = json.map(function(d) {
					d.count = +d.count;
					d.triad = convert[+d.type]
					return d;
				})

				thisDistribution.sort(function(a, b) {
					return a.triad < b.triad ? -1 : 1
				});

				var totalTriads = thisDistribution.reduce(function(acc, curr) {
					return +acc + (+curr.count);
				}, 0);

				randomDistribution = [ 0, 0.40653 * totalTriads,
						0.05534 * totalTriads, 0.084372 * totalTriads,
						0.043102 * totalTriads, 0.23595 * totalTriads,
						0.071408 * totalTriads, 0.035059 * totalTriads,
						0.0010128 * totalTriads, 0.0074255 * totalTriads,
						0.022976 * totalTriads, 0.0077554 * totalTriads,
						0.02887 * totalTriads, 0.00020091 * totalTriads, ];

				stdDev = [ 0, 0.0011538, 0.00099536, 0.0010136, 0.0011988,
						0.0016077, 0.0013727, 0.0011678, 0.00017896,
						0.00054766, 0.00084201, 0.00051607, 0.0012926,
						0.00050551, ];

				normalDistribution = thisDistribution;
				thisDistribution.map(function(d, i) {
					d.nRandom = randomDistribution[d.triad];
					d.Z = (d.count - d.nRandom) / stdDev[d.triad];
					d.percent = d.count / totalTriads;
					return d;
				});
				var zSquared = thisDistribution.reduce(function(acc, curr) {
					return acc + (curr.Z * curr.Z);
				}, 0);
				thisDistribution.map(function(d) {
					d.normalizedZ = d.Z / (Math.sqrt(zSquared));
					d.y = d.normalizedZ;
					return d;
				});

				d3.select('#normalDistributionGroup').selectAll('.normal-line')
						.data([ thisDistribution ]).enter().append('path')
						.classed('normal-line', true).attr('d', function(d) {
							return triadLine(d);
						});

				thisDistribution.forEach(function(d) {
					d3.select("#triad_" + d.type).select('g').append('text')
							.attr('x', '11px').attr('dy', '3em').attr('id',
									"triad_" + unconvert[d.type] + "_percent");
				})

				d3.select('#normalDistributionPercentageGroup').selectAll(
						'.normalpercentline').data(
						[ thisDistribution.map(function(d) {
							d.y = d.percent;
							return d;
						}) ]).enter().append('path').classed(
						'normalpercentline', true).attr('d', function(d) {
					// return triadLine(d);
				});

			}
		})
		init = false;
	} else {
		var countries = graph.nodes.map(function(d) {
			return d["Country Code"];
		}).join();
		$.ajax({
			url : service_url + 'dbtriaddistribution?itemCode=' + selectedItem
					+ '&year=' + maxYear + '&countries=' + countries
					+ '&callback=?',
			dataType : 'jsonp',
			success : function(json) {
				var thisDistribution = json.map(function(d) {
					d.count = +d.count;
					d.triad = convert[+d.type]
					return d;
				})

				thisDistribution.sort(function(a, b) {
					return a.triad < b.triad ? -1 : 1
				});

				var totalTriads = thisDistribution.reduce(function(acc, curr) {
					return +acc + (+curr.count);
				}, 0);

				randomDistribution = [ 0, 0.40653 * totalTriads,
						0.05534 * totalTriads, 0.084372 * totalTriads,
						0.043102 * totalTriads, 0.23595 * totalTriads,
						0.071408 * totalTriads, 0.035059 * totalTriads,
						0.0010128 * totalTriads, 0.0074255 * totalTriads,
						0.022976 * totalTriads, 0.0077554 * totalTriads,
						0.02887 * totalTriads, 0.00020091 * totalTriads, ];

				stdDev = [ 0, 0.0011538, 0.00099536, 0.0010136, 0.0011988,
						0.0016077, 0.0013727, 0.0011678, 0.00017896,
						0.00054766, 0.00084201, 0.00051607, 0.0012926,
						0.00050551, ];

				normalDistribution = thisDistribution;
				thisDistribution.map(function(d, i) {
					d.nRandom = randomDistribution[d.triad];
					d.Z = (d.count - d.nRandom) / stdDev[d.triad];
					d.percent = d.count / totalTriads;
					return d;
				});
				var zSquared = thisDistribution.reduce(function(acc, curr) {
					return acc + (curr.Z * curr.Z);
				}, 0);
				thisDistribution.map(function(d) {
					d.normalizedZ = d.Z / (Math.sqrt(zSquared));
					d.y = d.normalizedZ;
					return d;
				});
				var currentDistributionGroup = d3.select(
						'#currentDistributionGroup').selectAll('.line').data(
						[ thisDistribution ])

				currentDistributionGroup.enter().append('path').classed('line',
						true).attr('d', function(d) {
					return triadLine(d);
				});
				currentDistributionGroup.transition().attr('d', function(d) {
					return triadLine(d);
				});

				var currentDistributionPercentageGroup = d3.select(
						'#currentDistributionPercentageGroup').selectAll(
						'.percentline').data(
						[ thisDistribution.map(function(d) {
							d.y = d.percent;
							return d;
						}) ])

				currentDistributionPercentageGroup.enter().append('path')
						.classed('percentline', true).attr('d', function(d) {
							// return triadLine(d);
						});
				currentDistributionPercentageGroup.transition().attr('d',
						function(d) {
							// return triadLine(d);
						});

				thisDistribution.forEach(function(d) {
					d3.select("#triad_" + unconvert[d.type] + "_percent").text(
							percentFormat(d.count / totalTriads));
				})
			}
		});
	}
}

function standardDeviation(values) {
	var avg = average(values);

	var squareDiffs = values.map(function(value) {
		var diff = value - avg;
		var sqrDiff = diff * diff;
		return sqrDiff;
	});

	var avgSquareDiff = average(squareDiffs);

	var stdDev = Math.sqrt(avgSquareDiff);
	return stdDev;
}

function average(data) {
	var sum = data.reduce(function(sum, value) {
		return sum + value;
	}, 0);

	var avg = sum / data.length;
	return avg;
}

function changeYear() {
	var newYear = d3.select("#yearSelector").property("value");
	minYear = newYear;
	maxYear = newYear;
	getTradeHistogramData();
}

var getTradeHistogramData = function() {
	selectedPage = 1;
	d3.select('#tradeHistogramDiv').selectAll("*").remove();
	$('#loading').fadeIn(200);
	d3.select("#tradeHistogramsYears").text("");

	var margin = {
		top : 0,
		right : 35,
		bottom : 0,
		left : 35
	}, width = 600 - margin.left - margin.right, height = 20 - margin.top
			- margin.bottom;

	var x = d3.scaleLinear().domain([ 0, 100 ]).range([ 0, width ]);

	var brush = d3.brushX().extent([ 0, 100 ]).on("end", brushended);

	var svg = d3.select("#tradeHistogramFooter").append("g").attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

	svg.append("rect").attr("class", "grid-background").attr("width", width)
			.attr("height", height);

	svg.append("g").attr("class", "x grid").attr("transform",
			"translate(0," + height + ")").call(
			d3.axisBottom().scale(x).ticks(10).tickSize(-height).tickFormat(
					function(d) {
						return d + "% GDP"
					})).selectAll(".tick").classed("minor", function(d) {
		return d;
	})

	var gBrush = svg.append("g").attr("class", "brush").call(brush)

	gBrush.selectAll("rect").attr("height", height);

	function brushended() {
		if (!d3.event.sourceEvent)
			return;
		percents = d3.event.target.extent().map(function(d) {
			return d / 100
		});
		updateHistograms();
	}

	$.ajax({
		url : service_url + 'dbtradehistogramcountrydata?' + 'minYear='
				+ minYear + '&' + 'maxYear=' + maxYear + '&' + 'callback=?',
		dataType : 'jsonp',
		success : function(json) {
			$('#loading').hide();
			$("#main").show();
			if (!map)
				loadMap();
			for ( var countryIndex in countries) {
				totalExportValue = json.filter(function(d) {
					return d.ExportingCountryCode == countryIndex;
				}, []).map(function(d) {
					return +(d.TradeLinksValue);
				}).reduce(function(acc, curr) {
					return acc + curr;
				}, 0);
				totalImportValue = json.filter(function(d) {
					return d.ImportingCountryCode == countryIndex;
				}, []).map(function(d) {
					return +(d.TradeLinksValue);
				}).reduce(function(acc, curr) {
					return acc + curr;
				}, 0);
				countries[countryIndex].TotalImportValue = totalImportValue;
				countries[countryIndex].TotalExportValue = totalExportValue;
			}

			var nestedData = d3.nest().key(function(d) {
				return +(d.ItemCode);
			}).entries(json);
			rawData = [].concat(nestedData);
			rawJSON = json;

			nestedData = nestedData.filter(
					function(d) {
						d.values = d.values.filter(function(d) {
							return countries[d.ExportingCountryCode]
									&& countries[d.ImportingCountryCode];
						})
						return d.values.length > 1;
					}).sort(function(a, b) {
				return itemCodes[a.key] < itemCodes[b.key] ? -1 : 1
			}).map(
					function(d) {
						d.values.map(function(d) {
							d.importPercentage = +(d.TradeLinksValue)
									/ importsF(d.ImportingCountryCode,
											d.ItemCode);
						})
						return d;
					})

			if (!selectedItem) {
				selectedItem = nestedData[0].key;
			}
			d3.select("#tradeHistogramsYears").text(minYear + " to " + maxYear)
			drawAllHistograms(nestedData);
			getTriadDistribution(nestedData);
			function wait() {
				if (layers.length == 0) {
					setTimeout(wait, 100);
				} else {
					drawNetworkGraph(nestedData);
					updateNetworkGraph();
				}
			}
			wait();
			showPages();
		}
	});
}

function linkChange() {
	if (d3.select("#importLinks").node().checked) {
		d3.selectAll(".exportLink").style("display", "none")
		d3.selectAll(".importLink").style("display", "block")
	} else if (d3.select("#exportLinks").node().checked) {
		d3.selectAll(".importLink").style("display", "none")
		d3.selectAll(".exportLink").style("display", "block")
	} else {
		d3.selectAll(".importLink").style("display", "block")
		d3.selectAll(".exportLink").style("display", "block")
	}
}

var linkSizeThreshold = 0;
var linkSizePercentThreshold = 0;
var linkSizeSecondaryThreshold = 0;
var graph = {};
var force;
var linkScale;
var color = d3.scaleOrdinal(d3.schemeCategory20);

function updateNetworkGraph(data) {
	if (!data)
		data = rawData;
	var rawLinks = [];

	for ( var good in data) {
		if (selectedItem) {
			if (data[good].key == selectedItem) {
				rawLinks = rawLinks.concat(data[good].values);
			}
		} else {
			rawLinks = rawLinks.concat(data[good].values);
		}
	}

	links = rawLinks
			.map(
					function(d) {
						d.value = {
							original : +d.TradeLinksValue,
							adjusted : (selectedCountry && d.ExportingCountryCode == ISO3toCC[selectedCountry.feature.properties.ISO3]) ? +d.TradeLinksValue
									* (1 - exportReduction)
									: +d.TradeLinksValue,
						};
						return d;
					})
			.filter(
					function(d) {
						return d.ImportingCountryCode
								&& d.ExportingCountryCode
								&& ((!selectedCountry) || (d.ExportingCountryCode == ISO3toCC[selectedCountry.feature.properties.ISO3] || d.ImportingCountryCode == ISO3toCC[selectedCountry.feature.properties.ISO3]))
								// && d.value.original >= linkSizeThreshold
								&& d.value.original >= 10
								&& (!simulate || !selectedCountry || (d.ExportingCountryCode == ISO3toCC[selectedCountry.feature.properties.ISO3]))

					}, []);

	var uniqueImporters = links.map(function(d) {
		return d.ImportingCountryCode
	}).sort().filter(function(el, i, a) {
		if (i == a.indexOf(el))
			return 1;
		return 0
	}, []);
	if (simulate) {
		for (var index = 1; index <= layersToCascade; index++) {
			if (!selectedCountry || exportReduction == 0)
				break;
			links = links.concat(rawLinks.filter(function(d) {
				return uniqueImporters.indexOf(d.ExportingCountryCode) != -1;
			}, []));
			uniqueImporters = links.map(function(d) {
				return d.ImportingCountryCode
			}).sort().filter(function(el, i, a) {
				if (i == a.indexOf(el))
					return 1;
				return 0
			}, []);
		}
	}

	var uniqueExporters = links.map(function(d) {
		return d.ExportingCountryCode
	}).sort().filter(function(el, i, a) {
		if (i == a.indexOf(el))
			return 1;
		return 0
	}, []);

	uniqueExporters = uniqueExporters.filter(function(d) {
		return countries[d]
	}).map(function(d, i) {
		countries[d].index = i;
		return countries[d];
	});
	uniqueImporters = uniqueImporters.filter(function(d) {
		return countries[d]
	}).map(function(d, i) {
		countries[d].index = i;
		return countries[d];
	});

	var uniqueCountries = uniqueExporters.concat(uniqueImporters).filter(
			function(el, i, a) {
				if (i == a.indexOf(el))
					return 1;
				return 0
			}, []).sort(function(a, b) {
		return (a.TotalExportValue || 0) > (b.TotalExportValue || 0) ? -1 : 1
	})

	graph.links = d3.nest().key(function(d) {
		return d.source + "," + d.target;
	}).rollup(function(d) {
		return d.reduce(function(acc, curr) {
			return {
				adjusted : acc.adjusted + curr.value.adjusted,
				original : acc.original + curr.value.original,
			};
		}, {
			adjusted : 0,
			original : 0
		})
	}).entries(links.map(function(d) {
		return {
			source : d.ExportingCountryCode,
			target : d.ImportingCountryCode,
			good : itemCodes[d.ItemCode],
			value : d.value
		}
	})).map(function(d) {
		var sourceCC = d.key.split(",")[0];
		var targetCC = d.key.split(",")[1];
		return {
			source : uniqueCountries.filter(function(d) {
				return d["Country Code"] == sourceCC;
			}, [])[0],
			target : uniqueCountries.filter(function(d) {
				return d["Country Code"] == targetCC;
			}, [])[0],
			good : selectedItem ? itemCodes[selectedItem] : "All Goods",
			value : d.value,
		}
	}).sort(function(a, b) {
		return a.value.original > b.value.original ? -1 : 1;
	})

	graph.nodes = uniqueCountries;
	graph.uniqueExporters = uniqueExporters;

	radiusScale = d3.scaleLinear().domain(
			d3.extent(graph.nodes.map(function(d) {
				return d.TotalExportValue
			}))).range([ 10, 30 ])

	graph.nodes = graph.nodes
			.map(function(d) {
				d.radius = radiusScale(d.TotalExportValue);
				d.x = (layers[d["Country Code"]] ? layers[d["Country Code"]].feature.properties.LON * 5
						: 0)
						+ networkGraphWidth / 2;
				d.y = (layers[d["Country Code"]] ? -layers[d["Country Code"]].feature.properties.LAT * 10
						: 0)
						+ networkGraphHeight / 2;
						d.SelectedGoodTotalExport = rawLinks
								.reduce(
										function(acc, curr) {
											if (curr.ExportingCountryCode == d["Country Code"]) {
												return acc
														+ curr.value.original;
											} else {
												return acc;
											}
										}, 0),
						d.SelectedGoodTotalImport = rawLinks
								.reduce(
										function(acc, curr) {
											if (curr.ImportingCountryCode == d["Country Code"]) {
												return acc
														+ curr.value.original;
											} else {
												return acc;
											}
										}, 0),
						d.SelectedGoodReducedValue = rawLinks
								.reduce(
										function(acc, curr) {
											if (curr.ImportingCountryCode == d["Country Code"]) {
												return acc
														+ (curr.value.original - curr.value.adjusted);
											} else {
												return acc;
											}
										}, 0),
						d.DownstreamReduction = (d.SelectedGoodTotalExport == 0 || d.SelectedGoodReducedValue > d.SelectedGoodTotalExport) ? 1
								: d.SelectedGoodReducedValue
										/ d.SelectedGoodTotalExport
				return d;
			});
	if (simulate && selectedCountry) {
		graph.links = graph.links
				.map(
						function(d) {
							var exporter = d.source["Country Code"];
							var importer = d.target["Country Code"]
							d.value.adjusted = d.value.adjusted
									* (1 - d.source.DownstreamReduction);
							rawData.filter(function(d) {
								return d.key == selectedItem
							})[0].values.filter(function(d) {
								return d.ExportingCountryCode == exporter
										&& d.ImportingCountryCode == importer;
							})[0].value.adjusted = d.value.adjusted;
							return d;
						})
				.filter(
						function(d) {
							return (!layers[+d.target["Country Code"]].percentImportReduction || (layers[+d.target["Country Code"]].percentImportReduction && layers[+d.target["Country Code"]].percentImportReduction >= linkSizeSecondaryThreshold));
						})
		graph.nodes = graph.nodes.filter(function(d) {
			return selectedCountry.feature.properties.ISO3 == d["ISO3 Code"]
					|| graph.links.map(function(d) {
						return d.source["Country Code"]
					}).indexOf(d["Country Code"]) != -1
					|| graph.links.map(function(d) {
						return d.target["Country Code"]
					}).indexOf(d["Country Code"]) != -1;
		})
	}

	var linkData = networkGraphGroup.Links.selectAll('path').data(
			graph.links.filter(function(d) {
				return d.source && d.target
			}),
			function(d) {
				return d.source["Country Code"] + ","
						+ d.target["Country Code"];
			});
	linkData.exit().remove()

	linkScale = d3.scaleLinear().domain([ 0, itemToScale.filter(function(d) {
		return d.key == selectedItem
	})[0].value ]).range([ 1, 100 ]);
	percentageLinkScale = d3.scaleLinear().domain([ 0, 1 ]).range([ 1, 30 ]);
	linkWeight = function(d) {
		return (((d.value.original / (d.target.SelectedGoodTotalExport + d.target.SelectedGoodTotalImport)) >= linkSizePercentThreshold && d.value.original >= linkSizeThreshold)
		// || (selectedCountry && d.target["Country Code"] ==
		// ISO3toCC[selectedCountry.feature.properties.ISO3])
		? (byWeight ? linkScale(d.value.original)
				: percentageLinkScale(d.value.original
						/ (d.target.SelectedGoodTotalImport + d.target.SelectedGoodTotalExport)))
				: 0)
				+ 'px';
	}

	linkData
			.transition()
			.duration(750)
			.ease(d3.easeLinear)
			.style('stroke-width', linkWeight)
			.style(
					'stroke-dasharray',
					function(d) {
						if (d.value.adjusted == 0) {
							return [ 10, 50 ];
						}
						if (selectedCountry
								&& d.source["Country Code"] != ISO3toCC[selectedCountry.feature.properties.ISO3]) {
							return [ 10 ];
						}
					})
			.style(
					"stroke",
					function(d) {
						return (((d.value.original / (d.target.SelectedGoodTotalExport + d.target.SelectedGoodTotalImport)) >= linkSizePercentThreshold && d.value.original >= linkSizeThreshold) ? color(d.source["Country Code"])
								: "transparent")
					});

	var linkGroup = linkData
			.enter()
			.append("path")
			.style('stroke-width', linkWeight)
			.style(
					'stroke-dasharray',
					function(d) {
						if (d.value.adjusted == 0) {
							return [ 10, 50 ];
						}
						if (selectedCountry
								&& d.source["Country Code"] != ISO3toCC[selectedCountry.feature.properties.ISO3]) {
							return [ 10 ];
						}
					})
			.style("stroke", function(d) {
				return color(d.source["Country Code"]);
			})
			.on('mouseout', function(d) {
				tooltip.style('visibility', 'hidden')
			})
			.on('mousemove', function(d) {
				tooltip.html(linkToolTip(d))
				ttPosition();

			})
			.attr(
					"d",
					function(d) {
						var x1 = d.source.x, y1 = d.source.y, x2 = d.target.x, y2 = d.target.y;

						return d3.line().curve(d3.curveBasis)(
								[ [ x1, y1 ], [ x2, y1 ], [ x2, y2 ],
										[ x2, y2 ], [ x2, y2 ], [ x2, y2 ],
										[ x2, y1 ], [ x1, y1 ] ]);
					});

	linkData
			.classed(
					'exportLink',
					function(d) {
						if (selectedCountry
								&& d.source["Country Code"] == ISO3toCC[selectedCountry.feature.properties.ISO3]) {
							return true;
						}
						return false;
					})
			.classed(
					'importLink',
					function(d) {
						if (selectedCountry
								&& d.source["Country Code"] != ISO3toCC[selectedCountry.feature.properties.ISO3]) {
							return true;
						}
						return false;
					})

	var nodeData = networkGraphGroup.Nodes.selectAll("circle").data(
			graph.nodes.reverse(), function(d) {
				return d["Country Code"];
			})

	function dragged(d) {
		d3.select(this).attr("cx", d.x = d3.event.x).attr("cy",
				d.y = d3.event.y);
		force.stop().alpha(1).restart();
	}
	nodeData.exit().remove()
	nodeData.classed("inactive", false)
	nodeData.transition().duration(100).attr("r", function(d) {
		return d.radius;
	})
	nodeData.enter().append("circle").attr("r", function(d) {
		return d.radius;
	}).attr("fill", function(d) {
		return color(d["Country Code"]);
	}).on('mouseout', function(d) {
		tooltip.style('visibility', 'hidden')
	}).on('mousemove', function(d) {
		countryTooltip(d["ISO3 Code"], d3.event)
	}).on('click', function(d) {
		updateSelectedCountry(layers[+d["Country Code"]])
	}).call(d3.drag().on("drag", dragged));
	updateChoropleth();
	if (!force) {
		force = d3.forceSimulation().nodes(graph.nodes).force("collide",
				d3.forceCollide(function(d) {
					return d.radius + 10;
				})).on("tick", forceTick)
	}
	force.stop().alpha(1).restart();
	getTriadDistribution();

}

function ttPosition() {
	tooltip.style(
			'top',
			(d3.event.pageY + (d3.event.pageY / self.innerHeight < 0.5 ? 25
					: -1 * (tooltip.node().clientHeight - 70)))
					+ 'px').style(
			'left',
			(d3.event.pageX + (d3.event.pageX / self.innerWidth < 0.5 ? 25 : -1
					* (tooltip.node().clientWidth + 25)))
					+ 'px').style('visibility', 'visible')
}

var linkToolTip = function(d) {
	return '<h4>'
			+ d.source.Country
			+ ' > '
			+ d.target.Country
			+ '</h4>'
			+ '<h4>'
			+ d.good
			+ '</h4>'
			+ '<h4>$'
			+ siFormat(d.value.adjusted * 1000)
			+ '</h4>'
			+ '<h4>'
			+ percentFormat(d.value.original / d.target.SelectedGoodTotalImport)
			+ " of selected staple good imported"
			+ '</h4>'
			+ '<h4>'
			+ percentFormat(d.value.original / d.target.TotalImportValue)
			+ " of total staple goods imported"
			+ '</h4>'
			+ (simulate ? ('<h4>(Before: $' + siFormat(d.value.original * 1000) + ')</h4>')
					: '')
			+ (simulate ? ('<h4>(Delta: -$'
					+ siFormat((d.value.original - d.value.adjusted) * 1000) + ')</h4>')
					: '');
}
var networkGraphGroup = {};
var radiusScale;
var networkGraphWidth = 1600, networkGraphHeight = 1600;

function drawNetworkGraph(data) {
	d3.select("#network-graph").selectAll('svg').remove();
	var svg = d3.select("#network-graph").append('svg');

	svg.attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox",
			"0 0 " + networkGraphWidth + " " + networkGraphHeight).classed(
			"svg-content-responsive", true);

	svg.append("rect").attr("width", networkGraphWidth).attr("height",
			networkGraphHeight).style("fill", "none").style("pointer-events",
			"all").call(d3.zoom().scaleExtent([ 1, 15 ]).on("zoom", zoomed));

	var g = svg.append("g")

	function zoomed() {
		g.attr("transform", d3.event.transform);
	}

	networkGraphGroup.Links = g.append('g').attr("class", "links")
	networkGraphGroup.Nodes = g.append('g').attr("class", "nodes")
	updateNetworkGraph();

}
function forceTick() {
	d3.select('.nodes').selectAll("circle").attr(
			"cx",
			function(d) {
				if (Number.isNaN(d.x)) {
					d.x = layers[d["Country Code"]].feature.properties.LON * 5
							+ networkGraphWidth / 2;
				}
				d.x = Math.min(Math.max(d.x, 0 + radiusScale.range()[1] / 2),
						networkGraphWidth - radiusScale.range()[1])

				return d.x
			}).attr(
			"cy",
			function(d) {
				if (Number.isNaN(d.y)) {
					d.y = -layers[d["Country Code"]].feature.properties.LAT
							* 10 + networkGraphHeight / 2;
				}
				d.y = Math.min(Math.max(d.y, 0 + radiusScale.range()[1] / 2),
						networkGraphHeight - radiusScale.range()[1]);

				return d.y;
			});

	d3
			.select('.links')
			.selectAll("path")
			.attr(
					"d",
					function(d) {
						var x1 = d.source.x, y1 = d.source.y, x2 = d.target.x, y2 = d.target.y;

						return d3.line().curve(d3.curveBasis)(
								[ [ x1, y1 ], [ x2, y1 ], [ x2, y2 ],
										[ x2, y2 ], [ x2, y2 ], [ x2, y2 ],
										[ x2, y1 ], [ x1, y1 ] ]);
					});
}

function getDBTable(tableName, callback) {
	$.ajax({
		url : service_url + 'dbgettable/?tableName=' + tableName
				+ '&callback=?',
		dataType : 'jsonp',
		success : callback
	});
}

function getDBCodes() {
	// Get the countries table and store the codes in 2 lookup
	// dictionaries. One to lookup a POP code from an FAO code,
	// and one to look up an FAO code from a POP code
	getDBTable(
			'ALL_Countries',
			function(countries) {
				POPtoFAO = {};
				FAOtoPOP = {};
				for (i in countries) {
					if (countries[i]['POP_CountryCode'] != 0
							&& countries[i]['POP_CountryCode'] != 0) {
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
		items.sort(function(a, b) {
			if (a.Item < b.Item) {
				return -1;
			} else if (a.Item > b.Item) {
				return 1;
			} else {
				return 0;
			}
		});
		itemCodes = {};
		for (i in items) {
			itemCodes[items[i]['ItemCode']] = items[i]['Item'];
		}
	});
}

var drawAllHistograms = function(data) {
	if (!data) {
		data = [].concat(rawData);
	}

	d3.select('#tradeHistogramDiv').selectAll("*").remove()

	filteredData = data.filter(function(d) {
		return d.values.length >= selectedLinkSizeThreshold
	})

	var paginatedData = filteredData.filter(function(d, i) {
		return i >= ((selectedPage - 1) * pageSize)
				&& i < (selectedPage * pageSize);
	});

	var graphs = d3.select('#tradeHistogramDiv').selectAll('.thumbnail').data(
			paginatedData).enter().append('div').classed("thumbnail", true)
			.classed("col-sm-12", true).classed("inactive", function(d) {
				return selectedItem && (+d.key != +selectedItem)
			}).attr('id', function(d) {
				return "div_" + d.key;
			}).append('div').classed('svg-container-ws', true).append('svg')
			.attr('class', 'thumbnailCanvas')

	if (paginatedData.length == 0) {
		d3.select('#tradeHistogramDiv').append('h2').text(
				'No Data. Please refine filters.').on('click', function(d) {
			selectedPage = 1;
			selectedItem = null;
			updateHistograms();
		})
	}

	d3.selectAll('.thumbnailCanvas').on('click', function(d) {
		if (!selectedItem || selectedItem != d.key) {
			selectedItem = d.key;
			d3.selectAll(".thumbnail").classed("inactive", function(d) {
				return selectedItem && +d.key != +selectedItem
			})
			updateNetworkGraph();
		}
	}).each(function(d) {
		drawHistogram(this, d);
	});
	d3.selectAll('.filterButton').style('display', null);
	d3.selectAll('#loadingIcon').style('display', 'none');
	d3.select("#executeButton").style('display', null);
	showPages();
}

var p = Math.max(0, d3.precisionFixed(0.05) - 2);
var percentFormat = d3.format("." + p + "%");

var drawHistogram = function(svg, nestedData) {

	var item = itemCodes[nestedData.key], data = nestedData.values;

	var width = 160, height = 90;

	var margin = {
		top : 15,
		right : 15,
		bottom : 15,
		left : 15
	}, chartWidth = width - margin.left - margin.right, chartHeight = height
			- margin.top - margin.bottom;

	var svg = d3.select(svg);

	svg.attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox",
			"0 0 " + width + " " + height).classed("svg-content-responsive",
			true);

	svg.selectAll("*").remove()
	svg.append("text").attr('id', 'itemHeader_' + nestedData.key).attr(
			'data-toggle', 'tooltip').attr('data-placement', 'top').attr(
			'title', item).attr("y", margin.top / 2).attr("x", 5).attr(
			"text-anchor", "left").text(nestedData.key + ": " + item);

	$('[data-toggle="tooltip"]').tooltip();

	var g = svg.append('g').attr('transform',
			"translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scaleLinear() // v3
	.domain(d3.range(0, numberofBins + 1, 1)).rangeRound([ 0, chartWidth ])
			.nice();

	// var bins = d3.histogram()
	var bins = d3.histogram().domain(x.domain())
	// v4
	.value(function(d) {
		return d.importPercentage;
	})(data)
	bins.map(function(d) {
		d.sort(function(a, b) {
			return +(a.TradeLinksValue) > +(b.TradeLinksValue) ? -1 : 1
		})
		return d;
	})

	var oneBin = (bins.filter(function(d) {
		return d.length > 0;
	}).length == 1)

	var y = d3.scaleLinear() // v3
	.domain([ 0, d3.max(bins, function(d) {
		return d.length;
	}) ]).range([ chartHeight, 0 ]);

	var bar = g.selectAll(".bar").data(bins).enter().append("g").attr("class",
			"bar").attr("transform", function(d) {
		return "translate(" + x(d.x0) + "," + y(d.length) + ")"; // v4
	})

	g
			.selectAll(".tooltipPlaceholder")
			.data(bins)
			.enter()
			.append("g")
			.attr("class", "tooltipPlaceholder")
			.attr("transform", function(d) {
				return "translate(" + x(d.x0) + ",0" + ")"; // v4
			})
			.append('rect')
			.style('fill', 'transparent')
			.attr("x", 1)
			.attr('height', function(d) {
				return chartHeight;
			})
			.attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
			// v4
			.on('mousemove', ttPosition)
			.on(
					'mouseover',
					function(d) {
						var countriesIncluded = "";
						for (var index = 0; index < 10; index++) {
							if (d[index]) {
								countriesIncluded += '<h5>'
										+ countries[d[index].ExportingCountryCode].Country
										+ ' to '
										+ (countries[d[index].ImportingCountryCode] ? countries[d[index].ImportingCountryCode].Country
												: d[index].ImportingCountryCode)
										+ ' $'
										+ siFormat(d[index].TradeLinksValue * 1000)
										+ ' ('
										+ percentFormat(d[index].importPercentage)
										+ ')' + '</h5>';
							}
						}
						tooltip
								.style('visibility', 'visible')
								.html(
										'<h4>'
												+ item
												+ '</h5>'
												+ '<h5>'
												+ d.length
												+ ' trade links between '
												+ percentFormat(d.x0)
												+ ' and '
												+ percentFormat(d.x1)
												+ " of importing country's imports</h5>"
												+ countriesIncluded);
					}).on('mouseout', function(d) {
				tooltip.style('visibility', 'hidden')
			})

	bar.append("rect").attr("x", 1).attr('fill', 'steelblue').attr("width",
			oneBin ? chartWidth - 2 : ((chartWidth - 2) / numberofBins - 2))
	// .attr("width", x(bins[0].dx) <= 0 ? chartWidth : x(bins[0].dx)) // v3
	// .attr("width", x(bins[0].x1) - x(bins[0].x0) - 2) // v4
	.attr("height", function(d) {
		return chartHeight - y(d.length);
	})
}

var showPages = function() {
	if (numberOfPages() > 0) {
		d3.select("#selectedPageSelect").style('display', null)
		d3.select("#selectedPageSelect").selectAll("*").remove();
		d3.select("#selectedPageSelect").selectAll('option').data(
				d3.range(1, numberOfPages() + 1, 1)).enter().append('option')
				.text(function(d) {
					return "Page " + d + " of " + numberOfPages();
				}).attr('value', function(d) {
					return d;
				}).attr('id', function(d) {
					return 'page_' + d;
				}).attr('class', 'trade_type').attr('selected', function(d) {
					return d == selectedPage ? 'selected' : null;
				}).style('color', 'black').style('height', '20px').style(
						'position', 'absolute').style('top', function(d, i) {
					return (i * 20) + 'px';
				})
	}
}

var tooltip = d3.select('body').append('div').attr('class', 'tooltip').style(
		'position', 'absolute').style('z-index', '10').style('visibility',
		'hidden')
var mapBounds = [ [ -69.761568, -169.179395 ], [ 83.933328, 192.228819 ] ];
function loadBaseMap(mapName) {
	var map = L.map(mapName, {
		center : [ 35, 10 ],
		zoom : 2,
		zoomSnap : 0.001,
		zoomDelta : 0.001,
		// minZoom: 1.7,
		maxBounds : mapBounds,
		attributionControl : false,
		zoomControl : false,
	});
	map.fitBounds(mapBounds);
	map.once('zoomend', function() {
		map.setMinZoom(map.getZoom());
	});
	L.tileLayer(
			'https://api.mapbox.com/styles/v1/' + MBSTYLE
					+ '/tiles/256/{z}/{x}/{y}?access_token=' + MBTOKEN).addTo(
			map);
	return map;
}

var map;
function onEachFeature(feature, layer) {
	layers[ISO3toCC[layer.feature.properties.ISO3]] = layer;
	layer.on({
		click : selectCountry,
		mousemove : function(e) {
			countryTooltip(e.target.feature.properties.ISO3, e.originalEvent)
		},
		mouseout : function(e) {
			tooltip.style('visibility', 'hidden');
		},
	});
}

var importsF = function(country, item) {
	return rawJSON.filter(function(d) {
		return (item == d.ItemCode) && d.ImportingCountryCode == country;
	}, []).map(function(d) {
		return +(d.TradeLinksValue);
	}, 0).reduce(function(acc, curr) {
		return acc + curr;
	}, 0)
}
var exportsF = function(country, item) {
	return rawJSON.filter(function(d) {
		return (item == d.ItemCode) && d.ExportingCountryCode == country;
	}, []).map(function(d) {
		return +(d.TradeLinksValue);
	}, 0).reduce(function(acc, curr) {
		return acc + curr;
	}, 0)
}

var countryTooltip = function(iso3, e) {
	var countryIndex = ISO3toCC[iso3];
	var layer = layers[countryIndex];
	if (countryIndex) {
		var imports = importsF(countryIndex, selectedItem);
		var exports = exportsF(countryIndex, selectedItem);
	}
	tooltip
			.style('top', ((e.pageY - 70) + 'px'))
			.style('left', ((e.pageX + 25) + 'px'))
			.style('visibility', 'visible')
			.html(
					'<h2>'
							+ layer.feature.properties.NAME
							+ "<br><small> ("
							+ layer.feature.properties.ISO3
							+ ", "
							+ ISO3toCC[layer.feature.properties.ISO3]
							+ ")"
							+ "</small></h2>"
							+ (layer.percentImportReduction ? ("<h4>"
									+ itemCodes[selectedItem]
									+ " imports affected (including cascaded): $" + siFormat((layer.totalImports - layer.adjustedImports) * 1000))
									: "")
							+ "<h4>"
							+ (layer.percentImportReduction ? ("Percentage of "
									+ itemCodes[selectedItem]
									+ " imports: "
									+ (layer.percentImportReduction * 100)
											.toFixed(4) + "%") : "")
							+ "</h4>"
							+ "<h4>"
							+ (layer.percentTotalReduction ? ("Percentage of "
									+ " total "
									+ itemCodes[selectedItem]
									+ " trade: "
									+ (layer.percentTotalReduction * 100)
											.toFixed(4) + "%") : "")
							+ "</h4>"
							+ "<h4>Total Imports: "
							+ (imports ? ("$" + siFormat(imports * 1000))
									: "Unknown")
							+ "</h4>"
							+ "<h4>Total Exports: "
							+ (exports ? ("$" + siFormat(exports * 1000))
									: "Unknown") + "</h4>")
}

var selectedCountry;

// Called when a user clicks (selects) a country
function selectCountry(e) {
	if (rawData) {
		var continueProcess = updateSelectedCountry(e.target);
		if (continueProcess) {
			$('#singularity-dialog').modal('show');
		}
	}
}

var updateGUISelectedCountry = function() {
	d3.select("#allLinks").property("checked", true);
	linkChange();
	d3.selectAll(".country-path").classed('active', false);
	if (selectedCountry) {
		d3.select("#importLinks").property("disabled", simulate);
		d3.select("#exportLinks").property("disabled", simulate);
		d3.select(selectedCountry._path).classed('active', true);
		networkGraphGroup.Nodes
				.selectAll('circle')
				.classed(
						'focus',
						function(d) {
							return d["Country Code"] == ISO3toCC[selectedCountry.feature.properties.ISO3]
						});
	} else {
		d3.select("#importLinks").property("disabled", true);
		d3.select("#exportLinks").property("disabled", true);
		networkGraphGroup.Nodes.selectAll('circle').classed('focus', false);
	}
	return;
	graph.node = d3.select('.nodes').selectAll("circle");
	graph.link = d3.select('.links').selectAll("path");

	graph.node.classed('focus', false);
	graph.node.classed('active', true);
	graph.node.classed('inactive', false);
	graph.link.classed('active', true)
	graph.link.classed('inactive', false);
	if (selectedCountry) {
		graph.link.classed('active', false);
		var selectedCountryGraphIndex = graph.nodes
				.filter(
						function(d) {
							return d["Country Code"] == ISO3toCC[selectedCountry.feature.properties.ISO3];
						}, []).map(function(d) {
					return d.index;
				})[0];
		d3.selectAll('.focus').each(function(d) {
			currentlySelected = d.index;
		})
		d3.select(selectedCountry._path).classed('active', true);
		d3.selectAll('.focus').classed('focus', false);
		graph.node.classed('active', function(d) {
			return selectedCountryGraphIndex == d.index;
		});
		graph.node.classed('inactive', true)
		graph.link.classed('inactive', function(d) {
			return false;
			var sourceIndex = d.source.index;
			var targetIndex = d.target.index;
			if (graph.uniqueExporters.indexOf(d.source["Country Code"]) > 0
					|| targetIndex == selectedCountryGraphIndex) {
				graph.node.classed('active', function(d) {
					if (d.index == sourceIndex || d.index == targetIndex) {
						return true;
					} else {
						return d3.select(this).classed('active')
					}
				})
				return false;
			} else {
				return true;
			}
		})

		d3.selectAll('.active').classed('inactive', false);
	}
	return true;
}

var updateSelectedCountry = function(countryLayer) {
	if (!selectedCountry || selectedCountry != countryLayer) {
		selectedCountry = countryLayer
	} else {
		selectedCountry = null
	}
	updateGUISelectedCountry();
	updateNetworkGraph();
}

var calculateAffectedValues = function(layer, exporter, reduction, iteration) {
	if (iteration > layersToCascade)
		return;
	if (!selectedCountry) {
		layer.feature.affectedValue = 0;
		return;
	}
	var importingCountryIndex = ISO3toCC[layer.feature.properties.ISO3];
	var exportingCountryIndex = exporter
			|| ISO3toCC[selectedCountry.feature.properties.ISO3];
	layer.feature.affectedValue += getAffectedValue(exportingCountryIndex,
			importingCountryIndex, reduction || exportReduction, selectedItem,
			iteration || 0);
}

var choroplethColor = d3.interpolateInferno;

var choropleth = function(layer) {
	if (layer.feature.properties.ISO3 == "USA") {
		var tttt = 1;
	}
	layer.setStyle({
		"fillColor" : null,
		"fillOpacity" : 0
	})
	if (layer.percentTotalReduction) {
		layer.setStyle({
			"fillColor" : layer.percentTotalReduction <= 0.01 ? null
					: choroplethColor(1 - layer.percentTotalReduction),
			"fillOpacity" : 0.75
		});
	}
}

var exportReductionThreshold = 0.01;
var getAffectedValue = function(exporter, importer, reduction, itemCode,
		iteration) {
	if (importer && countries[importer] && exporter && countries[exporter]) {
		if (importer == ISO3toCC["VEN"]) {
			var sto = 1;
		}
		var affectedValue = rawJSON.filter(
				function(d) {
					return (!itemCode || itemCode == d.ItemCode)
							&& d.ImportingCountryCode == importer
							&& d.ExportingCountryCode == exporter
							&& d.TradeLinksValue > 0;
				}, []).map(function(d) {
			return +(d.TradeLinksValue) * reduction;
		}, 0).reduce(function(acc, curr) {
			return acc + curr;
		}, 0)

		var totalImports = rawJSON.filter(
				function(d) {
					return (!itemCode || itemCode == d.ItemCode)
							&& d.ImportingCountryCode == importer;
				}, []).map(function(d) {
			return +(d.TradeLinksValue);
		}, 0).reduce(function(acc, curr) {
			return acc + curr;
		}, 0)
		if (totalImports > 0
				&& (affectedValue / totalImports >= exportReductionThreshold)) {
			shpFile.layer.eachLayer(function(layer) {
				calculateAffectedValues(layer, importer, affectedValue
						/ totalImports, iteration + 1)
			});
		}
	}
	return affectedValue;
}

var shpFile;
var exportReduction = 0;
var layers = [];

function loadShpFile(url, map, onEach) {
	var result = {};
	shp(url).then(function(geojson) {
		result.layer = L.geoJson(geojson, {
			style : {
				weight : 0,
				color : "transparent",
				className : "country-path"
			},
			class : "country",
			onEachFeature : onEach
		}).addTo(map);
		result.geojson = geojson;
	});
	return result;
}

function initSliders() {
	var width = 500;
	var height = 25;
	var pad = width / 10;

	var margin = {
		'left' : 0,
		'right' : 0,
		'bottom' : 0,
		'top' : 0
	};
	var svg = d3.select('#export-reduction-slider-ticks').classed(
			"svg-container-ticks", true).append('svg').style('overflow',
			'visible').attr("viewBox", "0 0 " + width + " " + height).classed(
			"svg-content-responsive", true);

	var g = svg.append('g').attr('transform', function() {
		return 'translate(' + [ margin.left, margin.top ] + ')';
	});

	var g_enter = g.selectAll('.export-reduction-slider-ticks-g').data(
			d3.range(0, 101, 10)).enter().append('g').attr('class',
			'export-reduction-slider-ticks-g');

	g_enter.append('line').attr('x1', function(d, i) {
		return i * pad;
	}).attr('x2', function(d, i) {
		return i * pad;
	}).attr('y1', 0).attr('y2', 8).style('stroke', 'black').style(
			'stroke-width', '1px');

	g_enter.append('text').attr('y', 10).attr('x', function(d, i) {
		return i * pad;
	}).attr('text-anchor', 'middle').attr('dominant-baseline', 'hanging').attr(
			'font-size', '2em').text(function(d) {
		return d + '%';
	});

	$("#export-reduction-slider").slider({
		value : 0,
		range : false,
		min : 0,
		max : 100,
		step : 5,
		stop : function(event, ui) {
			exportReduction = ui.value / 100;
			updateNetworkGraph();
		}
	});

	var downstreamRange = [ 0, 3 ];
	var downstreamPad = width / (downstreamRange[1] - downstreamRange[0]);

	var svg_downstream = d3.select('#downstream-export-reduction-slider-ticks')
			.classed("svg-container-ticks", true).append('svg').style(
					'overflow', 'visible').attr("viewBox",
					"0 0 " + width + " " + height).classed(
					"svg-content-responsive", true);

	var g_downstream = svg_downstream.append('g').attr('transform', function() {
		return 'translate(' + [ margin.left, margin.top ] + ')';
	});

	var g_enter_downstream = g_downstream.selectAll(
			'.downstream-export-reduction-slider-ticks-g').data(
			d3.range(downstreamRange[0], downstreamRange[1] + 1, 1)).enter()
			.append('g').attr('class',
					'downstream-export-reduction-slider-ticks-g');

	g_enter_downstream.append('line').attr('x1', function(d, i) {
		return i * downstreamPad;
	}).attr('x2', function(d, i) {
		return i * downstreamPad;
	}).attr('y1', 0).attr('y2', 8).style('stroke', 'black').style(
			'stroke-width', '1px');

	g_enter_downstream.append('text').attr('y', 10).attr('x', function(d, i) {
		return i * downstreamPad;
	}).attr('text-anchor', 'middle').attr('dominant-baseline', 'hanging').attr(
			'font-size', '2em').text(function(d) {
		return d;
	});

	$("#downstream-export-reduction-slider").slider({
		value : 1,
		range : false,
		min : downstreamRange[0],
		max : downstreamRange[1],
		step : 1,
		stop : function(event, ui) {
			layersToCascade = ui.value;
			updateNetworkGraph();
		}
	});

	var linkSizeThresholdRange = [ 0, 1000000 ];
	var numberLinkSizeThresholdTicks = 20;
	var linkSizeThreshold_width = 500, linkSizeThreshold_height = 25;
	var linkSizeThresholdPad = linkSizeThreshold_width
			/ numberLinkSizeThresholdTicks;

	var svg_linkSizeThreshold = d3.select('#linkSizeThreshold-slider-ticks')
			.classed("svg-container-ticks", true).append('svg').style(
					'overflow', 'visible').attr(
					"viewBox",
					"0 0 " + linkSizeThreshold_width + " "
							+ linkSizeThreshold_height).classed(
					"svg-content-responsive", true);

	var g_linkSizeThreshold = svg_linkSizeThreshold.append('g');

	var g_enter_linkSizeThreshold = g_linkSizeThreshold.selectAll(
			'.linkSizeThreshold-slider-ticks-g').data(
			d3.range(linkSizeThresholdRange[0], linkSizeThresholdRange[1] + 1,
					(linkSizeThresholdRange[1] - linkSizeThresholdRange[0])
							/ numberLinkSizeThresholdTicks)).enter()
			.append('g').attr('class', 'linkSizeThreshold-slider-ticks-g');

	g_enter_linkSizeThreshold.append('line').attr('x1', function(d, i) {
		return i * linkSizeThresholdPad;
	}).attr('x2', function(d, i) {
		return i * linkSizeThresholdPad;
	}).attr('y1', 0).attr('y2', 8).style('stroke', 'black').style(
			'stroke-width', '1px');

	g_enter_linkSizeThreshold.append('text').attr('y', 10).attr('x',
			function(d, i) {
				return i * linkSizeThresholdPad;
			}).attr('text-anchor', 'middle').attr('dominant-baseline',
			'hanging').attr('font-size', 8).text(function(d, i) {
		if (i % 2 == 1)
			return '';
		return '$' + siFormat(d * 1000);
	});

	$("#linkSizeThreshold-slider").slider(
			{
				value : linkSizeThresholdRange[0],
				range : false,
				min : linkSizeThresholdRange[0],
				max : linkSizeThresholdRange[1],
				step : (linkSizeThresholdRange[1] - linkSizeThresholdRange[0])
						/ numberLinkSizeThresholdTicks / 2,
				stop : function(event, ui) {
					linkSizeThreshold = ui.value;
					updateNetworkGraph();
				}
			});

	var linkSizePercentThresholdRange = [ 0, 1 ];
	var numberLinkSizePercentThresholdTicks = 20;
	var linkSizePercentThreshold_width = 500, linkSizePercentThreshold_height = 25;
	var linkSizePercentThresholdPad = linkSizePercentThreshold_width
			/ numberLinkSizePercentThresholdTicks;

	var svg_linkSizePercentThreshold = d3.select(
			'#linkSizePercentThreshold-slider-ticks').classed(
			"svg-container-ticks", true).append('svg').style('overflow',
			'visible').attr(
			"viewBox",
			"0 0 " + linkSizePercentThreshold_width + " "
					+ linkSizePercentThreshold_height).classed(
			"svg-content-responsive", true);

	var g_linkSizePercentThreshold = svg_linkSizePercentThreshold.append('g');

	var g_enter_linkSizePercentThreshold = g_linkSizePercentThreshold
			.selectAll('.linkSizePercentThreshold-slider-ticks-g').data(
					d3.range(0, numberLinkSizePercentThresholdTicks + 1, 1))
			.enter().append('g').attr('class',
					'linkSizePercentThreshold-slider-ticks-g');

	g_enter_linkSizePercentThreshold.append('line').attr('x1', function(d, i) {
		return i * linkSizePercentThresholdPad;
	}).attr('x2', function(d, i) {
		return i * linkSizePercentThresholdPad;
	}).attr('y1', 0).attr('y2', 8).style('stroke', 'black').style(
			'stroke-width', '1px');

	g_enter_linkSizePercentThreshold
			.append('text')
			.attr('y', 10)
			.attr('x', function(d, i) {
				return i * linkSizePercentThresholdPad;
			})
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.attr('font-size', 8)
			.text(
					function(d) {
						return percentFormat(d
								* (linkSizePercentThresholdRange[1] - linkSizePercentThresholdRange[0])
								/ numberLinkSizePercentThresholdTicks);
					});

	$("#linkSizePercentThreshold-slider")
			.slider(
					{
						value : linkSizePercentThresholdRange[0],
						range : false,
						min : linkSizePercentThresholdRange[0],
						max : linkSizePercentThresholdRange[1],
						step : (linkSizePercentThresholdRange[1] - linkSizePercentThresholdRange[0])
								/ numberLinkSizePercentThresholdTicks,
						stop : function(event, ui) {
							linkSizePercentThreshold = ui.value;
							updateNetworkGraph();
						}
					});

	var linkSizeSecondaryThresholdRange = [ 0, 1 ];
	var numberlinkSizeSecondaryThresholdTicks = 20;
	var linkSizeSecondaryThreshold_width = 500, linkSizeSecondaryThreshold_height = 25;
	var linkSizeSecondaryThresholdPad = linkSizeSecondaryThreshold_width
			/ numberlinkSizeSecondaryThresholdTicks;

	var svg_linkSizeSecondaryThreshold = d3.select(
			'#linkSizeSecondaryThreshold-slider-ticks').classed(
			"svg-container-ticks", true).append('svg').style('overflow',
			'visible').attr(
			"viewBox",
			"0 0 " + linkSizeSecondaryThreshold_width + " "
					+ linkSizeSecondaryThreshold_height).classed(
			"svg-content-responsive", true);

	var g_linkSizeSecondaryThreshold = svg_linkSizeSecondaryThreshold
			.append('g');

	var g_enter_linkSizeSecondaryThreshold = g_linkSizeSecondaryThreshold
			.selectAll('.linkSizeSecondaryThreshold-slider-ticks-g')
			.data(
					d3
							.range(
									linkSizeSecondaryThresholdRange[0],
									linkSizeSecondaryThresholdRange[1] + 0.01,
									(linkSizeSecondaryThresholdRange[1] - linkSizeSecondaryThresholdRange[0])
											/ numberlinkSizeSecondaryThresholdTicks))
			.enter().append('g').attr('class',
					'linkSizeSecondaryThreshold-slider-ticks-g');

	g_enter_linkSizeSecondaryThreshold.append('line').attr('x1',
			function(d, i) {
				return i * linkSizeSecondaryThresholdPad;
			}).attr('x2', function(d, i) {
		return i * linkSizeSecondaryThresholdPad;
	}).attr('y1', 0).attr('y2', 8).style('stroke', 'black').style(
			'stroke-width', '1px');

	g_enter_linkSizeSecondaryThreshold.append('text').attr('y', 10).attr('x',
			function(d, i) {
				return i * linkSizeSecondaryThresholdPad;
			}).attr('text-anchor', 'middle').attr('dominant-baseline',
			'hanging').attr('font-size', 8).text(function(d) {
		return percentFormat(d);
	});

	$("#linkSizeSecondaryThreshold-slider")
			.slider(
					{
						value : linkSizeSecondaryThresholdRange[0],
						range : false,
						min : linkSizeSecondaryThresholdRange[0],
						max : linkSizeSecondaryThresholdRange[1],
						step : (linkSizeSecondaryThresholdRange[1] - linkSizeSecondaryThresholdRange[0])
								/ numberlinkSizeSecondaryThresholdTicks,
						stop : function(event, ui) {
							linkSizeSecondaryThreshold = ui.value;
							updateNetworkGraph();
						}
					});
	$("#linkSizeSecondaryThresholdDiv").hide();
}

var updateChoropleth = function() {
	d3.select("#loading").style('display', 'block')
	d3.select("#main").classed('inactive', true)
	shpFile.layer
			.eachLayer(function(layer) {
				layer.percentImportReduction = 0;
				layer.percentTotalReduction = 0;
				if (selectedCountry && exportReduction > 0) {
					layer.totalImports = rawData.filter(function(d) {
						return d.key == selectedItem
					})[0].values
							.filter(
									function(d) {
										return d.ImportingCountryCode == ISO3toCC[layer.feature.properties.ISO3]
									}, []).reduce(function(acc, curr) {
								return acc + curr.value.original;
							}, 0)
					layer.totalTrade = rawData.filter(function(d) {
						return d.key == selectedItem
					})[0].values
							.filter(
									function(d) {
										return d.ExportingCountryCode == ISO3toCC[layer.feature.properties.ISO3]
												|| d.ImportingCountryCode == ISO3toCC[layer.feature.properties.ISO3]
									}, []).reduce(function(acc, curr) {
								return acc + curr.value.original;
							}, 0)
					layer.adjustedImports = rawData.filter(function(d) {
						return d.key == selectedItem
					})[0].values
							.filter(
									function(d) {
										return d.ImportingCountryCode == ISO3toCC[layer.feature.properties.ISO3]
									}, []).reduce(function(acc, curr) {
								if (curr.ImportingCountryCode == 231) {
									var tttt = 1;
								}
								return acc + curr.value.adjusted;
							}, 0)
					layer.percentImportReduction = (layer.totalImports - layer.adjustedImports)
							/ layer.totalImports;
					layer.percentTotalReduction = (layer.totalImports - layer.adjustedImports)
							/ layer.totalTrade;
				}
			});
	shpFile.layer.eachLayer(choropleth)
	d3.select("#main").classed('inactive', false)
	d3.select("#loading").style('display', 'none')
}

var loadMap = function() {
	map = loadBaseMap('map');
	// loadShpFile loads the local shp file and the geojson
	shpFile = loadShpFile("./data/worldTest", map, onEachFeature);
}

window.onload = function() {
	initSliders();
	d3.select("#yearSelector").selectAll("option").data(
			d3.range(availableMinYear, availableMaxYear + 1, 1).reverse())
			.enter().append('option').html(function(d) {
				return d;
			})

	d3.select("#checkboxWeightByValue").on('change', function(d) {
		byWeight = d3.select(this).property('checked');
		updateNetworkGraph();
	})

	d3.select("#checkboxSimulate").on(
			'change',
			function(d) {
				simulate = d3.select(this).property('checked');
				d3.select("#simulationDiv").style('display',
						simulate ? 'block' : 'none')
				updateNetworkGraph();
				if (simulate) {
					$("#linkSizeSecondaryThresholdDiv").show()
				} else {
					$("#linkSizeSecondaryThresholdDiv").hide()
				}
			})
	var svg = d3.select('#export-reduction-slider-ticks').append('svg').attr(
			'width', 100).attr('height', 10);

	var g = svg.append('g').attr('transform', function() {
		return 'translate(0,0)';
	});

	var g_enter = g.selectAll('.export-reduction-slider-ticks-g').data(
			d3.range(1, -0.1, -0.1)).enter().append('g').attr('class',
			'export-reduction-slider-ticks-g');

	$('#singularity-dialog').on('hidden.bs.modal', function() {
		updateChoropleth();
	})

	d3.range(1, 14, 1).forEach(
			function(d) {
				make_mortif_figure(d3.select("#triadDistributionDisplay"),
						unconvert[d], true).style('background-color', 'white')
						.attr('id', 'triad_' + unconvert[d]).attr('width',
								(70) + 'px').attr('height', '90px').select('g')
						.attr('transform', 'translate (15,7.5)').append('text')
						.attr('y', "60px").style('text-anchor', 'center')
						.style('font-size', '1.5em').text("Type " + d);
			})

	d3.csv('data/FAOSTAT_data_countrycodes.csv', function(data) {
		countries = {};
		ISO3toCC = {};
		for (var index = 0; index < data.length; index++) {
			countries[data[index]['Country Code']] = data[index];
			ISO3toCC[data[index]['ISO3 Code']] = data[index]['Country Code'];
		}
		var typeData = [];

		typeData.push({
			Element : "% Export Value",
			ElementCode : 5922,
			Unit : "%",
			Process : function(d) {
				return d;
			}
		})

		typeData.push({
			Element : "Export Value",
			ElementCode : 5922,
			Unit : "1000 US$",
			Process : function(d) {
				return d;
			}
		})

		typeData.push({
			Element : "SQRT Export Value",
			ElementCode : 5922,
			Unit : "SQRT 1000 US$",
			Process : function(d) {
				return d;
			}
		})

		typeDiv = d3.select('#options').attr('class', 'form-inline').append(
				'select').attr('id', 'itemSelect').attr('class',
				'form-control pull-left').on('change', function(d) {
			selectedType = typeData[this.selectedIndex];
			updateHistograms();
		})

		typeDiv.selectAll('option').data(typeData).enter().append('option')
				.text(function(d) {
					return d.Element;
				}).attr('id', function(d) {
					return 'type_' + d.ElementCode;
				}).attr('class', 'trade_type').style('color', 'black').style(
						'height', '20px').style('position', 'absolute').style(
						'top', function(d, i) {
							return (i * 20) + 'px';
						})

		selectedType = typeData[0];

		d3.selectAll('#loadingIcon').style('display', 'none');

		numberOfBinsDiv = d3.select('#options').attr('class', 'form-inline')
				.append('select').attr('id', 'numberOfBinsSelect').attr(
						'class', 'form-control pull-right').on('change',
						function(d) {
							numberofBins = +(this.value);
							if (rawData) {
								updateHistograms();
							}
						})

		numberOfBinsDiv.selectAll('option').data(d3.range(5, 14, 1)).enter()
				.append('option').text(function(d) {
					return d + " bins";
				}).attr('value', function(d) {
					return +(d);
				}).attr('id', function(d) {
					return 'bins_' + d;
				}).attr('selected', function(d) {
					return d == numberofBins ? 'selected' : null;
				}).style('color', 'black').style('height', '20px').style(
						'position', 'absolute').style('top', function(d, i) {
					return (i * 20) + 'px';
				})

		selectedPageDiv = d3.select('#options').attr('class', 'form-inline')
				.append('select').attr('id', 'selectedPageSelect').attr(
						'class', 'form-control pull-right').on('change',
						function(d) {
							selectedPage = +(this.value);
							if (rawData) {
								updateHistograms();
							}
						})

		d3.select('#options').append('svg').attr('id', 'tradeHistogramFooter')
				.attr('height', 30).attr('width', 600)
		getDBCodes();
		function wait() {
			if (!itemCodes || !FAOtoPOP) {
				setTimeout(wait, 100);
			} else {
				getTradeHistogramData();
			}
		}
		wait();
	});
}
