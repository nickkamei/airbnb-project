const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Index function to show all listings
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
};

// Render the form for creating a new listing
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

// createListing function 
module.exports.createListing = async (req, res, next) => {
    try {
        const listing = new Listing(req.body.listing);
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        // Optional: Add geolocation if location is provided
        if (req.body.listing.location) {
            const geoData = await geocodingClient
                .forwardGeocode({
                    query: req.body.listing.location,
                    limit: 1,
                })
                .send();
            listing.geometry = geoData.body.features[0].geometry;
        }

        listing.owner = req.user._id; // Ensure logged-in user is set as the owner
        await listing.save();
        req.flash("success", "Successfully created a new listing!");
        res.redirect(`/listings/${listing._id}`);
    } catch (error) {
        console.error(error); // Logs the error to the console
        req.flash("error", "Unable to create the listing. Please try again.");
        res.redirect("/listings/new");
    }
};


// Show details of a specific listing
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "owner",
            select: "username email"
        })
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });
    
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listings/show", { listing });
};

// Render the edit form
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listings/edit", { listing });
};

// Update a listing
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }
    
    if (req.body.listing.location) {
        const geoData = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            })
            .send();
        listing.geometry = geoData.body.features[0].geometry;
        await listing.save();
    }
    
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${listing._id}`);
};

// Delete a listing
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
