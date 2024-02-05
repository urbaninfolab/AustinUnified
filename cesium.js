// document.getElementById('sidebar-toggle').addEventListener('click', function() {
//     var sidebar = document.getElementById('sidebar');
//     var button = document.getElementById('sidebar-toggle');
//     if (sidebar.classList.contains('open')) {
//         sidebar.classList.remove('open');
//         button.classList.remove('open');
//     } else {
//         sidebar.classList.add('open');
//         button.classList.add('open');
//     }
// });

        Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODhiN2NhYi02NzgxLTQ2OWQtOTAzMi02ZTgwYmNjMGJmYjYiLCJpZCI6MTM4NjUzLCJpYXQiOjE2ODQxMTUyNDV9.yzVSoiedb3diO7rOG9kd9Luuamx4Wjnieson-zb3vvk";

        // Cesium.GoogleMaps.defaultApiKey = "AIzaSyDV0rBF5y2f_xsSNj32fxvhqj3ZErTt6HQ";

        // const viewer = new Cesium.Viewer("cesiumContainer", {
        //     terrainProvider: Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        //     globe: false,
        // });

        const viewer = new Cesium.Viewer("cesiumContainer", {
            terrainProvider: Cesium.CesiumTerrainProvider.fromIonAssetId(
              1
            ), // start the viewer in located in Austin
          });
           viewer.scene.globe.depthTestAgainstTerrain = true;


    let cesiumTileset;  // Store reference to the Cesium tileset
    let googleTileset;  // Store reference to the Google tileset

    async function createGooglePhotorealistic3DTileset() {
        try {
        const tileset1 = await Cesium.createGooglePhotorealistic3DTileset(
            "AIzaSyDV0rBF5y2f_xsSNj32fxvhqj3ZErTt6HQ",
            {
                // maximumScreenSpaceError: 2// The defaults to 16. Lower is higher quality.
            }
        );
        // const tileset1 = new Cesium.Cesium3DTileset({
        //     url: 'http://localhost:3001/tileset/', // Point this to your caching server
        // });
        // viewer.scene.primitives.add(tileset);
        
        console.log(tileset1);
        googleTileset = tileset1;
        window.tileset = tileset1;

        viewer.scene.primitives.add(tileset1);

        // // viewer.scene.primitives.add(tileset);
        // await new Promise((resolve, reject) => {
        //     // wait 5 seconds
        //     setTimeout(() => {        
        //         viewer.scene.primitives.add(tileset1);
        //         console.log("5 seconds passed");
        //         resolve();
        //     }, 5000);
        // });
        // Ready promise 20 seconds
        
        await new Promise((resolve, reject) => {
            // wait 5 seconds
            setTimeout(() => {        
                fetchAllData();
                console.log("5 seconds passed");
                resolve();
            }, 500);
        });

        console.log("Tileset loaded!");
        // fetchAllData();

        } catch (error) {
        console.log(`Failed to load tileset: ${error}`);
        }
    }


    createGooglePhotorealistic3DTileset();


    // Load Cesium Tileset
    async function createCesiumTileset() {
        try {
            const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
            cesiumTileset = tileset;
            viewer.scene.primitives.add(tileset);
            await viewer.zoomTo(tileset);

            // Apply the default style if it exists
            const extras = tileset.asset.extras;
            if (Cesium.defined(extras) && Cesium.defined(extras.ion) && Cesium.defined(extras.ion.defaultStyle)) {
                tileset.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
            }

            // Hide the Cesium tileset visually but allow it to be clickable
            tileset.show = true;

            // Set the tileset to fully transparent
            tileset.style = new Cesium.Cesium3DTileStyle({
                color: "rgba(0, 0, 0, 0.0)"  // Fully transparent
            });


            tileset.loadProgress.addEventListener((numberOfPendingRequests, numberOfTilesProcessing) => {
                if (numberOfPendingRequests === 0 && numberOfTilesProcessing === 0) {
                    // Set the tileset to fully transparent
                    tileset.style = new Cesium.Cesium3DTileStyle({
                        color: "rgba(0, 0, 0, 0.01)"  // Fully transparent
                    });
                    // All tiles are loaded
                    tileset.show = true;
                }
            });

        } catch (error) {
            console.log(`Failed to load Cesium tileset: ${error}`);
        }
    }
    createCesiumTileset();


    // Load in Austin housing 
    let housingData = [];

    Papa.parse('austinHousingData.csv', {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
          console.log("Completed parsing CSV");
          housingData = results.data;
          console.log(results);
        },
        error: function(error, file) {
          console.log("Error while parsing CSV", error, file);
        },
        download: true // If the file is to be fetched from the server
      });
      
      



    let previouslySelectedFeature;  // Store the previously selected feature
    const defaultColor = new Cesium.Color(1, 1, 1, 1);  // Default color (white)
    const highlightColor = new Cesium.Color(0.7, 0.7, 0, 1);  // Highlight color (yellow)
    
    
  const selectedEntity = new Cesium.Entity();


  function getCesium3DTileFeatureDescription(feature) {
    const propertyIds = feature.getPropertyIds();
  
    let html = "";
    propertyIds.forEach(function (propertyId) {
      const value = feature.getProperty(propertyId);
      if (defined(value)) {
        html += `<tr><th>${propertyId}</th><td>${value}</td></tr>`;
      }
    });
  
    if (html.length > 0) {
      html = `<table class="cesium-infoBox-defaultTable"><tbody>${html}</tbody></table>`;
    }
  
    return html;
  }
  function defined(value) {
    return value !== undefined && value !== null;
    }

    function getCesium3DTileFeatureName(feature) {
        let possibleIds = []; // Initialize as an empty array
      
        const propertyIds = feature.getPropertyIds();
        for (let i = 0; i < propertyIds.length; i++) {
          const propertyId = propertyIds[i];
          
          if (/^name$/i.test(propertyId)) {
            possibleIds[0] = feature.getProperty(propertyId);
          } else if (/name/i.test(propertyId)) {
            possibleIds[1] = feature.getProperty(propertyId);
          }
        }
        
        // Try to assemble the street address, if possible
        const houseNumber = feature.getProperty('addr:housenumber');
        const street = feature.getProperty('addr:street');
        if (houseNumber && street) {
          possibleIds[2] = `${houseNumber} ${street}`;
        }
      
        // Assemble latitude-longitude string
        const latitude = feature.getProperty('cesium#latitude');
        const longitude = feature.getProperty('cesium#longitude');
        if (latitude && longitude) {
          possibleIds[3] = `${latitude}, ${longitude}`;
        }
      
        // Return the first non-null, non-empty string from the possibleIds array
        for (const id of possibleIds) {
          if (defined(id) && id !== '') {
            return id;
          }
        }
        
        return "Unnamed Feature";
      }
      
      



      function formatFeatureForSidebar(feature) {
        console.log(feature);
        // Log all properties to the console
        const propertyIds = feature.getPropertyIds();
        for (let i = 0; i < propertyIds.length; i++) {
            const propertyId = propertyIds[i];
            console.log(`${propertyId}: ${feature.getProperty(propertyId)}`);
            }

                // Extract the relevant feature properties
                const name = feature.getProperty("name");
                const city = feature.getProperty("addr:city") || "";
                const houseNumber = feature.getProperty("addr:housenumber") || "";
                const state = feature.getProperty("addr:state") || "";
                const street = feature.getProperty("addr:street") || "";
                const postcode = feature.getProperty("addr:postcode") || "";
                const website = feature.getProperty("website");
                const wikipedia = feature.getProperty("wikipedia");
                const phone = feature.getProperty("phone");
                const lat = feature.getProperty("cesium#latitude") || "";
                const lon = feature.getProperty("cesium#longitude") || "";
              
                // Initialize variables for display
                let displayText = "";
                let address = "";
              
                // Formulate displayText and address based on available data
                let addressParts = [houseNumber, street, city, state, postcode].filter(Boolean);
                if (name) {
                  displayText = name;
                  address = addressParts.join(", ");
                } else if (addressParts.length > 0) {
                  displayText = addressParts.join(", ");
                  address = `${lat}, ${lon}`;
                } else if (lat && lon) {
                  displayText = `${lat}, ${lon}`;
                  address = "";
                }
              
                // Continue as before ...
                let description = "";
                if (website) {
                  description += `<a href="${website}" target="_blank">Website</a><br>`;
                }
                if (wikipedia) {
                  description += `<a href="https://en.wikipedia.org/wiki/${wikipedia.split(':').pop()}" target="_blank">Wikipedia</a><br>`;
                }
                if (phone) {
                  description += `Phone: ${phone}<br>`;
                }
              
                const eventDiv = document.createElement('div');
                eventDiv.className = 'list-element';
                const textDiv = document.createElement('div');
                textDiv.className = 'list-text';
              
                const nameP = document.createElement('p');
                nameP.className = 'list-name';
                nameP.textContent = displayText;
              
                const addressP = document.createElement('p');
                addressP.className = 'list-address';
                addressP.textContent = address;
              
                const descriptionP = document.createElement('p');
                descriptionP.className = 'list-description';
                descriptionP.innerHTML = description;
              
                textDiv.appendChild(nameP);
                textDiv.appendChild(addressP);
                textDiv.appendChild(descriptionP);
                eventDiv.appendChild(textDiv);
              
                // ... (Your image related code)
              
                return eventDiv;
              }
              
      

