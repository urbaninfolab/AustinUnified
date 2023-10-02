function getDangerRating(event) {
    let rating = 0.0;
    let pips = "";
    
    if (event.report_date_time) {
        let offensesCount = event.offenses.length;
        rating = offensesCount; // simple example, adjust as needed

        if (offensesCount <= 1) pips = "🟡";
        else if (offensesCount <= 3) pips = "🟠🟠";
        else pips = "🔴🔴🔴";
    } else {
        rating = 3.0; // assuming all fires are most dangerous
        pips = "🔴🔴🔴";

        // The danger of a fire is whether the name contains "brush" or "small" "structure" "traffic"
        let name = event.title.toLowerCase();

        if (name.includes("brush")) {
            rating = 1.0;
            pips = "🟡";
        }
        else if (name.includes("small") || name.includes("traffic")) {
            rating = 2.0;
            pips = "🟠🟠";
        }

    }

    return `${rating.toFixed(1)} ${pips}`;
}

function humanReadableDate(date) {
    const today = new Date();
    const eventDate = new Date(date);
    let dateString = "";

    // If the event was today, just show the time
    if (eventDate.toDateString() === today.toDateString()) {
        let hours = eventDate.getHours();
        let minutes = eventDate.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        dateString = `${hours}:${minutes} ${ampm}`;
    } else {
        dateString = `${eventDate.getMonth() + 1}/${eventDate.getDate()}/${eventDate.getFullYear()}`;
    }

    return dateString;
}

function isCrimeActive(crimeType) {
    // Returns true if the crime is considered active, false otherwise
    switch(crimeType) {
        case "HARASSMENT":
            return true;
        case "THEFT":
            return false;
        // Add more cases as needed
        default:
            return false;
    }
}


var crimeData = [];
var fireData = [];

