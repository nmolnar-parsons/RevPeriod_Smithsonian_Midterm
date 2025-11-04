let timeline_dates = null; // global variable




d3.csv("Project_2/Data/revperiod_portraits_with_faces.csv").then(data => {

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
            .attr("opacity", 0);

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
                .attr("fill", "#0A3161")
                .attr("opacity", 0);

            electedText = g.append("text")
                .attr("class", "elected-label")
                .attr("x", x_scale(+elected.date.substring(0,4)) - 10)
                .attr("y", timelineY + 20)
                .attr("text-anchor", "end")
                .attr("fill", "black")
                .attr("font-size", "16px")
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
            .attr("class", "death-label")
            .attr("x", x_scale(+death.date.substring(0,4)) - 10)
            .attr("y", timelineY + 20)
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .attr("font-size", "16px")
            .attr("opacity", 0)
            .text(
                death.age_at_death      
                    ? `Died, aged ${death.age_at_death} years`
                    : "Death"
            );
        

        // Wait for all images to load before fading in timeline
        const images = g.selectAll("image");
        let total = images.size();
        const timelineFadeMs = 800; // 0.2 seconds

        // this is overly complicated.
        if (total === 0) {
            // No images, fade in immediately
            lifeline.transition().duration(timelineFadeMs).attr("opacity", 0.5);
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
                        lifeline.transition().duration(timelineFadeMs).attr("opacity", 0.5);
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



    // Refactor drawChart to accept a person argument
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
        const imageSpacing = 60;
        const imageWidth = 60;
        const imageHeight = 60;
        const borderSize = 2;

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
        draw_timeline(selectedPerson, "#B31942", timelineY, timelineHeight, x_scale, g, data);

        

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
            
        //borders?
        // images.append("rect")
        //     .attr("width", imageWidth)
        //     .attr("height", imageHeight)
        //     .attr("fill", "none")
        //     .attr("stroke", "#b53632ff")
        //     .attr("stroke-width", borderSize);

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
            .style('text-anchor', 'start')
            .attr('dx', '0.5em')
            .attr('dy', '1.5em')
            .attr('transform',"rotate(45)" );

        // Set cursor for svg area to grab
        d3.select("#histogram")
            .style("cursor", "grab");

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

        // zoom functionality copied from here https://observablehq.com/@d3/zoom
        histogram.call(d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([1, 8])
            .on("zoom", zoomed));

        function zoomed({transform}) {
            g.attr("transform", transform);
        }


        const zoomBehavior = d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        histogram.call(zoomBehavior);

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
    d3.json("Project_2/Data/dates.json").then(dates => {
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








// Code Graveyard

//commenting out the click on effect as timelines are not displayed next to each other
                    
                // // .on("click", () => {
                // //     const personData = data.filter(d => d.Sitter === person 
                // //         && +d.Clean_Date >= 1780 && +d.Clean_Date <= 1810 &&    
                // //         d.thumbnail && d.face_urls && d.face_urls.trim() !== ""
                // //     );


                // //     // // Recalculate stackIndex for this person's images
                // //     // const yearGroups = {};
                // //     // personData.forEach(d => {
                // //     //     const year = +d.Clean_Date;
                // //     //     if (!yearGroups[year]) yearGroups[year] = [];
                // //     //     yearGroups[year].push(d);
                // //     // });
                // //     // personData.forEach(d => {
                // //     //     const year = +d.Clean_Date;
                // //     //     d.stackIndex = yearGroups[year].indexOf(d);
                // //     // });

                // //     // // Fade out old images
                // //     // g.selectAll(".image_group")
                // //     //     .transition()
                // //     //     .duration(400)
                // //     //     .style("opacity", 0)
                // //     //     .remove();


                // //     // images.append("image")
                // //     //     .attr("href", d => d.face_urls.split("; ")[0]) // use first face url
                // //     //     .attr("width", imageWidth)
                // //     //     .attr("height", imageHeight)
                // //     //     .attr("preserveAspectRatio", "xMidYMid slice")
                // //     //     .on("click", (event, d) => {
                // //     //         window.open(d.collectionsURL, "_blank");
                // //     //     })
                // //     // images.append("rect")
                // //     //     .attr("width", imageWidth)
                // //     //     .attr("height", imageHeight)
                // //     //     .attr("fill", "none")
                // //     //     .attr("stroke", "#b53632ff")
                // //     //     .attr("stroke-width", borderSize);


                // //     // // Fade in new images
                // //     // images.transition()
                // //     //     .duration(400)
                // //     //         .style("opacity", 1);
                // //     const select = document.getElementById("dropdown_menu");
                // //     select.value = person;
                // //     select.dispatchEvent(new Event("change"));
                // });
