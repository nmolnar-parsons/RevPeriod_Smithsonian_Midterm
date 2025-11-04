let timeline_dates = null; // global variable





//landing
d3.csv("Data/revperiod_portraits_with_faces.csv").then(data => {
    // arrange 30 faces in two concentric ellipses around the title
    const faces = data.filter(d => d.face_urls).slice(0, 50);
    const container = d3.select("#face_container");
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Two ellipses: set rx and ry for each
    const ellipses = [
        { count: 14, rx: window.innerWidth * 0.30, ry: window.innerHeight * 0.30 },
        { count: 16, rx: window.innerWidth * 0.48, ry: window.innerHeight * 0.44 }
    ];

    let imgIdx = 0;
    ellipses.forEach((ellipse, eIdx) => {
        for (let i = 0; i < ellipse.count && imgIdx < faces.length; i++, imgIdx++) {
            const angle = 2 * Math.PI * i / ellipse.count;
            const x = centerX + ellipse.rx * Math.cos(angle) - 50; // 50 = half img width
            const y = centerY + ellipse.ry * Math.sin(angle) - 50; // 50 = half img height

            container.append("img")
                .attr("src", faces[imgIdx].face_urls.split("; ")[0])
                .attr("alt", `${faces[imgIdx].Sitter} portrait ${faces[imgIdx].Clean_Date}`)
                .style("width", "100px")
                .style("height", "100px")
                .style("object-fit", "cover")
                .style("border-radius", "5px")
                .style("position", "absolute")
                .style("left", `${x}px`)
                .style("top", `${y}px`)
                .style("transform", `rotate(${(Math.random() - 0.5) * 30}deg)`);
        }
    });
});



