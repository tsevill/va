var margin = {top: 0, right: 35, bottom: 20, left: 35},
    width = 1200 - margin.left - margin.right,
    height = 50 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([minYear, maxYear + 1])
    .range([0, width]);

var brush = d3.svg.brush()
    .x(x)
    .extent([1991, 1993])
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

// svg.append("g")
//     .attr("class", "x axis")
//     .attr("transform", "translate(0," + height + ")")
//     .call(d3.svg.axis()
//       .scale(x)
//       .orient("bottom")
//       .ticks(30)
//       .tickPadding(0))
//   .selectAll("text")
//     .attr("x", 0)
//     .attr("y", 10)
//     .style("text-anchor", null);

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
    minYear = extent1[1];
    updateMap();
}