const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { listingSchema } = require("../schema.js");

module.exports.index = async (req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { error: null });
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({path: "reviews",
        populate: {
            path: "author",
        }
    })
    .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    
    console.log("Listing Geometry Full:", listing.geometry);
    console.log("Coordinates:", listing.geometry.coordinates);
    
    res.render("listings/show", {listing});
};

// listings.js controller
module.exports.createListing = async (req, res, next) => {
    try {
        // Debug logging
        console.log("Form Data Received:");
        console.log("Body:", req.body);
        console.log("File:", req.file);
        console.log("User:", req.user);

        // Validate listing data
        const { error } = listingSchema.validate(req.body);
        if (error) {
            console.log("Validation Error:", error.details);
            req.flash("error", error.details.map(err => err.message).join(", "));
            return res.redirect("/listings/new");
        }

        // Check file upload
        if (!req.file) {
            console.log("File upload missing");
            req.flash("error", "Please upload an image");
            return res.redirect("/listings/new");
        }

        // Geocoding
        try {
            console.log("Geocoding location:", req.body.listing.location);
            const geoResponse = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 1
            }).send();

            if (!geoResponse.body.features?.length) {
                req.flash("error", "Location not found. Please enter a valid location.");
                return res.redirect("/listings/new");
            }

            // Create new listing
            const newListing = new Listing({
                ...req.body.listing,
                owner: req.user._id,
                image: {
                    url: req.file.path,
                    filename: req.file.filename
                },
                geometry: geoResponse.body.features[0].geometry
            });

            console.log("Saving listing:", newListing);
            await newListing.save();

            req.flash("success", "Successfully created new listing!");
            return res.redirect("/listings");

        } catch (geoError) {
            console.error("Geocoding Error:", geoError);
            req.flash("error", "Error processing location. Please try again.");
            return res.redirect("/listings/new");
        }

    } catch (err) {
        console.error("Create Listing Error:", err);
        req.flash("error", "Error creating listing: " + err.message);
        return res.redirect("/listings/new");
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250,h_300,c_scale")
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    if(!req.body.listing){
        throw new ExpressError(404, "Send valid data for listing");
    }
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