// function populateAndOpenSidebar(feature, sidebarPaneId) {
//     const sidebarPane = document.getElementById(sidebarPaneId);
//     const formattedContent = formatFeatureForSidebar(feature);
//     sidebarPane.appendChild(formattedContent);
// }




  function populateAndOpenSidebar(pickedFeature, sidebarPaneId) {

    $('#sidebar').removeClass('collapsed');
    // Use property names as the sidebar title
    document.getElementsByClassName("cesium-geocoder-input")[0].value = getCesium3DTileFeatureName(pickedFeature);

    // Remove the current active class from all sidebar panes
    let sidebarPanes = document.getElementsByClassName('sidebar-pane');
    for (let i = 0; i < sidebarPanes.length; i++) {
        sidebarPanes[i].className = 'sidebar-pane';
    }

    // Activate the target sidebar pane
    const targetSidebarPane = document.getElementById('event');
    targetSidebarPane.className = 'sidebar-pane active';

    // Clear the target sidebar pane
    // targetSidebarPane.innerHTML = '<h1 class="sidebar-header">Feature Information</h1>';
    targetSidebarPane.innerHTML = '<h1 class="sidebar-header"></h1>';


    
    // add image to event div
    var eventImage = document.createElement('img');
    // eventImage.src = 'https://perfume-proceed-photo-fifth.trycloudflare.com/30.37934_-97.66141.png';
    eventImage.src = 'https://imagery.austindigitaltwin.com/image/' + pickedFeature.getProperty('cesium#latitude') + '/' + pickedFeature.getProperty('cesium#longitude') 
    eventImage.onerror = function() {
        eventImage.src = 'https://via.placeholder.com/512';
    }
    eventImage.style = 'width:100%;object-fit: cover;height:320px;';
    eventImage.id = 'eventimage';
    document.getElementById('event').appendChild(eventImage);



    // Populate the sidebar with feature information
    // const featureDescription = getCesium3DTileFeatureDescription(pickedFeature);
    // const featureInfoDiv = document.createElement('div');
    // featureInfoDiv.innerHTML = featureDescription;
    // targetSidebarPane.appendChild(featureInfoDiv);

    const formattedContent = formatFeatureForSidebar(pickedFeature);
    targetSidebarPane.appendChild(formattedContent);

    // Create back button div wrapper
    const backButtonDiv = document.createElement("div");
    backButtonDiv.className = "back-button-div tooltip";
    backButtonDiv.style = "top: 3px;opacity: 1;left: 10px;border: none;";

    // Create back button SVG element
    const backButtonSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    backButtonSVG.setAttribute("width", "32");
    backButtonSVG.setAttribute("height", "32");
    backButtonSVG.setAttribute("viewBox", "0 0 32 32");

    const backPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    backPath.setAttribute("d", "M20 8 L8 16 L20 24");
    backPath.setAttribute("stroke", "#666");
    backPath.setAttribute("stroke-width", "3");
    backPath.setAttribute("fill", "#666");

    backButtonSVG.appendChild(backPath);
    backButtonDiv.appendChild(backButtonSVG);

    // Create back button tooltip
    const backButtonTooltip = document.createElement("span");
    backButtonTooltip.className = "tooltiptext tooltip-bottom";
    backButtonTooltip.textContent = "Back";
    backButtonDiv.appendChild(backButtonTooltip);

    // Add back button to DOM
    const geocoderInput = document.querySelector('.cesium-geocoder-input');

    // Only add the back button if it doesn't already exist
    //         geocoderInput.parentNode.insertBefore(backButtonDiv, geocoderInput);

    if(!document.querySelector('.back-button-div')) {
        geocoderInput.parentNode.insertBefore(backButtonDiv, geocoderInput);
    }

    // Adjust geocoder input
    geocoderInput.style = "margin-left: 15px;width: 235px !important;";

    // Add back button click event
    backButtonDiv.addEventListener('click', function() {
        // Restore original geocoder input style
        geocoderInput.style = "";

        // Remove the back button
        backButtonDiv.remove();

        document.getElementsByClassName("cesium-geocoder-input")[0].value = "";

        // Restore the original active sidebar pane
        for (let i = 0; i < sidebarPanes.length; i++) {
            sidebarPanes[i].className = 'sidebar-pane';
        }
        document.getElementById(sidebarPaneId).className = 'sidebar-pane active';
    });
}


  

  // Get default left click handler for when a feature is not picked on left click
