const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        const db = client.db("rent_nest");

        const propertiesCollection = db.collection("properties");
        const propertyCollection = db.collection("property");
        const bookingCollection = db.collection("bookings");
        const paymentCollection = db.collection("payments");

        // =====================================
        // PROPERTIES COLLECTION
        // =====================================

        // Get all properties by owner email
        app.get("/api/properties/:email", async (req, res) => {
            const { email } = req.params;

            const result = await propertiesCollection
                .find({ ownerEmail: email })
                .toArray();

            res.send(result);
        });

        // Add property
        app.post("/api/properties", async (req, res) => {
            const {
                title,
                description,
                price,
                location,
                bedrooms,
                bathrooms,
                size,
                amenities,
                images,
                ownerEmail,
                ownerName,
            } = req.body;

            const addData = {
                title,
                description,
                price,
                location,
                bedrooms,
                bathrooms,
                size,
                amenities,
                images,
                ownerEmail,
                ownerName,
                status: "active",
                createdAt: new Date(),
            };

            const result = await propertiesCollection.insertOne(addData);

            res.send(result);
        });

        // Update property
        app.patch("/api/properties/:id", async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid Property ID",
                });
            }

            const {
                title,
                description,
                price,
                location,
                bedrooms,
                bathrooms,
                size,
                amenities,
                images,
                ownerEmail,
                ownerName,
            } = req.body;

            const updateData = {
                title,
                description,
                price,
                location,
                bedrooms,
                bathrooms,
                size,
                amenities,
                images,
                ownerEmail,
                ownerName,
                status: "active",
            };

            const result = await propertiesCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: updateData,
                }
            );

            res.send(result);
        });

        // Delete property
        app.delete("/api/properties/:id", async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid Property ID",
                });
            }

            const result = await propertiesCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });

        
        // PROPERTY COLLECTION (Pending Approval)
        

        // Get property by owner email
        app.get("/api/property/:email", async (req, res) => {
            const { email } = req.params;

            const result = await propertyCollection
                .find({
                    "ownerInfo.email": email,
                })
                .toArray();

            res.send(result);
        });

        // Add property
        app.post("/api/property", async (req, res) => {
            const result = await propertyCollection.insertOne(req.body);

            res.send(result);
        });

        // Update property
        app.patch("/api/property/:id", async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid Property ID",
                });
            }

            const result = await propertyCollection.updateOne(
                {
                    _id: new ObjectId(id),
                },
                {
                    $set: req.body,
                }
            );

            res.send(result);
        });

        // Delete property
        app.delete("/api/property/:id", async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid Property ID",
                });
            }

            const result = await propertyCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.log(error);
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Rent Nest Server Running");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});