function updateSidebar(events, clear=true) {
    // var sidebarContent = document.getElementsByClassName('sidebar-content')[0];
    // sidebarContent.innerHTML = '';
    var accordion = document.getElementById('eventsAccordion');

    if(clear)
    accordion.innerHTML = '';

    events.forEach(function(event) {
        var eventDiv = document.createElement('div');
        eventDiv.className = 'list-element';

        var textDiv = document.createElement('div');
        textDiv.className = 'list-text';


        let name, details, address, description, dateString, typeAndAddress;

        let type = "";

        if (event.report_date_time) {
            // This is a crime event
            date = new Date(event.report_date_time).toLocaleString();
            let crimeStatusText = isCrimeActive(event.offenses[0]) ? "Started" : "Closed";
            dateString = `${isCrimeActive(event.offenses[0]) ? `<span style="color: green;">Active</span>` : `<span style="color: red;">Inactive</span>`} • ${crimeStatusText} ${humanReadableDate(date)}`;
            name = `${event.offenses.join(', ')}`;
            address = `${event.offense_location[0]}`; 
            details = `Report: ${event.report_number}`;
            description = dateString;
            type = "Crime";
        } else {
            // This is a fire event
            date = new Date(event.pubDate).toLocaleString();
            let fireStatusText = event.active_status === 'yes' ? "Started" : "Closed";
            dateString = `${event.active_status === 'yes' ? `<span style="color: green;">Active</span>` : `<span style="color: red;">Inactive</span>`} • ${fireStatusText} ${humanReadableDate(date)}`;
            name = event.title.split('-').length > 1 ? event.title.split('-')[1] : event.title;
            address = `${event.description.split('|')[0]}`;
            details = "";
            description = dateString;
            type = "Fire";
        }
        
    
        var nameP = document.createElement('p');
        nameP.className = 'list-name';
        nameP.textContent = name.toLowerCase().replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
        });
    
        var ratingP = document.createElement('p');
        ratingP.className = 'list-rating';
        ratingP.textContent = getDangerRating(event);

        
        // Remove everything from address after ,
        address = address.split(',')[0];
        address = address.toLowerCase().replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
        });

        var typeAndAddressP = document.createElement('p');
        typeAndAddressP.className = 'list-address';
        typeAndAddressP.textContent = type + " • " + address;
    
        var descriptionP = document.createElement('p');
        descriptionP.className = 'list-description';
        descriptionP.innerHTML = description;
    
        textDiv.appendChild(nameP);
        textDiv.appendChild(ratingP);
        textDiv.appendChild(typeAndAddressP);
        if (details) {
            var detailsP = document.createElement('p');
            detailsP.className = 'list-details';
            detailsP.textContent = details;
            textDiv.appendChild(detailsP);
        }
        textDiv.appendChild(descriptionP);
        eventDiv.appendChild(textDiv);

        var imgDiv = document.createElement('div');
        imgDiv.className = 'list-img';
        var imgElem = document.createElement('img');
        // You'd typically want a placeholder image or a specific image for each event. For now, I'll just use a placeholder.
        imgElem.src = 'https://via.placeholder.com/84'; // Update this path to your image
        
        var imgLat;
        var imgLng;

        // round lat and lng to 5 decimal places
        if(event.latitude != null && event.longitude != null) {
            try {
                let lat = event.latitude.toFixed(5);
                let lng = event.longitude.toFixed(5);
                imgElem.src = 'https://imagery.austindigitaltwin.com/image/' + lat + '/' + lng;
                imgElem.onerror = function() {
                    imgElem.src = 'https://via.placeholder.com/84';
                }
                imgLat = lat;
                imgLng = lng;
            }
            catch(e) {
                imgElem.src = 'https://via.placeholder.com/84';
                console.log(e);
            }    
        } else if(event.link != null) {
            try {
                let lat_lng = event.link.replace('http://maps.google.com/maps?q=', '').split(',');
                let lat = parseFloat(lat_lng[0]).toFixed(5);
                let lng = parseFloat(lat_lng[1]).toFixed(5);
                imgElem.src = 'https://imagery.austindigitaltwin.com/image/' + lat + '/' + lng;
                imgElem.onerror = function() {
                    imgElem.src = 'https://via.placeholder.com/84';
                }
                imgLat = lat;
                imgLng = lng;
            }
            catch(e) {
                imgElem.src = 'https://via.placeholder.com/84';
                console.log(e);
            }
        } 
        
        imgDiv.appendChild(imgElem);

        eventDiv.appendChild(textDiv);
        eventDiv.appendChild(imgDiv);

        // on eventdiv click, zoom to event on cesium map
        eventDiv.addEventListener('click', function() {
            if(event.latitude != null && event.longitude != null) {
            viewer.camera.flyTo({
                destination : Cesium.Cartesian3.fromDegrees(event.longitude, event.latitude, 1000.0),
                // orientation: {
                //     heading: Cesium.Math.toRadians(0.0),
                //     pitch: Cesium.Math.toRadians(-35.0),
                // }
            });
            } else if(event.link != null) {
            var lat_lng = event.link.replace('http://maps.google.com/maps?q=', '').split(',')
            viewer.camera.flyTo({
                destination : Cesium.Cartesian3.fromDegrees(parseFloat(lat_lng[1]), parseFloat(lat_lng[0]), 1000.0),
                // orientation: {
                //     heading: Cesium.Math.toRadians(0.0),
                //     pitch: Cesium.Math.toRadians(-35.0),
                // }
            });
            }

            console.log("yummers");

            // Also, open up the sidebar and show the event details
            // remove the current active from all sidebar panes
            let sidebarPanes = document.getElementsByClassName('sidebar-pane');
            
            // get the id of the current sidebar pane
            let sidebarPaneId = document.getElementsByClassName('sidebar-pane active')[0].id;

            for (let i = 0; i < sidebarPanes.length; i++) {
                sidebarPanes[i].className = 'sidebar-pane';
            }
            document.getElementById('event').className = 'sidebar-pane active';
            
            // clear the event div
            document.getElementById('event').innerHTML = '<h1 class="sidebar-header"></h1>';

            // add image to event div
            var eventImage = document.createElement('img');
            // eventImage.src = 'https://perfume-proceed-photo-fifth.trycloudflare.com/30.37934_-97.66141.png';
            eventImage.src = 'https://imagery.austindigitaltwin.com/image/' + imgLat + '/' + imgLng;
            eventImage.style = 'width:100%;object-fit: cover;height:320px;';
            eventImage.id = 'eventimage';
            document.getElementById('event').appendChild(eventImage);


            let eventDivCopy = eventDiv.cloneNode(true);
            // replace the src of event div image "#eventimage"
            document.getElementById('eventimage').src = eventDivCopy.getElementsByClassName('list-img')[0].getElementsByTagName('img')[0].src;
            eventDivCopy.getElementsByClassName('list-img')[0].remove();
            document.getElementById('event').appendChild(eventDivCopy);

            // shift cesium-geocoder-input cesium-geocoder-input-wide to the right 
            // and add a back button
            // Create the div wrapper for the back button
            var backButtonDiv = document.createElement("div");
            backButtonDiv.className = "back-button-div tooltip";
            backButtonDiv.style = "top: 3px;opacity: 1;left: 10px;border: none;";

            // Create the SVG element for the back button
            var backButtonSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            backButtonSVG.setAttribute("width", "32");
            backButtonSVG.setAttribute("height", "32");
            backButtonSVG.setAttribute("viewBox", "0 0 32 32");
            backButtonSVG.classList.add("back-button");

            var backPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            backPath.setAttribute("d", "M20 8 L8 16 L20 24");
            backPath.setAttribute("stroke", "#666");
            backPath.setAttribute("stroke-width", "3");
            backPath.setAttribute("fill", "#666");
            backButtonSVG.appendChild(backPath);

            // Create tooltip for the back button
            var backButtonTooltip = document.createElement("span");
            backButtonTooltip.className = "tooltiptext tooltip-bottom";
            backButtonTooltip.textContent = "Back";

            // Append the SVG and tooltip to the div wrapper
            backButtonDiv.appendChild(backButtonSVG);
            backButtonDiv.appendChild(backButtonTooltip);

            // Insert the back button before the Cesium geocoder input
            var geocoderInput = document.querySelector('.cesium-geocoder-input');
            var shiftAmount = "15px";
            geocoderInput.style = "margin-left: " + shiftAmount + ";width: 235px !important; ";
            // geocoderInput.parentNode.insertBefore(backButtonDiv, geocoderInput);
            
            if(!document.querySelector('.back-button-div')) {
                geocoderInput.parentNode.insertBefore(backButtonDiv, geocoderInput);
            }
            
            // margin-left: 15px;
            //width: 235px !important;

            // make the back button return the active class to the previous sidebar pane
            // and remove the back button (the id is stored in sidebarPaneId)
            backButtonDiv.addEventListener('click', function() {
                // remove the back button
                backButtonDiv.remove();

                geocoderInput.style = "";

                // remove the current active from all sidebar panes
                let sidebarPanes = document.getElementsByClassName('sidebar-pane');
                
                document.getElementsByClassName("cesium-geocoder-input")[0].value = "";

                for (let i = 0; i < sidebarPanes.length; i++) {
                    sidebarPanes[i].className = 'sidebar-pane';
                }

                // add the active class to the previous sidebar pane
                document.getElementById(sidebarPaneId).className = 'sidebar-pane active';
            }
            );

 

        });


        accordion.appendChild(eventDiv);

        // Events accordion approach

        // $('#eventsAccordion').append(eventDiv);

    });
}


