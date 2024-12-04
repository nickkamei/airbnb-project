mapboxgl.accessToken = mapToken;

console.log("Map Token:", mapToken);
console.log("Listing Coordinates:", listing.geometry.coordinates);

// Check if coordinates are valid before creating map
if (listing.geometry && 
    listing.geometry.coordinates && 
    listing.geometry.coordinates.length === 2) {
    
    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: listing.geometry.coordinates,
        zoom: 9
    });

    const marker = new mapboxgl.Marker({ color: "red" })
        .setLngLat(listing.geometry.coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h4>${listing.location}</h4><p>Exact location provided after booking</p>`)
        )
        .addTo(map);
} else {
    console.error("Invalid or missing coordinates");
    // Optional: Display a message on the page that location cannot be shown
    document.getElementById("map").innerHTML = "Location details unavailable";
}