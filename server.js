const express = require("express");
const fetch = require("node-fetch"); // Make sure to run: npm install node-fetch@2
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Replace this with your actual Delhivery API Key
const DELHIVERY_API_KEY = "f3cc9a66d8f27a892d29de656e2ba29c96539f17";

// ✅ Enable CORS for Shopify frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // In production, replace * with your domain
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// 🎯 Tracking endpoint
app.get("/track", async (req, res) => {
  const type = req.query.type; // 'awb', 'orderid', or 'mobile'
  const value = req.query.value;

  if (!type || !value) {
    return res.status(400).json({ success: false, message: "Missing tracking type or value." });
  }

  // Map input type to Delhivery API query
  let queryParam = "";

  switch (type.toLowerCase()) {
    case "awb":
      queryParam = `waybill=${value}`;
      break;
    case "orderid":
      queryParam = `order_id=${value}`;
      break;
    case "mobile":
      queryParam = `phone=${value}`;
      break;
    default:
      return res.status(400).json({ success: false, message: "Invalid tracking type." });
  }

  const url = `https://track.delhivery.com/api/v1/packages/json/?${queryParam}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${DELHIVERY_API_KEY}`,
      },
    });

    const data = await response.json();

    if (data && data.packages && data.packages.length > 0) {
      const p = data.packages[0];
      res.json({
        success: true,
        status: p.status.status,
        date: p.status.status_date,
        location: p.status.status_location,
        history: p.scan_detail,
      });
    } else {
      res.json({ success: false, message: "No tracking data found." });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching tracking info.",
      error: err.message,
    });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
