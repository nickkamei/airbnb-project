const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Show all listings
module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index", { allListings });
    } catch (err) {
        console.error("Error fetching listings:", err);
        req.flash("error", "Unable to fetch listings");
        res.redirect("/");
    }
};

// Render form for new listing
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

// Create a new listing
module.exports.createListing = async (req, res) => {
    try {
        console.log("Request body:", req.body);

        const listing = new Listing(req.body.listing);

        // Handle file upload if applicable
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        // Optional: Geocode location
        if (req.body.listing.location) {
            const geoData = await geocodingClient
                .forwardGeocode({
                    query: req.body.listing.location,
                    limit: 1,
                })
                .send();
            listing.geometry = geoData.body.features[0]?.geometry || {};
        }

        // Set owner of the listing
        listing.owner = req.user._id;

        // Save the listing
        await listing.save();
        req.flash("success", "Successfully created a new listing!");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error("Error creating listing:", err);
        req.flash("error", "Failed to create the listing");
        res.redirect("/listings/new");
    }
};

// Show specific listing
module.exports.showListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id)
            .populate("owner", "username email")
            .populate({
                path: "reviews",
                populate: { path: "author" },
            });

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }
        res.render("listings/show", { listing });
    } catch (err) {
        console.error("Error fetching listing:", err);
        req.flash("error", "Unable to fetch listing");
        res.redirect("/listings");
    }
};

// Render edit form
module.exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        res.render("listings/edit", { listing });
    } catch (err) {
        console.error("Error rendering edit form:", err);
        req.flash("error", "Unable to edit listing");
        res.redirect("/listings");
    }
};

// Update a listing
module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename,
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
            listing.geometry = geoData.body.features[0]?.geometry || {};
            await listing.save();
        }

        req.flash("success", "Listing updated successfully!");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error("Error updating listing:", err);
        req.flash("error", "Failed to update listing");
        res.redirect("/listings");
    }
};

// Delete a listing
module.exports.destroyListing = async (req, res) => {
    try {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing deleted successfully!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error deleting listing:", err);
        req.flash("error", "Failed to delete listing");
        res.redirect("/listings");
    }
};
