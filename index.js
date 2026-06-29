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
        // onek gula
        const propertiesCollection = db.collection("properties");
        // akta
        const propertyCollection = db.collection("property");
        const bookingCollection = db.collection("bookings");
        const paymentCollection = db.collection("payments");
        const favoritesCollection = db.collection("favorites");
        const userCollection = db.collection("user");

        // PROPERTIES COLLECTION

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

        // tenant my booking 
        app.get("/api/property/booking/:email", async (req, res) => {
            const { email } = req.params;
            console.log(email);

            const result = await bookingCollection.find({ tenantEmail: email }).toArray();
            console.log(result);
            res.send(result)
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


        // data dashBoard a show er jonno
        app.get('/api/property', async (req, res) => {

            const search = req.query.search;
            const location = req.query.location;
            const propertyType = req.query.propertyType;
            const query = {}; // {title: "mern"}
            if (search) {
                query.title = {
                    $regex: search,
                    $options: "i"
                };
            }
            //cat =====> propertyType
            if (propertyType) {
                // query.propertyType = propertyType;  -------single
                //?category=Apartment , Villa
                // console.log(propertyType , propertyType.split(","));

                query.propertyType = { $in: propertyType.split(",") }  //----> multiple
            }

            if (location) {
                query.location = location;
            }

            const cursor = propertyCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // sorting
        app.get("/featured-property", async (req, res) => {
            try {
                const result = await propertyCollection.find({ status: "Approved" }).limit(6).toArray();
                // $in: ["approved", "Approved"] 
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: err.message });
            }
        });

        // [id]/single page er jonno
        app.get('/api/single-property/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await propertyCollection.findOne(query);
            res.send(result);
        });

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



        // payment , booking
        app.post("/api/property/booking", async (req, res) => {
            const { amount, propertyId, propertyTitle, duration, rentType,
                tenantEmail, paymentType, transactionId, paymentStatus } = req.body;

            // console.log(req.body);

            const bookingData = {
                propertyId,
                propertyTitle,
                tenantEmail,
                duration,
                amount,
                rentType,
                transactionId,
                paymentStatus,
                bookingDate: new Date(),
            };
            const isBookingExist = await bookingCollection.findOne({ transactionId });
            if (isBookingExist) {
                return res.status(200).send({ message: "Already paid" })
            }
            const bookingRes = await bookingCollection.insertOne(bookingData);

            const paymentData = {
                userEmail: tenantEmail,
                amount,
                transactionId,
                paymentType: paymentType || "property_rent",
                paymentStatus
            }

            await paymentCollection.insertOne(paymentData);
            res.send(bookingRes);
        });

        // Add property
        app.post("/api/property", async (req, res) => {
            const data = req.body;
            const result = await propertyCollection.insertOne({
                ...data,
                status: "pending",
            });

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

        // delete fvt
        app.delete("/api/favorites/:id", async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid Favorite ID",
                });
            }

            const result = await favoritesCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });

        //favorites

        // fvt post
        app.post("/api/favorites", async (req, res) => {
            const {
                propertyId,
                tenantEmail,
                tenantName,
                propertyTitle,
                location,
                price,
                image,
                ownerEmail,
            } = req.body;

            const exists = await favoritesCollection.findOne({
                propertyId,
                tenantEmail,
            });

            if (exists) {
                return res.status(400).send({
                    success: false,
                    message: "Property already added to favorites",
                });
            }

            const favoriteData = {
                propertyId,
                tenantEmail,
                tenantName,
                propertyTitle,
                location,
                price,
                image,
                ownerEmail,
                createdAt: new Date(),
            };

            const result = await favoritesCollection.insertOne(favoriteData);

            res.send(result);
        });

        //fvt email
        app.get("/api/favorites/:email", async (req, res) => {
            const { email } = req.params;

            const result = await favoritesCollection.find({ tenantEmail: email }).toArray();

            res.send(result);
        });


        // single
        app.get("/properties/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const result = await propertyCollection.findOne({
                    _id: new ObjectId(id),
                });
                if (!result) {
                    return res.status(404).send({ message: "Property not found" });
                }
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // ==================== Admin Overview ====================
        app.get("/api/admin/overview", async (req, res) => {

            try {
                const totalUsers = await userCollection.countDocuments();
                const totalOwners = await userCollection.countDocuments({

                    role: "owner",

                });

                const totalProperties = await propertyCollection.countDocuments();

                const approvedProperties = await propertyCollection.countDocuments({

                    status: "approved",

                });
                const pendingProperties = await propertyCollection.countDocuments({

                    status: "pending",

                });
                const rejectedProperties = await propertyCollection.countDocuments({

                    status: "rejected",

                });


                const totalBookings = await bookingCollection.countDocuments();

                const revenueResult = await bookingCollection

                    .aggregate([

                        {

                            $match: {

                                paymentStatus: "paid",

                            },
                        },

                        {
                            $group: {

                                _id: null,

                                totalRevenue: {

                                    $sum: {

                                        $toDouble: "$amount",

                                    },

                                },

                            },

                        },

                    ])

                    .toArray();

                const totalRevenue =

                    revenueResult.length > 0

                        ? revenueResult[0].totalRevenue

                        : 0;
                const monthlyRevenueResult = await bookingCollection

                    .aggregate([

                        {
                            $match: {
                                paymentStatus: "paid",
                            },

                        },

                        {

                            $group: {

                                _id: {

                                    year: {

                                        $year: "$bookingDate",

                                    },
                                    month: {
                                        $month: "$bookingDate",
                                    },
                                },
                                revenue: {
                                    $sum: {
                                        $toDouble: "$amount",
                                    },
                                },
                            },
                        },
                        {
                            $sort: {
                                "_id.year": 1,
                                "_id.month": 1,
                            },
                        },
                    ])
                    .toArray();
                // Monthly Bookings
                const monthlyBookingsResult = await bookingCollection
                    .aggregate([
                        {
                            $group: {
                                _id: {
                                    year: {
                                        $year: "$bookingDate",
                                    },
                                    month: {
                                        $month: "$bookingDate",
                                    },
                                },
                                bookings: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                "_id.year": 1,
                                "_id.month": 1,
                            },
                        },
                    ])
                    .toArray();
                const monthNames = [

                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                ];
                // Format Revenue Data
                const monthlyRevenue = monthlyRevenueResult.map((item) => ({
                    month: monthNames[item._id.month - 1],
                    revenue: item.revenue,
                }));
                // Format Booking Data
                const monthlyBookings = monthlyBookingsResult.map((item) => ({
                    month: monthNames[item._id.month - 1],
                    bookings: item.bookings,
                }));
                res.send({
                    success: true,
                    data: {
                        totalUsers, totalOwners, totalProperties, approvedProperties, pendingProperties, rejectedProperties, totalBookings, totalRevenue, monthlyRevenue, monthlyBookings,
                    },
                });
            } catch (error) {
                console.error("Admin Overview Error:", error);



                res.status(500).send({

                    success: false,

                    message: error.message,

                });

            }

        });

        //state
        app.get("/api/admin/stats", async (req, res) => {
            const total = await propertyCollection.countDocuments();

            const approved = await propertyCollection.countDocuments({
                status: "approved",
            });

            const pending = await propertyCollection.countDocuments({
                status: "pending",
            });

            const rejected = await propertyCollection.countDocuments({
                status: "rejected",
            });

            res.send({
                total,
                approved,
                pending,
                rejected,
            });
        });

        // Admin - All Property
        app.get("/api/admin/property", async (req, res) => {
            const result = await propertyCollection.find().toArray();
            res.send(result);
        });

        //all payments
        app.get("/api/admin/payments", async (req, res) => {
            try {
                const payments = await bookingCollection
                    .find({
                        paymentStatus: "paid",
                    })
                    .sort({ bookingDate: -1 })
                    .toArray();

                const result = await Promise.all(
                    payments.map(async (payment) => {
                        const property = await propertyCollection.findOne({
                            _id: new ObjectId(payment.propertyId),
                        });

                        return {
                            ...payment,
                            ownerName: property?.ownerInfo?.name || "N/A",
                            ownerEmail: property?.ownerInfo?.email || "N/A",
                        };
                    })
                );

                res.send(result);
            } catch (err) {
                console.log(err);
                res.status(500).send({
                    success: false,
                    message: "Failed to load payments",
                });
            }
        });
        // users
        app.get("/api/admin/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        //booking
        app.get("/api/admin/bookings", async (req, res) => {
            const bookings = await bookingCollection.find().toArray();

            const result = await Promise.all(
                bookings.map(async (booking) => {
                    const property = await propertyCollection.findOne({
                        _id: new ObjectId(booking.propertyId),
                    });

                    return {
                        ...booking,
                        ownerName: property?.ownerInfo?.name || "N/A",
                        bookingStatus: property?.status || "pending",
                    };
                })
            );

            res.send(result);
        });

        //booking approve payment
        app.patch("/api/admin/bookings/approve/:id", async (req, res) => {
            const { id } = req.params;

            const result = await bookingCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        bookingStatus: "approved",
                    },
                }
            );

            res.send({
                success: true,
                modifiedCount: result.modifiedCount,
            });
        });

        //booking reject payment
        app.patch("/api/admin/bookings/reject/:id", async (req, res) => {
            const { id } = req.params;

            const result = await bookingCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        bookingStatus: "rejected",
                    },
                }
            );

            res.send({
                success: true,
                modifiedCount: result.modifiedCount,
            });
        });

        //user role
        app.patch("/api/admin/users/role/:id", async (req, res) => {
            const { id } = req.params;
            const { role } = req.body;

            const result = await userCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { role } }
            );

            res.send({
                success: true,
                modifiedCount: result.modifiedCount,
            });
        });

        //Block/Unblock
        app.patch("/api/admin/users/block/:id", async (req, res) => {
            const { id } = req.params;
            const { isBlocked } = req.body;

            const result = await userCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { isBlocked } }
            );

            res.send({
                success: true,
                modifiedCount: result.modifiedCount,
            });
        });

        //  approve
        app.patch("/api/admin/property/approve/:id", async (req, res) => {
            const { id } = req.params;

            const result = await propertyCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: "approved",
                    },
                }
            );

            res.send(result);
        });


        //reject
        app.patch("/api/admin/property/reject/:id", async (req, res) => {
            const { id } = req.params;
            const { feedback } = req.body;

            const result = await propertyCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: "rejected",
                        rejectionFeedback: feedback,
                    },
                }
            );

            res.send(result);
        });

        // delete
        app.delete("/api/admin/property/:id", async (req, res) => {
            const { id } = req.params;

            const result = await propertyCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });

        //update
        app.patch("/api/admin/property/:id", async (req, res) => {
            const { id } = req.params;

            const result = await propertyCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: req.body,
                }
            );

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