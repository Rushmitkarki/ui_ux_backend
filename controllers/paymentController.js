const axios = require("axios");
const Payment = require("../models/paymentModel");
const PurchasedItem = require("../models/purchasedItemModel");
const Game = require("../models/gameModel");

// Function to verify Khalti Payment
const verifyKhaltiPayment = async (pidx) => {
  const headersList = {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const bodyContent = JSON.stringify({ pidx });

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/verify/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error(
      "Error verifying Khalti payment:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Function to initialize Khalti Payment
const initializeKhaltiPayment = async (details) => {
  const headersList = {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const bodyContent = JSON.stringify({
    return_url: details.website_url + "/payment/success",
    website_url: details.website_url,
    amount: details.amount, // Amount in paisa
    purchase_order_id: details.itemId,
    purchase_order_name: "Game Purchase",
  });

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/initiate/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const response = await axios.request(reqOptions);
    return {
      success: true,
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
    };
  } catch (error) {
    console.error(
      "Error initializing Khalti payment:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Route handler to initialize Khalti payment

const initializeKhalti = async (req, res) => {
  // console.log("hit");
  try {
    console.log(req.body);
    const { itemId, totalPrice } = req.body;

    // Verify item data using the correct model (Insurance in your case)
    const gameData = await Game.findById(itemId);
    console.log(gameData);
    if (!gameData || gameData.gamePrice * 100 !== totalPrice) {
      // Ensure the price match
      return res.status(400).json({
        success: false,
        message: "Game not found or price mismatch",
      });
    }

    // Create a purchase document to store purchase info
    const purchasedItemData = await PurchasedItem.create({
      item: itemId,
      paymentMethod: "khalti",
      totalPrice: totalPrice,
    });

    // Initialize Khalti payment
    const paymentInitiate = await initializeKhaltiPayment({
      amount: totalPrice, // Ensure this is in paisa
      itemId: purchasedItemData._id,
      website_url: req.body.website_url || "http://localhost:3000",
    });

    res.status(200).json({
      success: true,
      payment_url: paymentInitiate.payment_url,
      pidx: paymentInitiate.pidx,
    });
  } catch (error) {
    console.error("Error initializing Khalti payment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while initializing Khalti payment",
      error: error.message,
    });
  }
};
const completeKhaltiPayment = async (req, res) => {
  const {
    pidx,

    amount,

    productId,

    transactionId,
  } = req.query;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Check if payment is completed and details match
    if (
      paymentInfo?.status !== "Completed" ||
      paymentInfo.transaction_id !== transactionId ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete information",
        paymentInfo,
      });
    }

    // Check if payment done in valid item
    const purchasedItemData = await PurchasedItem.findOne({
      _id: productId,
      totalPrice: amount,
    });

    if (!purchasedItemData) {
      return res.status(400).send({
        success: false,
        message: "Purchased data not found",
      });
    }

    // Update purchase record status to completed
    await PurchasedItem.findByIdAndUpdate(
      productId,
      { $set: { status: "completed" } },
      { new: true }
    );

    // Create or update payment record
    const paymentData = await Payment.findOneAndUpdate(
      { transactionId: transactionId },
      {
        pidx,
        productId: productId,
        amount,
        dataFromVerificationReq: paymentInfo,
        apiQueryFromUser: req.query,
        paymentGateway: "khalti",
        status: "success",
      },
      { upsert: true, new: true }
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: "Payment Successful",
      paymentData,
    });
  } catch (error) {
    console.error("Error in complete-khalti-payment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

module.exports = {
  initializeKhalti,
  completeKhaltiPayment,
  verifyKhaltiPayment,
  initializeKhaltiPayment,
};