const clickHandler = viewer.screenSpaceEventHandler.getInputAction(
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );

  let previouslySelectedBillboard; // to keep track of previously added billboard


// Your existing click event handler, modified to use the helper functions
viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
    // Reset the color of the previously selected feature
    if (previouslySelectedFeature) {
        //previouslySelectedFeature.color = defaultColor;
    }

    // Temporarily hide the Google Earth 3D tileset
    if (googleTileset) {
        googleTileset.show = false;
    }
    if (cesiumTileset) {
        cesiumTileset.show = true;
    }

    // Attempt to pick from the Cesium tileset
    let pickedFeature = viewer.scene.pick(movement.position);

    // Restore visibility to the Google Earth 3D tileset
    if (cesiumTileset) {
        // cesiumTileset.show = false;
    }
    if (googleTileset) {
        googleTileset.show = true;
    }

    if (!Cesium.defined(pickedFeature) && googleTileset) {
        // Just do default behavior if nothing was picked
        clickHandler(movement);
        return;
        // pickedFeature = viewer.scene.pick(movement.position);
    }
    

    if (Cesium.defined(pickedFeature)) {
        console.log("Feature picked!");
        console.log(pickedFeature);
        // Detect if fire, building, air sensor, crime.?

        // Use the Cesium open-source helper functions to get the name and description
        // const featureName = getCesium3DTileFeatureName(pickedFeature);
        // const featureDescription = getCesium3DTileFeatureDescription(pickedFeature);

        // Update the selected entity
        // viewer.selectedEntity = new Cesium.Entity({
        //     name: featureName,
        //     description: featureDescription
        // });

        let sidebarPaneId = document.getElementsByClassName('sidebar-pane active')[0].id;
        populateAndOpenSidebar(pickedFeature, sidebarPaneId);

        // Highlight the selected feature
        // pickedFeature.color = highlightColor;

        // Update the reference to the previously selected feature
        previouslySelectedFeature = pickedFeature;

        // Put a marker down in the middle of the selected feature
        // Extract the latitude and longitude properties from the picked feature
        const lat = parseFloat(pickedFeature.getProperty('cesium#latitude'));
        const lon = parseFloat(pickedFeature.getProperty('cesium#longitude'));

        // Convert the latitude and longitude to Cartesian3 position
        const position = Cesium.Cartesian3.fromDegrees(lon, lat);

        // If there was a previously added billboard, remove it
        if (previouslySelectedBillboard) {
            viewer.entities.remove(previouslySelectedBillboard);
        }

        // Add a new billboard at the picked feature's position
        previouslySelectedBillboard = viewer.entities.add({
            position: position,
            billboard: {
                image: './circle.png', // Path to your marker image,
                scale: 0.05, // This will need to be adjusted
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            }
        });


        let foundHouse = null;

        try {
          // Try to extract address
          address = `${pickedFeature.getProperty("addr:housenumber")} ${pickedFeature.getProperty("addr:street")}`;
          console.log("Extracted address: " + address);
          // Search by address
          foundHouse = housingData.find(house => house.streetAddress === address);
        } catch (err) {
          // Address not available, proceed to search by latitude and longitude
        }
      
        if (!foundHouse) {
          // Search by latitude and longitude
          foundHouse = housingData.find(house => 
            Math.abs(house.latitude - lat) < 0.0005 &&
            Math.abs(house.longitude - lon) < 0.0005
          );
        }
      
        if (foundHouse) {
            console.log("Found house!");

            // Reference to the existing image element
            const eventImage = document.getElementById('eventimage');
            
            // Store the current image source before attempting to switch
            const originalImageSrc = eventImage.src;

            // Try to switch out the image to the Zillow one
            const newImageSrc = `https://imagery.austindigitaltwin.com/homeImage/${foundHouse.homeImage}`;
            eventImage.src = newImageSrc;
            eventImage.onerror = function() {
                // Revert to the original image if the new one fails to load
                eventImage.src = originalImageSrc;
            };

            // Create HTML elements to display additional house info
            const additionalInfoDiv = document.createElement('div');
            additionalInfoDiv.className = 'list-element';  // Added class
          
            const textDiv = document.createElement('div');
            textDiv.className = 'list-text';  // Added class
          
            const additionalInfoHeader = document.createElement('h2');
            additionalInfoHeader.className = 'list-name';  // Added class
            additionalInfoHeader.textContent = "Additional Information";
          
            const formattedPrice = parseFloat(foundHouse.latestPrice).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
              
            const priceP = document.createElement('p');
            priceP.className = 'list-description';  // Added class
            priceP.textContent = `Price: ${formattedPrice}`;                     
          
            const bedroomsP = document.createElement('p');
            bedroomsP.className = 'list-description';  // Added class
            bedroomsP.textContent = `Bedrooms: ${foundHouse.numOfBedrooms}`;
          
            const bathroomsP = document.createElement('p');
            bathroomsP.className = 'list-description';  // Added class
            bathroomsP.textContent = `Bathrooms: ${foundHouse.numOfBathrooms}`;
          
            // Assemble the elements
            textDiv.appendChild(additionalInfoHeader);
            textDiv.appendChild(priceP);


            // Add lot size information
            const lotSizeP = document.createElement('p');
            lotSizeP.className = 'list-description';  // Added class
            lotSizeP.style = 'float: right;';  // Float it to the right
            const lotSizeSqFt = foundHouse.lotSizeSqFt.toLocaleString('en-US');  // Format the lot size
            lotSizeP.innerHTML = `${lotSizeSqFt} ft<sup>2</sup>`;  // Using HTML sup tag for square symbol
            textDiv.appendChild(lotSizeP);  // Append the lot size element

            lotSizeP.style.margin = '0px';
            priceP.style.margin = '0px';

            textDiv.appendChild(bedroomsP);
            textDiv.appendChild(bathroomsP);
            additionalInfoDiv.appendChild(textDiv);

            // Add homeType information
            const homeTypeP = document.createElement('p');
            homeTypeP.className = 'list-description';  // Added class
            homeTypeP.textContent = foundHouse.homeType;
            homeTypeP.style = 'float: right; font-size: small;';
            additionalInfoHeader.appendChild(homeTypeP);

            // Append additional information to sidebar
            const targetSidebarPane = document.getElementById('event');
            targetSidebarPane.appendChild(additionalInfoDiv);
          }


          {

// ... Existing code above the additional information ...

// ... Existing code for additional information ...

// Function to create stats section
// Generate random numbers for crimes and fires (0 to 2)
let randomCrimeCount = Math.floor(Math.random() * 3);
let randomFireCount = Math.floor(Math.random() * 3);

// Create parent div for stats
let statsDiv = document.createElement('div');
statsDiv.className = 'event-stats';

// Create individual stat boxes
let crimeBox = document.createElement('div');
crimeBox.className = 'stat-box';

let fireBox = document.createElement('div');
fireBox.className = 'stat-box';

// Create progress ring divs
let crimeRing = document.createElement('div');
crimeRing.className = 'progress-ring';

let fireRing = document.createElement('div');
fireRing.className = 'progress-ring';

// Assign risk level classes based on random numbers (for demonstration)
crimeRing.classList.add(randomCrimeCount === 0 ? 'low-risk' : randomCrimeCount === 1 ? 'medium-risk' : 'high-risk');
fireRing.classList.add(randomFireCount === 0 ? 'low-risk' : randomFireCount === 1 ? 'medium-risk' : 'high-risk');

// Create icons and numbers
let crimeIcon = document.createElement('img');
crimeIcon.src = 'crime.png';  // Path to your crime icon

let fireIcon = document.createElement('img');
fireIcon.src = 'firelogo.png';  // Path to your fire icon

let crimeNumber = document.createElement('p');
// crimeNumber.innerText = randomCrimeCount;

let fireNumber = document.createElement('p');
// fireNumber.innerText = randomFireCount;

// Assemble everything
crimeBox.appendChild(crimeRing);
crimeBox.appendChild(crimeIcon);
crimeBox.appendChild(crimeNumber);

fireBox.appendChild(fireRing);
fireBox.appendChild(fireIcon);
fireBox.appendChild(fireNumber);

statsDiv.appendChild(crimeBox);
statsDiv.appendChild(fireBox);

// Append stats to target sidebar
const targetSidebarPane = document.getElementById('event');

// Put stats-div inside a list-element div
let statsWrapper = document.createElement('div');
statsWrapper.className = 'list-element';
statsWrapper.appendChild(statsDiv);

statsWrapper.style.display = 'block';
statsWrapper.style.padding = '40px';


targetSidebarPane.appendChild(statsWrapper);

  


          }
          



    } else {
        console.log("No feature picked.");
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    function addMore() {
        console.log("hey")
        var moreButton = document.getElementById("moreButton");
        
        if(moreButton.textContent == "More...") {
        document.getElementById("more").style.display = "block";
        document.getElementById("moreButton").textContent = "Less...";
        } else {
        document.getElementById("more").style.display = "none";
        document.getElementById("moreButton").textContent = "More...";
        }
    }

async function plotPoint(tileset, lat, lng, fireData) {
    console.log(tileset, lat, lng, fireData)
    const position = Cesium.Cartesian3.fromDegrees(lng, lat, 10000); // Assume initial altitude of 10,000m

    const ray = new Cesium.Ray(position, Cesium.Cartesian3.negate(Cesium.Cartesian3.fromDegrees(lng, lat), new Cesium.Cartesian3()));
    
    const intersection = viewer.scene.pickFromRay(ray, [tileset]);

    if (Cesium.defined(intersection)) {
        const clampPosition = intersection.position;
        clampPosition.z -= 30;
        clampPosition.y += 30;
        clampPosition.x += 20;

        let billboardEntity = viewer.entities.add({
            position: clampPosition,
            billboard: {
                image: 'https://raw.githubusercontent.com/urbaninfolab/FireIncidentFrontend/main/assets/images/fire.png',
                scale: 0.1,
                pixelSize: 10,
                outlineWidth: 3,

                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },

        });



        let billboardId = billboardEntity.id;

const action = {
    remove: (popup) => {
        console.log(popup, "The popup was removed");
        // Translate to english: "The popup was removed"
    },
    onChange: (popup) => {
        console.log(popup, "The popup was moved");
        // Translate to english: "The popup was moved"
    },
    editAttr: (popup) => {
        console.log(popup, "The popup needs to edit attributes！");
        // Translate to english: "The popup needs to edit attributes"
        popup.setContent("My content has been changed！")
        // Translate to english: "My content has been changed!"
    }
}

console.log(fireData);
let link = fireData.link;
let longNLatString = link.replace('http://maps.google.com/maps?q=', '');
url = 'https://api.weather.gov/points/' + longNLatString;


var response = await fetch(url);
var api = await response.json();
var hourlyApiUrl = api.properties.forecastHourly;
var response = await fetch(hourlyApiUrl);
var hourlyData = await response.json();
hourlyData1 = hourlyData.properties.periods[0];

let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(function(click) {
    let pickedObject = viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id) && pickedObject.id.id === billboardId) {
        const cartesian33 = clampPosition;
        const html3 = `
        <button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup">×</button>
        <div>
            <span>
        <div style="
            font-size: xx-large;
            font-family: sans-serif;
            text-align: center;
            border-color: green;
            border-radius: 20px;
            color: black;
        ">
        <div class="location-info"> <span>${fireData.title}</span><BR>
        </div>
        </div>
            Location: ${fireData.description.split('|')[0]}<br>
            Publish Date: ${fireData.pubDate}<br>
            <a id="moreButton" href="#" onclick="addMore()">More...</a>
            <div id="more" style="display:none">
                Temperature: ${hourlyData1.temperature}℉<br>
                Forecast: ${hourlyData1.shortForecast}<br>
                Wind Speed: ${hourlyData1.windSpeed}<br>
                Wind Direction: ${hourlyData1.windDirection}<br>
            </div>
        </div>
        `;
        var newpopup = new CesiumPopup(viewer, {
            position: cartesian33, 
            html: html3, 
            className: "earth-popup-common1", 
            popPosition: "bottom"
        }, action)
        // Attach a close event to the button in the popup
        document.querySelector('.mapboxgl-popup-close-button').addEventListener('click', () => {
            newpopup.remove();
        });
        // Clicking anywhere off the popup when it is open will close it
        viewer.screenSpaceEventHandler.setInputAction(() => {
            newpopup.remove();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    } 
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);



    } else {
        console.log('No intersection found');
        // Do it again in 1 second
        try{
            setTimeout(() => plotPoint(tileset, lat, lng, fireData), 1000);
        }catch(err){
            console.log(err);
        }
    }
}




function fetchAllData() {

fetch('https://raw.githubusercontent.com/urbaninfolab/FireIncidentData/master/api/v1/Austin/2022/08/08/FireMap.json')
    .then(response => response.json())
    .then(data => {

        let items = data.rss.channel.item;
        console.log(items);

        for (let item of items) {
            let link = item.link;
            console.log(link);
            let latLng = link.replace("http://maps.google.com/maps?q=", "");
            let [lat, lng] = latLng.split(",");
            console.log(lat, lng);

            try{
            plotPoint(window.tileset, parseFloat(lat), parseFloat(lng), item);
            }catch(err){
                console.log(err);
            }

            let modelUrl = `${latLng}.glb`;
            let position = Cesium.Cartesian3.fromDegrees(parseFloat(lng), parseFloat(lat));
            let offset = new Cesium.Cartesian3(-250, -80, -200); 
            let finalPosition = Cesium.Cartesian3.add(position, offset, new Cesium.Cartesian3());
            let hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(90), Cesium.Math.toRadians(0), Cesium.Math.toRadians(0));
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(finalPosition, hpr);

            viewer.entities.add({
                position : finalPosition,
                orientation : orientation,
                model : {
                    uri : modelUrl,
                    minimumPixelSize : 12,
                    maximumScale : 20,
                    scale : 0.005,
                    color: new Cesium.Color(0, 0, 0, 0.9),
                    colorBlendMode : Cesium.ColorBlendMode.MIX,
                    colorBlendAmount : 0.5,
                    opacity : 0.4,
                }            
            })

        }
    })
    .catch(error => {
        console.error('Error:', error);
    });

    mapPurpleAirData(window.tileset);

}


    function graphPurpleAirPoint(sensorKey, lat, lng, color, description,tileset) {
        console.log(sensorKey, lat, lng, color, description);
        console.log(tileset)

            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lng, lat,150),
                billboard: {
                    image: './circle.png',  // You should create and use a circular image
                    color: Cesium.Color.fromCssColorString(color),
                    scale: 0.05, // This will need to be adjusted
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                id: sensorKey
            });

    }


    var runGetPurpleAirOnce = false;
    var runGetMicrosoftAirOnce = false;
    var airData = [];

    async function mapPurpleAirData(tileset) {

        if (runGetPurpleAirOnce) {
            return;
        }
        runGetPurpleAirOnce = true;

        if(airData.length == 0) {
            let cities = {
                "":[30.747879,29.978325,-98.056977,-97.357011],
            };

            rawwData = [];

            for(city in cities) {
                let latlng = cities[city];
                let jsonUrl = 'https://api.purpleair.com/v1/sensors?api_key=81D9ACDC-966F-11EC-B9BF-42010A800003&nwlat=' + 
                latlng[0] + '&selat=' + latlng[1] + '&nwlng=' + latlng[2] + '&selng=' + latlng[3] + '&fields=latitude,longitude,altitude,pm2.5_10minute';
                let response = await fetch(jsonUrl);
                let currentData = await response.json();

                rawwData = rawwData.concat(currentData.data);
            }
            airData = rawwData;

            console.log(airData);

            window.purpleairdata = airData;

        }

        for (let i = 0; i < airData.length; i++) {
            let data = airData[i];
            let sensorKey = data[0];
            let longNLatArray = [data[1], data[2]]; //fetched like [index,long,lat,alt,pm25]...
            var pm10Mins = data[4];
            let colorNDes = getPMDescription(pm10Mins)
            var color = colorNDes[0];
            var description = colorNDes[1];
            
            let lat = longNLatArray[0];
            let lng = longNLatArray[1];

            graphPurpleAirPoint(sensorKey, lat, lng, color, description,tileset);

        }

let newpopup = null;

let closePopupHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
closePopupHandler.setInputAction(() => {
    if (newpopup) {
        newpopup.remove();
        newpopup = null;
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// viewer.screenSpaceEventHandler.setInputAction(function (event) {
//     var pickedObjects = viewer.scene.drillPick(event.position);
//     for (let i = 0; i < pickedObjects.length; i++) {
//         if (pickedObjects[i].primitive instanceof Cesium.Billboard) {
//             let sensorKey = pickedObjects[i].primitive.id._id;
//             console.log(sensorKey);
//             let airApiUrl = 'https://api.purpleair.com/v1/sensors/' + sensorKey + '?api_key=81D9ACDC-966F-11EC-B9BF-42010A800003';
//             fetch(airApiUrl).then((response) => {
//                 return response.json();
//             }).then((data) => {
//                 console.log(data);
//                 var description = "";  
//                 try {
//                 var popupHtml = buildAirDataPopup(pickedObjects[i].primitive, data.sensor, description);
//                 } catch {
//                     console.log("error")
//                     return
//                 }
//                 const action = {
//                     remove: (popup) => {
//                         console.log(popup, "The popup was removed");
//                     },
//                     onChange: (popup) => {
//                         console.log(popup, "The popup was moved");
//                     },
//                     editAttr: (popup) => {
//                         console.log(popup, "The popup needs to edit attributes！");
//                         popup.setContent("My content has been changed！")
//                     }
//                 }
                
//                 if (newpopup) {
//                     newpopup.remove();
//                 }

//                 newpopup = new CesiumPopup(viewer, {
//                     position: pickedObjects[i].primitive.position, 
//                     html: popupHtml, 
//                     className: "earth-popup-common1", 
//                     popPosition: "bottom"
//                 }, action);

//                 document.querySelector('.mapboxgl-popup-close-button').addEventListener('click', () => {
//                     if (newpopup) {
//                         newpopup.remove();
//                         newpopup = null;
//                     }
//                 });
                
//             });
//         }
//     }
// }, Cesium.ScreenSpaceEventType.LEFT_CLICK);





        function buildAirDataPopup(marker, popupData, description) {

        var sensorKey = popupData.sensor_index; //sensor index

        description = getPMDescription(popupData.stats["pm2.5_10minute"])[1];

        let unixTimestamp = popupData.last_modified;
        var a = new Date(unixTimestamp * 1000);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var time = month + ' ' + date + ', ' + year;

        var airMarkerPopup = `
        <button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup">×</button>
        <span>
        <div style="
            font-size: xxx-large;
            font-family: sans-serif;
            text-align: center;
            border-color: green;
            border-radius: 20px;
            color: black;
        ">${popupData.stats["pm2.5_10minute"]}
        </div>
        <b>
        ${description} 
        `;


        var pmLength = popupData.stats["pm2.5_10minute"].toString().length;

        airMarkerPopup += `
        <span style="
            font-size: small;
            color: grey;
            position: absolute;
            top: 50px;
            right: 10px;
        "> μg/m <sup>3</sup>
        </span>`

        airMarkerPopup += `</div>`;

        airMarkerPopup += buildAirTable(popupData.stats);

        airMarkerPopup += `<a id="moreButton" href="#" onclick="addMore()">More...</a>`

        airMarkerPopup += `<div id="more" style="display:none">
        <div class="air-info">
        <span><b>Time:</b> ${time} </span><BR>
        <span><b>Latitude:</b> ${popupData.latitude} </span><BR>
        <span><b>Longitude:</b> ${popupData.longitude} </span><BR>
        <span><b>Altitude:</b> ${popupData.altitude} </span><BR>
        </div>
        `;

        console.log(airMarkerPopup);

        return airMarkerPopup;

    }

    // build air table for next 5 hours
    function buildAirTable(pmData) {
        var data = `
                <tr>
                    <td>${pmData["pm2.5"]}</td>
                    <td>${pmData["pm2.5_10minute"]}</td>
                    <td>${pmData["pm2.5_30minute"]}</td>
                    <td>${pmData["pm2.5_60minute"]}</td>
                    <td>${pmData["pm2.5_6hour"]}</td>
                    <td>${pmData["pm2.5_24hour"]}</td>
                    <td>${pmData["pm2.5_1week"]}</td>
                </tr>
                `;


        var table = `
        <table style="
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 0.9em;
        font-family: sans-serif;
        min-width: 210px;
        min-height: 30px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
    ">
        <thead style="
        text-align: center;
        padding: 10px 40px;
        font-size: smaller;
        background-color: #009375;
        color: #ffffff;
        text-align: center;
    ">
            <tr>
                <th>Now</th>
                <th>10 Min</th>
                <th>30 Min</th>
                <th>1 hr</th>
                <th>6 hr</th>
                <th>1 Day</th>
                <th>1 Week</th>
            </tr>
        <thead>
        <tbody>
            ${data}
        </tbody>
        <table/>
        `;
        return table;
    }


        function getPMDescription(pm10Mins, AQI = false) {
            let description = "";
            let color = "";
            if ((AQI && pm10Mins <= 50) || pm10Mins <= 12) {
                color = '#00e400';
                description = '<span>0-12: Air quality is satisfactory, and air pollution poses little or no risk with 24 hours of exposure.</span><BR>';
            } else if ((AQI && pm10Mins <= 100) || pm10Mins <= 35) {
                color = '#fdff01';
                description = '<span>12.1-35.4: Air quality is acceptable. However, there may be a risk for some people with 24 hours of exposure, particularly those who are unusually sensitive to air pollution.</span><BR>';
            } else if ((AQI && pm10Mins <= 150) || pm10Mins <= 55) {
                color = '#ff7e01';
                description = '<span>35.5-55.4: Members of sensitive groups may experience health effects. The general public is less likely to be affected.</span><BR>';
            } else if ((AQI && pm10Mins <= 200) || pm10Mins <= 150) {
                color = '#ff0100';
                description = '<span>55.5-150.4: Some members of the general public may experience health effects: members of sensitive groups may experience more serious health effects.</span><BR>';
            } else if ((AQI && pm10Mins <= 300) || pm10Mins <= 250) {
                color = '#8f3f97';
                description = '<span>150.5-250.4: Health Alert: The risk of health effects is increased for everyone.</span><BR>';

            } else if ((AQI && pm10Mins <= 301) || pm10Mins <= 350) {
                color = '#7e0023';
                description = '<span>250.5-350.4: Health Warning: Health warning of emergency conditions: everyone is more likely to be affected.</span><BR>';

            } else {
                color = '#7e0023';
                description = '<span>>=350.5: Health Warning: Health warning of emergency conditions: everyone is more likely to be affected.</span><BR>';

            }
            return [color, description];
        }

    }



    async function zoomToo() {
    var originalPosition = Cesium.Cartesian3.fromDegrees(-97.739720, 30.285337);

    var offset = new Cesium.Cartesian3(-250, -80, -200); // Adjust this offset to get the right position.
    var position = Cesium.Cartesian3.add(originalPosition, offset, new Cesium.Cartesian3());
    
    var hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(90), Cesium.Math.toRadians(0), Cesium.Math.toRadians(0));
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
    
    var entity = viewer.entities.add({
        position : position,
        orientation : orientation,
        model : {
            uri : '30.285337,-97.7397203.glb',
            minimumPixelSize : 12,
            maximumScale : 20,
            scale : 0.005,
            color: new Cesium.Color(0, 0, 0, 0.9), // Black color with 0.5 alpha
            colorBlendMode : Cesium.ColorBlendMode.MIX,
            colorBlendAmount : 0.5,
            opacity : 0.4,
        }
    });
    viewer.flyTo(entity, {
        offset : new Cesium.HeadingPitchRange(0.0, -0.5, 2000.0)
    });
    }

    // Call zoomToo() function after 10 seconds
    setTimeout(zoomToo, 1000);

    var scene = viewer.scene;

    setTimeout(function() {
        viewer.camera.setView({
            destination : Cesium.Cartesian3.fromDegrees(-97.739720, 30.285337, 1000)
        });
    }, 500);  // waits 5 seconds
    
    


    var canvas = viewer.canvas;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);
    var annotations = scene.primitives.add(new Cesium.LabelCollection());
    // document.getElementsByClassName("cesium-viewer-toolbar")[0].style.display = "none";
    document.getElementsByClassName("cesium-viewer-animationContainer")[0].style.display = "none";
    document.getElementsByClassName("cesium-viewer-timelineContainer")[0].style.display = "none";
    document.getElementsByClassName("cesium-viewer-fullscreenContainer")[0].style.display = "none";
    // document.getElementsByClassName("cesium-viewer-geocoderContainer")[0].style.display = "none";
    // document.getElementsByClassName("cesium-viewer-infoBoxContainer")[0].style.display = "none";
    // document.getElementsByClassName("cesium-viewer-selectionIndicatorContainer")[0].style.display = "none";
    // get all cesium-toolbar-button elements (class) and hide them
    var elements = document.getElementsByClassName("cesium-toolbar-button");
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
    }
    document.getElementsByClassName("cesium-viewer-bottom")[0].style.display = "none";

    //document.getElementsByClassName("cesium-viewer-geocoderContainer")[0].style.display = "none";



    document.addEventListener("DOMContentLoaded", function() {

            const geocoderContainer = document.getElementsByClassName("cesium-viewer-geocoderContainer")[0];
            const searchResults = geocoderContainer.getElementsByClassName("search-results")[0];
            const searchInput = geocoderContainer.getElementsByClassName("cesium-geocoder-input")[0];
            
            // Dummy crime and fire data
            var crimeData = [
                { offense_location: ["Structure Fire - 3 E Loop Rd, New York"], report_date_time: "2022-01-01T12:00:00Z", offenses: ["Robbery"] },
                // ... more data
            ];
            
            var fireData = [
                { description: "California|...", pubDate: "2022-01-01T12:00:00Z", title: "Forest Fire" },
                // ... more data
            ];
            
            // Normalize the location data
            crimeData.forEach(event => {
                event.normalizedLocation = event.offense_location[0].toLowerCase();
                event.location = event.offense_location[0];
            });
            
            fireData.forEach(event => {
                event.normalizedLocation = event.description.split('|')[0].toLowerCase();
                event.location = event.description.split('|')[0];
            });
            
            // Function to extend the search
            function extendedSearch(searchText) {
                const normalizedSearchText = searchText.toLowerCase();
                const matchingCrimes = crimeData.filter(event => event.normalizedLocation.includes(normalizedSearchText));
                const matchingFires = fireData.filter(event => event.normalizedLocation.includes(normalizedSearchText));
                
                return [...matchingCrimes, ...matchingFires];
            }
            
            // Function to display extended search results
            function displayExtendedResults(matchingEvents) {
                const ul = searchResults.getElementsByTagName('ul')[0];
                
                matchingEvents.forEach(event => {
                    const li = document.createElement('li');
                    li.textContent = event.location; // Customize this part to display what you need
                    ul.appendChild(li);
                });
            }
            
            // Initialize a MutationObserver to watch for changes in the style attribute
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const displayStyle = searchResults.style.display;
                        
                        // If the search-results container is not 'display: none'
                        if (displayStyle !== "none") {
                            geocoderContainer.style.borderRadius = "16px 16px 0 0";
                            
                            // Perform the extended search
                            const matchingEvents = extendedSearch(searchInput.value);
                            
                            // Display the extended search results
                            displayExtendedResults(matchingEvents);
                        } else {
                            // Delete all existing search results
                            const ul = searchResults.getElementsByTagName('ul')[0];
                            ul.innerHTML = '';
                            geocoderContainer.style.borderRadius = ""; // Reset to the original style or set it to your default value
                        }
                    }
                });
            });
            
        

        // const geocoderContainer = document.getElementsByClassName("cesium-viewer-geocoderContainer")[0];
        // const searchResults = geocoderContainer.getElementsByClassName("search-results")[0];
        
        // // Initialize a MutationObserver to watch for changes in the style attribute
        // const observer = new MutationObserver(function(mutations) {
        //   mutations.forEach(function(mutation) {
        //     if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        //       const displayStyle = searchResults.style.display;
              
        //       // If the search-results container is not 'display: none'
        //       if (displayStyle !== "none") {
        //         geocoderContainer.style.borderRadius = "16px 16px 0 0";
        //       } else {
        //         geocoderContainer.style.borderRadius = ""; // Reset to the original style or set it to your default value
        //       }
        //     }
        //   });
        // });
        
        // Configure the observer to watch for changes in the style attribute
        observer.observe(searchResults, { attributes: true });


        // Get .cesium-geocoder-searchButton and add class tooltip
        const searchButton = geocoderContainer.getElementsByClassName("cesium-geocoder-searchButton")[0];
        searchButton.classList.add("tooltip");
        // Add span element with tooltip text
        const span = document.createElement("span");
        span.classList.add("tooltiptext");
        span.classList.add("tooltip-bottom");
        span.textContent = "Search";

        // Add the span element to the search button
        searchButton.appendChild(span);


        // Create a div for the X button
        const xButtonDiv = document.createElement("div");
        xButtonDiv.classList.add("close-button-div");

        // Create the SVG for the X icon
        const xButton = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        xButton.setAttribute("width", "32");
        xButton.setAttribute("height", "32");
        xButton.setAttribute("viewBox", "0 0 32 32");
        xButton.classList.add("close-button");  // A class to style the X button

        const xPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        xPath.setAttribute("d", "M8 8 L24 24 M24 8 L8 24");
        xPath.setAttribute("stroke", "#666");
        xPath.setAttribute("stroke-width", "3");
        xPath.setAttribute("fill", "#666");

        xButton.appendChild(xPath);
        xButtonDiv.appendChild(xButton);

        // Add the X button div after the searchButton, inside the form
        const form = geocoderContainer.getElementsByTagName("form")[0];
        form.appendChild(xButtonDiv);

        // Add tooltip to the X button div
        xButtonDiv.classList.add("tooltip");
        const span2 = document.createElement("span");
        span2.classList.add("tooltiptext");
        span2.classList.add("tooltip-bottom");
        span2.textContent = "Close";
        xButtonDiv.appendChild(span2);


        xButtonDiv.onclick = function() {
            // prevent the default
            event.preventDefault();
            document.getElementsByClassName("cesium-geocoder-input")[0].value = "";

            // If back button exists, remove it
            if(document.getElementsByClassName("back-button-div")[0]) {
                document.getElementsByClassName("back-button-div")[0].remove();

                // Get geocoder input
                const geocoderInput = document.querySelector('.cesium-geocoder-input');
                geocoderInput.style = "";


            }

            sidebar.close();
        }

        // Adjust the search button's positioning (if required)
        searchButton.style.marginRight = "5px";  // pushes the search button 5 pixels to the left


      });
      
