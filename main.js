var crimeData = [];
var fireData = [];

// Promise.all([
//     fetch('CrimeMap_geocoded.json').then(response => response.json()),
//     fetch('https://smartcity.tacc.utexas.edu/FireIncident/data/2022-08-08-FireMap.json').then(response => response.json())
// ]).then(([crimeResponse, fireResponse]) => {
//     crimeData = crimeResponse;
//     fireData = fireResponse.rss.channel.item;

//     const events = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));

//     events.forEach((event, index) => {
//         let listItem, summary, details, dateString;
        
//         if (event.report_date_time) {
//             // This is a crime event
//             dateString = new Date(event.report_date_time).toLocaleString();
//             summary = `${event.offenses.join(', ')}`;
//             details = `
//                 Report Date: ${dateString}<br>
//                 Location: ${event.offense_location.join(', ')}<br>
//                 Crime: ${event.report_number}
//             `;
//         } else {
//             // This is a fire event
//             dateString = new Date(event.pubDate).toLocaleString();
//             summary = event.title;
//             details = `
//                 Location: ${event.description.split('|')[0]}<br>
//                 Publish Date: ${dateString}
//             `;
//         }

//         listItem = `
//             <div class="card">
//                 <div class="card-header" id="heading${index}">
//                     <h2 class="mb-0">
//                         <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
//                             ${summary}
//                         </button>
//                     </h2>
//                 </div>

//                 <div id="collapse${index}" class="collapse" aria-labelledby="heading${index}" data-parent="#eventsAccordion">
//                     <div class="card-body">
//                         ${details}
//                     </div>
//                 </div>
//             </div>
//         `;

//         $('#eventsAccordion').append(listItem);
//     });
// }).then(() => {
//     crimeData = crimeResponse;
//     fireData = fireResponse.rss.channel.item;
//     const events = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));
//     updateSidebar(events);
// });

// Function to update the sidebar with events
// function updateSidebar(events) {
//     var sidebarContent = document.getElementsByClassName('sidebar-content')[0];
//     sidebarContent.innerHTML = ''; 

//     events.forEach(function(event) {
//         var eventDiv = document.createElement('div');
//         eventDiv.className = 'sidebar-event';
//         eventDiv.innerHTML = `<h4>${event.type}</h4><p>${event.description}</p>`;
//         sidebarContent.appendChild(eventDiv);
//     });
// }

// document.getElementById('btnFires').addEventListener('click', function() {
//     var fireEvents = events.filter(event => event.type === 'Fire');
//     $('#sidebar').removeClass('collapsed');
//     document.getElementsByClassName("cesium-geocoder-input")[0].value = "Fires";
//     updateSidebar(fireEvents);
// });

// document.getElementById('btnCrimes').addEventListener('click', function() {
//     var crimeEvents = events.filter(event => event.type === 'Crime');
//     $('#sidebar').removeClass('collapsed');
//     document.getElementsByClassName("cesium-geocoder-input")[0].value = "Crimes";
//     updateSidebar(crimeEvents);
// });
function updateSidebar(events) {
    var sidebarContent = document.getElementsByClassName('sidebar-content')[0];
    sidebarContent.innerHTML = ''; // Clear previous content

    events.forEach(function(event) {
        var eventDiv = document.createElement('div');
        eventDiv.className = 'sidebar-event';
        
        let summary, details, dateString;

        if (event.report_date_time) {
            // This is a crime event
            dateString = new Date(event.report_date_time).toLocaleString();
            summary = `${event.offenses.join(', ')}`;
            details = `
                Report Date: ${dateString}<br>
                Location: ${event.offense_location.join(', ')}<br>
                Crime: ${event.report_number}
            `;
        } else {
            // This is a fire event
            dateString = new Date(event.pubDate).toLocaleString();
            summary = event.title;
            details = `
                Location: ${event.description.split('|')[0]}<br>
                Publish Date: ${dateString}
            `;
        }

        eventDiv.innerHTML = `<h4>${summary}</h4><p>${details}</p>`;
        sidebarContent.appendChild(eventDiv);
        // $('#eventsAccordion').innerHTML = '';
        // Events accordion approach
        // $('#eventsAccordion').append(eventDiv);
    });
}

document.getElementById('btnFires').addEventListener('click', function() {
    // Filter by fire events and update the sidebar
    var fireEvents = fireData;
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Fires";
    updateSidebar(fireEvents);
});

document.getElementById('btnCrimes').addEventListener('click', function() {
    // Filter by crime events and update the sidebar
    var crimeEvents = crimeData;
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Crimes";
    updateSidebar(crimeEvents);
});

document.getElementById('btnAirSensors').addEventListener('click', function() {
    // Filter by air sensor events and update the sidebar
    var airSensorEvents = events.filter(event => event.type === 'Air Sensor');
    $('#sidebar').removeClass('collapsed');
    document.getElementsByClassName("cesium-geocoder-input")[0].value = "Air Sensors";
    updateSidebar(airSensorEvents);
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

    const events = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));

    events.forEach((event, index) => {
        let listItem, summary, details, dateString;
        
        if (event.report_date_time) {
            // This is a crime event
            dateString = new Date(event.report_date_time).toLocaleString();
            summary = `${event.offenses.join(', ')}`;
            details = `
                Report Date: ${dateString}<br>
                Location: ${event.offense_location.join(', ')}<br>
                Crime: ${event.report_number}
            `;
        } else {
            // This is a fire event
            dateString = new Date(event.pubDate).toLocaleString();
            summary = event.title;
            details = `
                Location: ${event.description.split('|')[0]}<br>
                Publish Date: ${dateString}
            `;
        }

        listItem = `
            <div class="card">
                <div class="card-header" id="heading${index}">
                    <h2 class="mb-0">
                        <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
                            ${summary}
                        </button>
                    </h2>
                </div>

                <div id="collapse${index}" class="collapse" aria-labelledby="heading${index}" data-parent="#eventsAccordion">
                    <div class="card-body">
                        ${details}
                    </div>
                </div>
            </div>
        `;

        $('#eventsAccordion').append(listItem);
    });
}).then(() => {
    // const events = [...crimeData, ...fireData].sort((a, b) => new Date(b.report_date_time || b.pubDate) - new Date(a.report_date_time || a.pubDate));
    updateSidebar(events);
});
