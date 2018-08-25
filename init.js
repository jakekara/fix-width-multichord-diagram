// Adapted from Mike Bostock's UberData Chord diagram example
//   https://bost.ocks.org/mike/uberdata/

function drawWithData(error, data){
    console.log("Drawing with data", data);

    var container = d3.select("#container").html(""),
	bbox = container.node().getBoundingClientRect()

    // Overall page margins
    // var HEIGHT = 600,
    // 	WIDTH = 960;
    var HEIGHT = Math.min(bbox.width, 400);
    	WIDTH = bbox.width;
    console.log(WIDTH, HEIGHT);

    outerRadius = Math.min(WIDTH, HEIGHT) / 2 - 40
    innerRadius = outerRadius - 30;

    // Formatting functions
    var formatPercent = d3.format(".1%");

    var formatNumber = function (x){
	if (Math.abs(x) >= 1e9) {
	    return d3.format(",.2f")(x / 1e9) + " Billion"
	}
	else if (Math.abs(x) >= 1e6) {
	    return d3.format(",.2f")(x / 1e6) + " Million"
	}
	else {
	    return d3.format(",.0f")(x)
	}
    }

    // Chord chart elements
    var arc = d3.arc()
	.cornerRadius(4)
	.innerRadius(innerRadius)
	.outerRadius(outerRadius);

    var layout = d3.multichord()
	.padAngle(.05)
	.sortSubgroups(d3.descending) 
	.sortChords(d3.descending);

    var path = d3.ribbon()
	.radius(innerRadius * 1);

    // var svg = d3.select("#vis").append("svg")
    var svg = container.append("svg")
	.attr("width", WIDTH)
	.attr("height", HEIGHT)
    // .attr("x", CHORD_VIS.X)
    // .attr("y", CHORD_VIS.Y)

    function widthMatrix(matrix){
	// convert all values to 1 or 0

	// input values -> output values
	// 0 where we want to ribbon -> 0
	// 1 where we want an active ribbon -> 1
	// -1 where we want an inactive ribbon -> 1

	return matrix.map(function(group){
	    return group.map(function(row){
		return row.map(function(v){
		    if (v > 0){ return 1;}
		    else if (v < 0){ return 1;}
		    return 0;
		});
	    });
	});
    }

    if (error) throw error;

    var nodes = data.nodes,
	categories = data.categories;

    var chords = layout(widthMatrix(data.links))  

    // Compute the chord layout.
    var g =  svg.append("g")
	.attr("id", "circle")
	.attr("transform", "translate(" + (WIDTH / 2) + "," + (HEIGHT / 2) + ")")
	.datum(chords);

    g.append("circle")
	.attr("r", outerRadius)

    g.append("g").attr("id", "groups");
    g.append("g").attr("id", "chords");


    var group, groupPath, groupText, chord;

    // Add a group per neighborhood.
    group = g.select("#groups")
	.selectAll("g")
	.data(function(chords){ return chords.groups})
	.enter().append("g")
	.attr("class", "group")
	.on("mouseover", mouseover)
	.on("mouseout", mouseover_restore);
    
    // Add the group arc.
    groupPath = group.append("path")
	.classed("group-name", true)
	.attr("id", function(d, i) { return "group" + i; })
	.attr("d", arc)
    // .style("fill", function(d, i) { return nodes[i].color; });

    // Add a text label.
    groupText = group.append("text")
	.attr("x", 6)
	.attr("dy", 15)
	.append("textPath")
	.attr("xlink:href", function(d, i) { return "#group" + i; })
	.text(function(d, i) { return nodes[i].name; })
	.attr("opacity", function(d, i) {
            // Hide labels that don't fit
            if (groupPath._groups[0][i].getTotalLength() / 2 - 25 < this.getComputedTextLength()) {
		return 0;
            } else { 
		return 1;
            };
	})

    // Add a mouseover title.
    group.append("title").text(function(d, i) {
	return nodes[i].name
            + "\n" + "In: " + formatNumber(chords.groups[i].value.in)
            + "\n" + "Out: " + formatNumber(chords.groups[i].value.out);
    });
    
    // Add the chords.
    chord = g.select("#chords").selectAll("g")
	.data(function(chords) { return chords;})
	.enter().append("g")
	.classed("broken", function(d){
	    // var v = data.links[d.source.category][d.source.index][d.source.subindex];
	    var v = data.links[d.source.index][d.source.subindex][d.source.category];
	    console.log("index val",v)
	    return v < 0;
	})
	.attr("data-category", function(d, i, a){
	    console.log("adding chord", d.source.index, d.source.subindex, d);

	    console.log(categories[d.source.category].name,
			categories[d.target.category].name);
	    
	    return categories[d.source.category].name;
	})
	.classed("chord",true);

    chord.append("path")
	.attr("class", "chord")
    // .style("fill", function(d) {
    //     return categories[d.source.category].color;
    //     return nodes[d.source.index].color;
    // })
	.attr("d", path)
	.on("mouseover", mouseover_types)
	.on("mouseout", mouseover_restore);

    // Add a mouseover title for each chord.
    chord.append("title").text(function(d) {
	return categories[d.source.category].name
            + "\n" + nodes[d.source.index].name
            + " → " + nodes[d.target.index].name
            + ": " + formatNumber(d.source.value)
            + "\n" + nodes[d.target.index].name
            + " → " + nodes[d.source.index].name
            + ": " + formatNumber(d.target.value);
    });

        function highlight_category(c){
	console.log("highlight_category", c);
	g.select("#chords").selectAll("path")
	    .classed("fade", function(p) {
		return categories[p.source.category].name != c
		    && categories[p.target.category].name != c;
	    });

	d3.selectAll(".legend-item").classed("highlight", function(d){
	    return d.name === c;
	});

	svg.classed("highlighting", true);		
    }



    var controls = d3.select("#controls").html("");

    var legendItems = controls.selectAll(".legend-item")
	.data(categories)
	.enter()
	.append("div")
	.classed("legend-item", true)
    	.attr("data-category", function(d){ return d.name; })
	.on("mouseover", function(d){
	    highlight_category(d.name);
	})
	.on("mouseout", function(d){
	    unhighlight_category();
	})
    
    
    var legendTitles = legendItems
	.append("div")
	.text(function(d){ return d.name; })

    function mouseover(d) {
	g.select("#chords").selectAll("path")
	    .classed("fade", function(p) {
		return p.source.index != d.index
		    && p.target.index != d.index;
	    });


    }

    function mouseover_types(d) {
	highlight_category(categories[d.source.category].name);
	// g.select("#chords").selectAll("path")
	//     .classed("fade", function(p) {
	// 	return p.source.category != d.source.category
	// 	    && p.target.category != d.target.category;
	//     });

	// var cat = categories[d.source.category];
	// var sourceNode = nodes[d.source.index].name;
	// var targetNode = nodes[d.target.index].name;
	// console.log(d);
	// d3.select("#controls").html(function(){
	//     return cat.name + ", " + sourceNode + " to  " + targetNode
	// });
	// console.log(cat.name);


    }


    function unhighlight_category(){
	g.select("#chords").selectAll("path")
	    .classed("fade", function(p) {
		return false;
	    });

	svg.classed("highlighting", false);	
	
    }
	

    function mouseover_restore(d) {
	g.select("#chords").selectAll("path")
	    .classed("fade", function(p) {
		return false;
	    });

	svg.classed("highlighting", false);	

    }
    
    
}

d3.queue()
//    .defer(d3.json, "migration_regions.json")
    .defer(d3.json, "health_network_exchange.json")
    .await(function(error, data){
	drawWithData(error, data);
	d3.select(window).on("resize", function(){
	    drawWithData(error, data);
	});
    });
