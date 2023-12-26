const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
    title : String,
    content : String,
    description : String,
    image_url : String,
    link : String,
    category : [String],
});

const NewsModel = mongoose.model("News",NewsSchema);

module.exports = NewsModel;