var firstLi = document.getElementsByTagName('li')[0];
// remove active class from every other li

function removeActiveClass() {
    var lis = document.getElementsByTagName('li');
    for (var i = 0; i < lis.length; i++) {
        lis[i].className = '';
    }
    firstLi.className = 'active';
}

document.getElementById('btnFires').addEventListener('click', function() {
    // Filter by fire events and update the sidebar
    var fireEvents = fireData;
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Fires";
    removeActiveClass();
    document.getElementById('home').className = 'sidebar-pane active';
    updateSidebar(fireEvents);
    // Move eventsAccordion element to under the current "#home"
    $('#eventsAccordion').appendTo('#home');
});

document.getElementById('btnCrimes').addEventListener('click', function() {
    // Filter by crime events and update the sidebar
    var crimeEvents = crimeData;
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Crimes";
    removeActiveClass();
    // add active class to home sidebar 
    document.getElementById('home').className = 'sidebar-pane active';
    updateSidebar(crimeEvents);
    // Move eventsAccordion element to under the current "#home"
    $('#eventsAccordion').appendTo('#home');
});

document.getElementById('btnAirSensors').addEventListener('click', function() {
    // Filter by air sensor events and update the sidebar
    var airSensorEvents = events.filter(event => event.type === 'Air Sensor');
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Air Sensors";
    removeActiveClass();
    document.getElementById('home').className = 'sidebar-pane active';
    updateSidebar(airSensorEvents);
    // Move eventsAccordion element to under the current "#home"
    $('#eventsAccordion').appendTo('#home');
});

