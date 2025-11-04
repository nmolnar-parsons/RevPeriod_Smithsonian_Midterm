// non-zoomable, vertically arranged timeline



// SVG size should be twice the size of the viewport


// loadchart


// HTML structure:
    // Landing
    // First timeline 
        //  (only George Washington)
    // Interlude:
        // barplot of sitter counts
    // Second Timeline
        // fully explorable



async function load() {
    // load dates and revperiod data
    dates = await d3.json("Data/dates.json");
    data = await d3.csv("Data/revperiod_portraits_with_faces.csv");
    var filteredData = data.filter( d =>
        +d.Clean_Date >= 1780 && +d.Clean_Date <= 1810 &&
        d.thumbnail // this checks that thumbnail is not empty, null, or undefined
    );

    // group images by year
    const yearGroups = {};
    filteredData.forEach(d => {
        const year = +d.Clean_Date;
        if (!yearGroups[year]) yearGroups[year] = [];
        yearGroups[year].push(d);
        d.stackIndex = yearGroups[year].indexOf(d);
    });
    




}


function drawTimeline(){
    // create svg
    




}




function drawChart(){

    



}

load();


