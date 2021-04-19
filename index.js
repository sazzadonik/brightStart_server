const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const objectId = require('mongodb').ObjectID;
const fileUpload = require("express-fileupload");
const fs = require('fs-extra')
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('images'));
app.use(fileUpload());

const PORT = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sazzadcluster.wucws.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const teachersCollection = client.db(`${process.env.DB_NAME}`).collection("teachers");
    const classCollection = client.db(`${process.env.DB_NAME}`).collection("classes");
    const adminCollection = client.db(`${process.env.DB_NAME}`).collection("admins");
    const reviewCollection = client.db(`${process.env.DB_NAME}`).collection("reviews");
    const bookedCollection = client.db(`${process.env.DB_NAME}`).collection("bookedClass");
    const contactUsCollection = client.db(`${process.env.DB_NAME}`).collection("contactUs");

    app.post("/addClass", (req, res) => {
        const { title, age, time, date, price } = req.body;
        const file = req.files.file;

        const newImg = file.data;
        const encImg = newImg.toString("base64");
        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, "base64")
        };

        classCollection.insertOne({ title, age, time, date, price, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            });
    })

    app.post("/addAdmin", (req, res) => {
        const admin = req.body.admin;
        adminCollection.insertOne({ admin })
            .then(result => res.send(result.insertedCount > 0))
    })

    app.post("/addTeacher", (req, res) => {
        const { name, email } = req.body;
        const file = req.files.file;

        const newImg = file.data;
        const encImg = newImg.toString("base64");
        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, "base64")
        };
        teachersCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            });
    });

    app.post("/addReview", (req, res) => {
        const { name, relation, description } = req.body;
        reviewCollection.insertOne({ name, relation, description })
            .then(result => res.send(result.insertedCount > 0))
    })

    app.get("/getClasses", (req, res) => {
        classCollection.find({})
            .toArray((err, documents) => res.send(documents))
    })

    app.get("/getTeachers", (req, res) => {
        teachersCollection.find({})
            .toArray((err, documents) => res.send(documents))
    })

    app.get("/getReviews", (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => res.send(documents))
    });

    app.post("/bookedClass", (req, res) => {
        const { title, age, time, date, price, imgSrc, email, payment, status } = req.body;
        bookedCollection.insertOne({ title, age, time, date, price, imgSrc, payment, email, status })
            .then(result => res.send(result.insertedCount > 0));
    })

    app.get("/bookedClassUser", (req, res) => {
        const user = req.query.user;
        bookedCollection.find({ email: { $regex: user } })
            .toArray((err, documents) => {
                res.send(documents)
            })
    });

    app.get("/allBookedClasses", (req, res) => {
        bookedCollection.find({}).toArray((err, documents) => res.send(documents));
    })

    app.post("/changeStatus", (req, res) => {
        const id = req.body.id;
        const status = req.body.status;
        bookedCollection.updateOne({ _id: objectId(id) }, {
            $set: {
                status: status
            }
        })
            .then(result => res.send(result.modifiedCount > 0));
    })

    app.delete("/delete", (req, res) => {
        const id = req.query.id;
        bookedCollection.deleteOne({ _id: objectId(id) }).then(result => {
            res.send(result.deletedCount > 0)
        })
    });

    app.post("/contactUs", (req, res) => {
        const { name, email, description } = req.body;
        contactUsCollection.insertOne({ name, email, description })
            .then(result => res.send(result.insertedCount > 0))
    });

    app.post("/isAdmin", (req, res) => {
        const email = req.body.email;
        adminCollection.find({ admin: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
            })
    });

});

app.get("/", (req, res) => res.send("connected"))
app.listen(PORT);