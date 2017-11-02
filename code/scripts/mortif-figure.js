/**
 * 
 */
function make_mortif_figure(d3sel, mortifPos, grouped){
	var svg;
	var svg_width = 55, svg_height = 55;
	var W = 40, H = 40;
	var margin = {left: (svg_width - W) /2, right:(svg_width - W)/2, bottom : (svg_height - H) /2, top : (svg_height - H)/2};
	var r = 5;
	var nodes, links;

	if(grouped) {
		switch(mortifPos) {
		case 1:
			nodes = [
		             {name : 1, x : 0, y: H},
		             {name : 2, x : W/2, y: 0},
		             {name : 3, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1}
		             ];
		
			draw(nodes, links);
			break;
		case 2:
			nodes = [
		             {name : 4, x : 0, y: H},
		             {name : 5, x : W/2, y: 0},
		             {name : 6, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[2], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:1}
		             ];
		
			draw(nodes, links);
			break;
		case 3:
			nodes = [
		             {name : 7, x : 0, y: H},
		             {name : 7, x : W/2, y: 0},
		             {name : 7, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[2], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1},
		             {source : nodes[1], target : nodes[0], direction:1}
		             ];
		
			draw(nodes, links);
			break;
		case 4:
			nodes = [
		             {name : 8, x : 0, y: H},
		             {name : 9, x : W/2, y: 0},
		             {name : 8, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:1}
		             ];
			draw(nodes, links);		
			break;
		case 5:
			nodes = [
		             {name : 10, x : 0, y: H},
		             {name : 11, x : W/2, y: 0},
		             {name : 10, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1}
		             ];
			draw(nodes, links);		
			break;
		case 6:
			nodes = [
		             {name : 12, x : 0, y: H},
		             {name : 13, x : W/2, y: 0},
		             {name : 12, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);				
			break;
		case 7:
			nodes = [
		             {name : 14, x : 0, y: H},
		             {name : 15, x : W/2, y: 0},
		             {name : 14, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);		
			break;
		case 8:
			nodes = [
		             {name : 16, x : 0, y: H},
		             {name : 17, x : W/2, y: 0},
		             {name : 18, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[2], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);		
			break;
		case 9:
			nodes = [
		             {name : 19, x : 0, y: H},
		             {name : 20, x : W/2, y: 0},
		             {name : 21, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);	
			break;
		case 10:
			nodes = [
		             {name : 22, x : 0, y: H},
		             {name : 23, x : W/2, y: 0},
		             {name : 24, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0},
		             {source : nodes[2], target : nodes[1], direction:1}
		             ];
			draw(nodes, links);
			break;
		case 11:
			nodes = [
		             {name : 25, x : 0, y: H},
		             {name : 25, x : W/2, y: 0},
		             {name : 25, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:0},
		             {source : nodes[0], target : nodes[2], direction:0},
		             {source : nodes[1], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);
			break;
		case 12:
			nodes = [
		             {name : 26, x : 0, y: H},
		             {name : 27, x : W/2, y: 0},
		             {name : 28, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:0},
		             {source : nodes[2], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);
			break;
		case 13:
			nodes = [
		             {name : 29, x : 0, y: H},
		             {name : 30, x : W/2, y: 0},
		             {name : 29, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:0},
		             {source : nodes[1], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);
		}
	}
	else {
		switch(mortifPos){
		case 1:
		case 2:
		case 3:
			nodes = [
		             {name : 1, x : 0, y: H},
		             {name : 2, x : W/2, y: 0},
		             {name : 3, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1}
		             ];
		
			draw(nodes, links);
			break;
		case 4:
		case 5:
		case 6:
			nodes = [
		             {name : 4, x : 0, y: H},
		             {name : 5, x : W/2, y: 0},
		             {name : 6, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[2], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:1}
		             ];
		
			draw(nodes, links);
			break;
		case 7:
			nodes = [
		             {name : 7, x : 0, y: H},
		             {name : 7, x : W/2, y: 0},
		             {name : 7, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[2], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1},
		             {source : nodes[1], target : nodes[0], direction:1}
		             ];
		
			draw(nodes, links);
			break;
		case 8:
		case 9:
			nodes = [
		             {name : 8, x : 0, y: H},
		             {name : 9, x : W/2, y: 0},
		             {name : 8, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:1}
		             ];
			draw(nodes, links);		
			break;
		case 10:
		case 11:
			nodes = [
		             {name : 10, x : 0, y: H},
		             {name : 11, x : W/2, y: 0},
		             {name : 10, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1}
		             ];
			draw(nodes, links);		
			break;
		case 12:
		case 13:
			nodes = [
		             {name : 12, x : 0, y: H},
		             {name : 13, x : W/2, y: 0},
		             {name : 12, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);				
			break;
		case 14:
		case 15:
			nodes = [
		             {name : 14, x : 0, y: H},
		             {name : 15, x : W/2, y: 0},
		             {name : 14, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:1},
		             {source : nodes[2], target : nodes[1], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);		
			break;
		case 16:
		case 17:
		case 18:
			nodes = [
		             {name : 16, x : 0, y: H},
		             {name : 17, x : W/2, y: 0},
		             {name : 18, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[2], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);		
			break;
		case 19:
		case 20:
		case 21:
			nodes = [
		             {name : 19, x : 0, y: H},
		             {name : 20, x : W/2, y: 0},
		             {name : 21, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);	
			break;
		case 22:
		case 23:
		case 24:
			nodes = [
		             {name : 22, x : 0, y: H},
		             {name : 23, x : W/2, y: 0},
		             {name : 24, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:1},
		             {source : nodes[0], target : nodes[2], direction:0},
		             {source : nodes[2], target : nodes[1], direction:1}
		             ];
			draw(nodes, links);
			break;
		case 25:
			nodes = [
		             {name : 25, x : 0, y: H},
		             {name : 25, x : W/2, y: 0},
		             {name : 25, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:0},
		             {source : nodes[0], target : nodes[2], direction:0},
		             {source : nodes[1], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);
			break;
		case 26:
		case 27:
		case 28:
			nodes = [
		             {name : 26, x : 0, y: H},
		             {name : 27, x : W/2, y: 0},
		             {name : 28, x : W, y: H}
		             ];
			links = [
		             {source : nodes[0], target : nodes[1], direction:0},
		             {source : nodes[2], target : nodes[0], direction:1},
		             {source : nodes[1], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);
			break;
		case 29:
		case 30:
			nodes = [
		             {name : 29, x : 0, y: H},
		             {name : 30, x : W/2, y: 0},
		             {name : 29, x : W, y: H}
		             ];
			links = [
		             {source : nodes[1], target : nodes[0], direction:0},
		             {source : nodes[1], target : nodes[2], direction:0}
		             ];
			draw(nodes, links);
		}
	}
	
	function draw(nodes, links){
		svg = d3sel.append('svg')
		.attr('width', svg_width)
		.attr('height', svg_height)

		var defs = svg.append('defs');
		
		defs
		.append('marker')
		.attr('id', 'marker-end-arrow')
		.attr('refX', 0).attr('refY', 3)
		.attr('markerWidth', 6).attr('markerHeight', 6)
		.attr('orient', 'auto')
		.attr('markerUnits', 'strokeWidth')
		.append('path')
		.attr('d', 'M0,0 L0,6 L9,3 z');
		
//		defs.append('marker')
//		.attr('id', 'marker-start-arrow')
//		.attr('refX', 9).attr('refY', 3)
//		.attr('markerWidth', 6).attr('markerHeight', 6)
//		.attr('orient', 'auto')
//		.attr('markerUnits', 'strokeWidth')
//		.append('path')
//		.attr('d', 'M9,3 L0,6 L0,0 z');
		
		var g = svg
		.append('g')
		.attr('transform', function(){
			return 'translate(' + [margin.left, margin.top] + ')';
		});
		
		g.selectAll('circle')
		.data(nodes)
		.enter().append('circle')
		.attr('transform', function(d, i){
			return 'translate(' + [d.x, d.y] + ')';
		})
		.attr('cx', 0).attr('cy', 0)
		.attr('r', r)
		.attr('stroke', 'black').attr('stroke-width', 1)
		.attr('fill', function(d){
			if(d.name == mortifPos){
				return 'orange';
			}
			else{
				return grouped ? 'orange':'white';
			}
		});
		
		var lines = g.selectAll('line')
		.data(links)
		.enter().append('line');
		
		lines.each(function(d, i){
			var hyp = Math.sqrt((d.target.x - d.source.x) *(d.target.x - d.source.x) + (d.target.y - d.source.y) * (d.target.y - d.source.y));
			var sin = (d.target.y - d.source.y) / hyp;
			var cos = (d.target.x - d.source.x) / hyp;
			
			var off_x = r * cos;
			var off_y = r * sin;
			
			var a_off_x = (r+6) * cos;
			var a_off_y = (r+6) * sin;
			
			var x1, x2, y1, y2;
			if(d.direction == 1){
				x1 = d.source.x + off_x;
				x2 = d.target.x - a_off_x;
				y1 = d.source.y + off_y; 
				y2 = d.target.y - a_off_y;
				
				d3.select(this)
				.attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
				.style('stroke', 'black')
				.style('stroke-width', '1px')
				.attr('marker-end', 'url(#marker-end-arrow)');
			}
			else{
				x1 = d.source.x + a_off_x; 
				x2 = d.target.x - a_off_x;
				y1 = d.source.y + a_off_y;
				y2 = d.target.y - a_off_y;
				
				d3.select(this.parentNode).append('line')
				.attr('x1', x2).attr('y1', y2).attr('x2', x1).attr('y2', y1)
				.style('stroke', 'black')
				.style('stroke-width', '1px')
				.attr('marker-end', 'url(#marker-end-arrow)');
				
				d3.select(this)
				.attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
				.style('stroke', 'white')
				.style('stroke-width', '1px')
				.attr('marker-end', 'url(#marker-end-arrow)');
			}
		});
	}
	return svg;
}