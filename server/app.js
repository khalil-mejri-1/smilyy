const express = require("express");
const app = express();
const mongoose = require('mongoose');

const PORT = 3002;
const stickres = require("./models/stickres"); // تأكد من أن الاسم صحيح هنا
const pack = require("./models/pack"); // تأكد من أن الاسم صحيح هنا


app.use(express.json()); // Middleware to parse JSON requests



const cors = require('cors');
app.use(cors()); // Enable CORS for cross-origin requests



const connectDB = async () => {
    try {
        const uri = 'mongodb+srv://khalilmejri000:ZD6XD4Zz4KMuqnb1@cluster0.28bwdzy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();




app.get("/items/:category", async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  
  try {
    let items;
    let totalItems;

    // ✨ Check if the category is 'All'
    if (category.toLowerCase() === 'all') {
      // --- Logic for fetching ALL random items ---
      
      totalItems = await stickres.countDocuments({}); // Count all documents in the collection

      // Use the aggregation pipeline to get a random sample of documents
      // Note: This provides a new random set for each request and is not suitable for stable pagination.
      // For infinite scroll, this creates an effect of seeing random new items each time you load more.
      items = await stickres.aggregate([
        { $sample: { size: limit } } 
      ]);

    } else {
      // --- Original logic for a specific category ---

      // Find total items matching the specific category
      totalItems = await stickres.countDocuments({ category }); 
      
      // Find and paginate items for the specific category, sorted by newest
      items = await stickres.find({ category })
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    res.json({ items, total: totalItems });

  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
});



app.get("/pack_items/:id", async (req, res) => {
  const { id } = req.params; // استخراج المعرف من الرابط

  try {
    const item = await pack.findById(id); // البحث عن العنصر حسب المعرف

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // استخراج جميع الصور من العنصر
    const images = [
      ...item.stickers.map((sticker) => sticker.image) // جميع صور الملصقات
    ].filter(Boolean); // حذف القيم الفارغة (null أو undefined)

    res.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Error fetching images" });
  }
});




app.delete("/delete-all-products", async (req, res) => {
    try {
      await stickres.deleteMany({}); // حذف جميع المنتجات من القاعدة المحددة
      res.json({ success: true, message: `All products deleted from ${DATABASE_NAME} successfully!` });
    } catch (error) {
      // طباعة التفاصيل في الـ console
      console.error(error);
      
      // إرسال تفاصيل الخطأ في الاستجابة
      res.status(500).json({ success: false, message: "Error deleting products", error: error.message });
    }
  });



  // Route to create and save a pack
app.post('/packs', async (req, res) => {
  try {
      const { title, image,category, quantity_pack, stickers } = req.body;

      const newPack = new pack({
          title,
          image,
          category,
          quantity_pack,
          stickers
      });

      const savedPack = await newPack.save();
      res.status(201).json(savedPack);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


// Route to fetch all packs
app.get('/packs', async (req, res) => {
  try {
      const packs = await pack.find();
      res.status(200).json(packs);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

  

// app.get("/items/:category", async (req, res) => {
//   const { category } = req.params; // Extract category from URL

//   try {
//       const items = await stickres.find({ category }) // Fetch items by category
//           .sort({ _id: -1 }); // Sort by latest items

//       res.json({ items });
//   } catch (error) {
//       console.error("Error fetching items:", error);
//       res.status(500).json({ message: "Error fetching items" });
//   }
// });






app.post("/add_stickres", async (req, res) => {
  try {
    const newstickres = new stickres(req.body);
    await newstickres.save();
    res.status(201).send("User added successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

// app.get("/items", async (req, res) => {
//     try {
//       const items = await stickres.find().sort({ _id: -1 }); // Get all items sorted by _id in descending order
  
//       res.json({ items });
//     } catch (error) {
//       console.error("Error fetching items:", error);
//       res.status(500).json({ message: "Error fetching items" });
//     }
//   });
  




app.get("/", (req, res) => {
    res.send("update 2/28/2025");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
