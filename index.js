require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyparser = require("body-parser");
const axios = require('axios');

const app = express();
//middleware
app.use(bodyparser.json());
app.use(cors());

//mongodb connection
const db_pass = process.env.DB_PASSWORD;
const uri = `mongodb+srv://ashifcse1723:${db_pass}@neoma.jk7gbwt.mongodb.net/?retryWrites=true&w=majority`;
const mongoose = require('mongoose');
    mongoose.connect(uri)
        .then(()=>{
            console.log("connection established with mongodb cluster.");
        })
        .catch((error)=>{
            console.log("error while connectiing with mongodb cluster.", error)
        })
//db_Model and News_Api_call data_save 
const NewsModel = require('./models/News');

const router = express.Router();
router.get("/fetch-news", async (req,res)=>{
    try{
        const apiKey = process.env.NEWS_API;
        const countryCodes = 'in,us';
        const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=${countryCodes}`;

        const response = await axios.get(url);
        const newsData = response.data.results;
        // console.log("api testing at backend", )
        newsData.forEach(async (news)=>{
            const newsItem = new NewsModel({
                title : news.title,
                content : news.content,
                description : news.description, 
                // keywords : [String],
                image_url : news.image_url,
                link : news.link,       
            });
            await newsItem.save();
        });
        res.json({ message: 'News fetched and stored successfully.' });
    }
    catch (error) {
        console.error('Error fetching and storing news:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
//Read Stored news data from mongodb_collection
router.get("/news", async (req,res)=>{
    try{
        const allnewsFromMongoDB_Coll = await NewsModel.find({});
        res.json(allnewsFromMongoDB_Coll);
    }
    catch(error){
        console.log("error in fetching rescord from mongodb: ", error.message)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})
//delete point
router.delete("/news/:id", async (req, res) => {
    const newsId = req.params.id;

    try {
        const deletedNews = await NewsModel.findByIdAndDelete(newsId);

        if (!deletedNews) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json({ message: 'News deleted successfully', deletedNews });
    } catch (error) {
        console.error('Error deleting news:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
//post route
router.post("/news", async (req, res) => {
    const { title, content, description, image_url, link } = req.body;

    try {
        const newNews = new NewsModel({
            title,
            content,
            description,
            image_url,
            link,
        });

        await newNews.save();

        res.json({ message: 'News added successfully', newNews });
    } catch (error) {
        console.error('Error adding news:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// update route
router.put("/news/:id", async (req, res) => {
    const newsId = req.params.id;
    const { title, content, description, image_url, link } = req.body;

    try {
        const updatedNews = await NewsModel.findByIdAndUpdate(
            newsId,
            {
                title,
                content,
                description,
                image_url,
                link,
            },
            { new: true }
        );

        if (!updatedNews) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json({ message: 'News updated successfully', updatedNews });
    } catch (error) {
        console.error('Error updating news:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//server start
app.use("/api",router);
const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log("server listening at port:",port)
})