const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  // Transform the data to handle the image field completely
  const transformedData = initData.data.map((obj) => ({
    ...obj,
    image: {
      filename: obj.image.filename || "default-listing-image",
      url: obj.image.url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"
    },
    owner: '673f535af2b244012c30393a'
  }));

  await Listing.insertMany(transformedData);
  console.log("Data was initialized");
};

initDB();