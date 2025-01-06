const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.createListing = async (req, res, next) => {
    try {
        console.log("=== CREATE LISTING START ===");
        console.log("1. Request body:", req.body);
        console.log("2. File data:", req.file);
        console.log("3. User data:", req.user);

        if (!req.file) {
            console.log("ERROR: No file uploaded");
            req.flash("error", "Please upload an image");
            return res.redirect("/listings/new");
        }

        if (!req.body.listing) {
            console.log("ERROR: No listing data in request body");
            req.flash("error", "Missing listing data");
            return res.redirect("/listings/new");
        }

        // Geocoding
        try {
            console.log("4. Attempting geocoding for:", req.body.listing.location);
            const geoData = await geocodingClient
                .forwardGeocode({
                    query: req.body.listing.location,
                    limit: 1,
                })
                .send();
            console.log("5. Geocoding response:", geoData.body);

            // Create new listing with all data
            const newListing = new Listing({
                title: req.body.listing.title,
                description: req.body.listing.description,
                image: {
                    url: req.file.path,
                    filename: req.file.filename,
                },
                price: req.body.listing.price,
                location: req.body.listing.location,
                country: req.body.listing.country,
                owner: req.user._id,
                geometry: geoData.body.features[0].geometry
            });

            console.log("6. New listing object:", newListing);

            // Save to database
            await newListing.save();
            console.log("7. Listing saved successfully");

            // Flash and redirect
            req.flash("success", "New Listing Created!");
            res.redirect("/listings");

        } catch (geoError) {
            console.log("ERROR in geocoding:", geoError);
            req.flash("error", "Error processing location. Please try again.");
            return res.redirect("/listings/new");
        }

    } catch (err) {
        console.log("FINAL ERROR:", err);
        next(err);
    }
};