document.getElementById('recent').addEventListener('click', function() {
    // Show all events and update the sidebar
    var allEvents = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));
    console.log(allEvents);
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Recent Events";
    firstLi.className = 'active';
    updateSidebar(allEvents);
    // Move eventsAccordion element to under the current "#profile"
    $('#eventsAccordion').appendTo('#profile');

});

document.getElementById('important').addEventListener('click', function() {
    // Sort by danger rating and update the sidebar
    // danger rating returns a string like "3.0 🔴🔴🔴"
    var dangerRating = (event) => parseFloat(getDangerRating(event).split(' ')[0]);
    var allEvents = [...crimeData, ...fireData].sort((a, b) => dangerRating(b) - dangerRating(a));
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Important Events";
    firstLi.className = 'active';
    updateSidebar(allEvents);
    // Move eventsAccordion element to under the current "#messages"
    $('#eventsAccordion').appendTo('#messages');
});

// Example events (replace this with real data)
// const events = [
//     { type: 'Fire', description: 'Fire near Park St.' },
//     { type: 'Crime', description: 'Robbery at Main St.' },
//     { type: 'Air Sensor', description: 'Sensor ID: 123' },
//     { type: 'Fire', description: 'Fire near Elm St.' }
// ];

// Initially populate the sidebar with all events
// updateSidebar(events);



Promise.all([
    fetch('CrimeMap_geocoded.json').then(response => response.json()),
    fetch('https://smartcity.tacc.utexas.edu/FireIncident/data/2022-08-08-FireMap.json').then(response => response.json())
]).then(([crimeResponse, fireResponse]) => {
    crimeData = crimeResponse;
    fireData = fireResponse.rss.channel.item;

    // const events = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));

    // events.forEach((event, index) => {
    //     let listItem, summary, details, dateString;
        
    //     if (event.report_date_time) {
    //         // This is a crime event
    //         dateString = new Date(event.report_date_time).toLocaleString();
    //         summary = `${event.offenses.join(', ')}`;
    //         details = `
    //             Report Date: ${dateString}<br>
    //             Location: ${event.offense_location.join(', ')}<br>
    //             Crime: ${event.report_number}
    //         `;
    //     } else {
    //         // This is a fire event
    //         dateString = new Date(event.pubDate).toLocaleString();
    //         summary = event.title;
    //         details = `
    //             Location: ${event.description.split('|')[0]}<br>
    //             Publish Date: ${dateString}
    //         `;
    //     }

    //     listItem = `
    //         <div class="card">
    //             <div class="card-header" id="heading${index}">
    //                 <h2 class="mb-0">
    //                     <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
    //                         ${summary}
    //                     </button>
    //                 </h2>
    //             </div>

    //             <div id="collapse${index}" class="collapse" aria-labelledby="heading${index}" data-parent="#eventsAccordion">
    //                 <div class="card-body">
    //                     ${details}
    //                 </div>
    //             </div>
    //         </div>
    //     `;

    //     $('#eventsAccordion').append(listItem);
    // });
}).then(() => {
    // const events = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));
    // updateSidebar(events);
});