//Viz 1
d3.csv("Data/revperiod_portraits_with_faces.csv").then(data => {

    //filter for George Washington and between 1780 and 1810
    // landing page histogram data
    var gwData = data.filter(d => 
        d.Sitter === "George Washington" &&
        // !["unidentified", "Unidentified Woman", "Unidentified Man"].includes(d.Sitter)
        +d.Clean_Date >= 1780 && +d.Clean_Date <= 1810 &&
        d.thumbnail // this checks that thumbnail is not empty, null, or undefined
        // && sitterCounts[d.Sitter] >= 5
    );


    //Group images by year
    const yearGroups = {};
    gwData.forEach(d => {
        const year = +d.Clean_Date;
        if (!yearGroups[year]) yearGroups[year] = [];
        yearGroups[year].push(d);
        d.stackIndex = yearGroups[year].indexOf(d);
    });

    
    function draw_timeline(person, color, timelineY, timelineHeight, x_scale, g, data) {
        const dates = timeline_dates[person];
        if (!dates) return;

        // Find birth and death events
        const birth = dates.find(d => d.event === "Birth");
        const death = dates.find(d => d.event === "Death");
        if (!birth || !death) return;

        const svg = d3.select("#histogram");
        const axisY = +svg.attr("height") - 100; // 100 = margin.bottom, adjust if needed

        //erase previous lifelines
        g.selectAll("rect.lifeline").remove();

        // Draw lifeline rectangle stretching from axis to timelineY
        const lifeline = g.append("rect")
            .attr("x", x_scale(+birth.date.substring(0,4)))
            .attr("y", timelineY)
            .attr("class", "lifeline")
            .attr("width", x_scale(+death.date.substring(0,4)) - x_scale(+birth.date.substring(0,4)))
            .attr("height", axisY - timelineY)
            .attr("fill", color)
            .attr("opacity", 0); // always invisible

        // Add timeline text at the left end
        const label = g.append("text") //need to keep this one not commented out
            // .attr("class", "timeline-label")
            // .attr("x", x_scale(1779))
            // .attr("y", timelineY + timelineHeight / 2 - 20)
            // .attr("text-anchor", "start")
            // .attr("fill", "black")
            // .attr("font-size", "30px")
            // .attr("opacity", 0)
            // .text(`${person}`);

        //add date elected president to timeline (if elected president)
        const elected = dates.find(d => d.event === "Assumed Presidency");
        let electedRect = null, electedText = null;
        if (elected) {
            electedRect = g.append("rect")
                .attr("x", x_scale(+elected.date.substring(0,4)) - 5)
                .attr("y", timelineY)
                .attr("width", 10)
                .attr("height", axisY - timelineY)
                .attr("fill", "#B31942")
                .attr("opacity", 0);

            electedText = g.append("text")
                .attr("class", "chart-label")
                .attr("x", x_scale(+elected.date.substring(0,4)) - 10)
                .attr("y", timelineY + 20)
                .attr("text-anchor", "end")
                .attr("opacity", 0)
                .text("Assumed Presidency");
        }

        // add death date marker and label
        let deathRect = null, deathText = null;
    
        deathRect = g.append("rect")
            .attr("x", x_scale(+death.date.substring(0,4)))
            .attr("y", timelineY)
            .attr("width", 10)
            .attr("height", axisY - timelineY)
            .attr("fill", "#000000ff")
            .attr("opacity", 0);

        deathText = g.append("text")
            .attr("class", "chart-label")
            .attr("x", x_scale(+death.date.substring(0,4)) - 10)
            .attr("y", timelineY + 20)
            .attr("text-anchor", "end")
            .attr("opacity", 0)
            .text(
                death.age_at_death      
                    ? `Died at ${death.age_at_death} years of age`
                    : "Death"
            );
        

        // Wait for all images to load before fading in timeline
        const images = g.selectAll("image");
        let total = images.size();
        const timelineFadeMs = 800; // 0.2 seconds

        if (total === 0) {
            // No images, fade in immediately
            lifeline.transition().duration(timelineFadeMs).attr("opacity", 0); // keep invisible
            label.transition().duration(timelineFadeMs).attr("opacity", 1);
            if (electedRect) electedRect.transition().duration(timelineFadeMs).attr("opacity", 0.7);
            if (electedText) electedText.transition().duration(timelineFadeMs).attr("opacity", 1);
            if (deathRect) deathRect.transition().duration(timelineFadeMs).attr("opacity", 0.7);
            if (deathText) deathText.transition().duration(timelineFadeMs).attr("opacity", 1);
        } else {
            let loaded = 0;
            images.each(function() {
                this.addEventListener("load", function handler() {
                    loaded++;
                    if (loaded === total) {
                        lifeline.transition().duration(timelineFadeMs).attr("opacity", 0); // keep invisible
                        label.transition().duration(timelineFadeMs).attr("opacity", 1);
                        if (electedRect) electedRect.transition().duration(timelineFadeMs).attr("opacity", 0.7);
                        if (electedText) electedText.transition().duration(timelineFadeMs).attr("opacity", 1);
                        if (deathRect) deathRect.transition().duration(timelineFadeMs).attr("opacity", 0.7);
                        if (deathText) deathText.transition().duration(timelineFadeMs).attr("opacity", 1);
                    }
                    this.removeEventListener("load", handler);
                });
            });
        }
    }



    function drawChart(selectedPerson = "George Washington") {
        d3.select("#histogram").selectAll("*").remove();

        //dimensions
        const margin = ({top: 150, right: 50, bottom: 100, left: 50});
        const width = window.innerWidth*0.99;
        const height = window.innerHeight*0.85;


        //x-axis for years
        const x_scale = d3.scaleLinear()
            .domain([1780,1810]) // set min and max years at 1780 and 1810
            .range([margin.left, width - margin.right]);

        const histogram = d3.select("#histogram")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "lightgray")
        
        
        const g = histogram.append("g");
        const imageBaseY = margin.top;
        const imageSpacing = 62; // 60 + 2px vertical padding
        const imageWidth = 58;
        const imageHeight = 60;


        // Filter for selected person and between 1780 and 1810
        var personData = data.filter(d => 
            d.Sitter === selectedPerson &&
            +d.Clean_Date >= 1780 && +d.Clean_Date <= 1810 &&
            d.thumbnail && // 
            d.face_urls && d.face_urls.trim() !== "" // ensure face_urls is not empty
        );

        //Dropdown Image next to menu
        const dropdownImg = document.getElementById("dropdown_image");
        const sorted = personData.slice().sort((a, b) => +a.Clean_Date - +b.Clean_Date);
        dropdownImg.src = sorted[0].face_urls.split("; ")[0];
        dropdownImg.alt = `${selectedPerson} portrait ${sorted[0].Clean_Date}`;
        
    


        const timelineHeight = 25;
        const timelineY = imageBaseY - timelineHeight + 35;
        //draw timeline before years
        // Change timeline color from "#B31942" (red) to a neutral color, e.g., "#888" (gray)
        draw_timeline(selectedPerson, "#888888", timelineY, timelineHeight, x_scale, g, data);

        

        // Group images by year for stackIndex
        const yearGroups = {};
        personData.forEach(d => {
            const year = +d.Clean_Date;
            if (!yearGroups[year]) yearGroups[year] = [];
            yearGroups[year].push(d);
            d.stackIndex = yearGroups[year].indexOf(d);
        });

        // Calculate the bottom y position of the last stacked image
        const maxStackIndex = d3.max(gwData, d => d.stackIndex);
        const axisY = height - margin.bottom; // 10px above the top of the images

        const images = g.selectAll("image")
            .data(personData)
            .enter()
            .append("g")
            .attr("class","image_group")
            .attr("href", d => d.thumbnail)
            .attr("transform", d => {
                // axisY is the y position of the bottom axis
                // imageHeight + imageSpacing is the vertical step per image
                // d.stackIndex = 0 is the bottom image, higher stackIndex is higher up
                const y = axisY - imageHeight - d.stackIndex * imageSpacing;
                return `translate(${x_scale(+d.Clean_Date) - imageWidth/2}, ${y})`;
            })


        // Add image
        images.append("image")
            .attr("href", d => d.face_urls.split("; ")[0]) // use first face url
            .attr("width", imageWidth)
            .attr("height", imageHeight)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .style("cursor", "pointer") // <-- pointer cursor on face images
            .on("click", (event, d) => {
                window.open(d.collectionsURL, "_blank");
            });

        // Draw x-axis above the images
        const x_axis = d3.axisBottom(x_scale)
            .ticks(9)
            .tickFormat(d3.format("d"));

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${axisY})`)
            .call(x_axis)
            .selectAll('text')	
            .style('text-anchor', 'middle')
            .style('font-size', '20px')
            .attr('dy', '1.5em');




        // Set cursor for dropdown menu to default (text/selectable) on hover
        const dropdown = document.getElementById("dropdown_menu");
        if (dropdown) {
            dropdown.addEventListener("mouseover", function() {
                this.style.cursor = "pointer";
            });
            dropdown.addEventListener("mouseout", function() {
                this.style.cursor = "";
            });
        }


        // document.getElementById("reset-button").onclick = function() {
        //     histogram.transition()
        //         .duration(500)
        //         .call(zoomBehavior.transform, d3.zoomIdentity);
        // };

        // // Update h2 text to selected person
        // const h2 = document.querySelector("h2");
        // h2.textContent = selectedPerson;
    }
    //get timeline dates globally
    d3.json("Data/dates.json").then(dates => {
        timeline_dates = dates;

        // Populate dropdown
        const select = document.getElementById("dropdown_menu");
        Object.keys(timeline_dates).forEach(person => {
            const option = document.createElement("option");
            option.value = person;
            option.textContent = person;
            select.appendChild(option);
        });


        function setDescription(person) {
            const descBox = document.getElementById("description-box");
            const arr = timeline_dates[person];
            if (arr && arr.length > 0) {
                const summaryObj = arr.find(obj => obj.summary);
                descBox.textContent = summaryObj ? summaryObj.summary : "";
            } else {
                descBox.textContent = "";
            }
        }

        // when dropdown changes, change the chart and description
        select.addEventListener("change", function() {
            const selectedPerson = this.value;
            drawChart(selectedPerson); // redraw chart for selected person
            setDescription(selectedPerson);
        });

        // Initial draw and description
        drawChart();
        setDescription(select.value || "George Washington");
    });

    

    
    
    window.addEventListener("resize", () => {
        const select = document.getElementById("dropdown_menu");
        const selectedPerson = select.value || "George Washington";
        drawChart(selectedPerson);
        draw_timeline(selectedPerson);
    });


});





//barplot

let portraits;
let grouped;
const minCount = 4;

const tooltip = d3.select("#tooltip"); //make sure tooltip is selected
chosen_decade = 1790; // set decade for filtering

//Load data
d3.csv('Data/check_dates.csv').then( data => {
    portraits = data
        .filter(d => !d.Sitter.includes("Unidentified"))
        .filter(d => !d.Sitter.includes("unidentified"))
        .filter(d => !d.Sitter.includes("Multiple Portraits"))
        //.filter(d => d.Clean_Date >= 1770 && d.Clean_Date <= 1790); old filter for testing
    // const date_filted = portraits.filter(d=>{
    //   const year = +d.Clean_Date;
    //   return year >= chosen_decade && year < chosen_decade + 10;
    // })
    // have not made this function yet. When I do, change portraits to date_filtered
    grouped = d3.group(portraits, d => d.Sitter);
    grouped = new Map(Array.from(grouped).filter(([sitter, arr]) => arr.length >= minCount).sort((a, b) => b[1].length - a[1].length));
    console.log(grouped)
    d3.select('#viz').selectAll('*').remove(); // Clear previous chart
    displayData();


    function click_text(event, d){ //takes an event and data (we have piped in the array so data is hanlded)
      const sitterName = d[0]; // take first element from d, i.e. sitter
      displayThumbnails(sitterName, portraits);
      highlight_rectange.call(this, event, d); // highlight the clicked rectangle
      console.log(sitterName)
    }
    // add click to bar
    d3.selectAll('rect').on("click", click_text);


})

function displayData(){
  // define dimensions and margins for the graphic
  const margin = ({top: 20, right: 50, bottom: 20, left: 80}); // this is unused?
  const width = window.innerWidth - 100;
  const height = 300;
  
  // Change container to select #barplot_aside and append SVG
  const container = d3.select('#barplot_aside')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const sitters = Array.from(grouped.keys());
  const maxCount = d3.max(grouped, ([,arr]) => arr.length);

  //Scales
  const xScale = d3.scaleBand()
    .domain(sitters) // look at all sitters
    .range([margin.left, width - margin.right]) //display across the page
    .padding(0.1); // add padding

  const yScale = d3.scaleLinear()
    .domain([0, maxCount]) // from 0 to max count of portraits
    .range([height - margin.bottom, margin.top]); // from bottom to top of page
  
  const sequentialScale = d3.scaleSequential()
    .domain([0, d3.max(Array.from(grouped.values()), arr => arr.length)])
    .interpolator(d3.interpolateRgb("red", "blue"));

  // attach a graphic element, and append rectangles to it
  container.append('g')
    .selectAll('rect')
    .data(Array.from(grouped.entries()))
    .join('rect')
    .attr('x', ([sitter, arr]) => xScale(sitter))
    .attr('y', ([, arr]) => yScale(arr.length))
    .attr('height', ([, arr]) => yScale(0) - yScale(arr.length))
    .attr('width', xScale.bandwidth() - 2)
    .style('fill', ([, arr]) => sequentialScale(arr.length)); // use scale to generate color
 
  // Axes
  // Y Axis
  const yAxis =  d3.axisLeft(yScale).ticks(5)

  container.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxis);

  // X Axis
  const xAxis =  d3.axisBottom(xScale).tickSize(0);

  // add x axis and rotate text (from lab example)
  container.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll('text')	
    .style('text-anchor', 'end')
    .attr('dx', '-.6em')
    .attr('dy', '-0.1em')
    .attr('transform', d => {return 'rotate(-45)' });

  // Labelling the graph
  container.append('text')
    .attr('font-family', 'sans-serif')
    .attr('font-weight', 'bold')
    .attr('font-size', 20)
    .attr('y', margin.top-20)
    .attr('x', margin.left)
    .attr('fill', 'black')
    .attr('text-anchor', 'start')

  //y-axis label
  container.append("text")
    .attr("transform", "rotate(-90)")
    .attr("font-family", "sans-serif")
    .attr("font-size", 15)
    .attr("y", 30)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Portraits");
  
};