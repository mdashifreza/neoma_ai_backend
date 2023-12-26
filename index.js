require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyparser = require("body-parser");
const axios = require('axios');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

        newsData.forEach(async (news)=>{
            const newsItem = new NewsModel({
                title : news.title,
                content : news.content,
                description : news.description, 
                category : news.category,
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

//authentication :: signUp
const User = require('./models/User');
const secret_key = "2ub3h2vygcsc8s83njbjs";

router.post("/signup", async (req, res)=>{
    try{
        const {email, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
    }
    catch(error){
        // console.log("error while signup", error);
        res.status(500).json({error : "An error has caused during the signup"})
    }
})
//authentication :: SingIn
router.post("/signin", async(req, res)=>{
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({error : "Username and password are required."});
        }

        const user = await  User.findOne({email});
        // console.log('user with email found', user);

        if (!user) {
            // console.error("User not found for username:", email);
            return res.status(401).json({ error: "user not found" });
        }

        const passMatch = await bcrypt.compare(password, user.password);
        if(!passMatch){
            return res.status(401).json({error: "please login with correct password"})
        }
        
        const token = jwt.sign({ email }, secret_key, { expiresIn: "1h" });
        res.status(200).json({ token })
    }
    catch(error){
        // console.error("Error during login:", error);
        res.status(500).json({ error: "an error has occurred" })
    }
})

//
router.get("/", (req,res)=>{
    res.json({endpoint : "https://neoma-ai-backend.vercel.app/api/news"})
})
//server start
app.use("/api",router);
const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log("server listening at port:",port)
})