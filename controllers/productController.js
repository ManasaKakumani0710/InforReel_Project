require('dotenv').config();
const Product = require('../models/Product');
const vendorDocument = require('../models/vendorDocument');
const Cart = require('../models/Cart');
const Order = require("../models/Order");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { Shippo } = require('shippo');
const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY });


const addProduct = async (req, res) => {
  try {
    const { basicInfo, inventory, pricing, shipping, fileMeta } = req.body;

    const parsedBasicInfo = JSON.parse(basicInfo);
    const parsedInventory = JSON.parse(inventory);
    const parsedPricing = JSON.parse(pricing);
    const parsedShipping = JSON.parse(shipping);
    const parsedFileMeta = fileMeta ? JSON.parse(fileMeta) : [];

    const newProduct = new Product({
      user: req.user._id,
      productName: parsedBasicInfo.productName,
      productDescription: parsedBasicInfo.productDescription,
      category: parsedBasicInfo.category,
      productTags: parsedBasicInfo.productTags,

      sku: parsedInventory.sku,
      barcode: parsedInventory.barcode,
      quantity: parsedInventory.quantity,
      productStatus: parsedInventory.productStatus,

      basePrice: parsedPricing.basePrice,
      discountType: parsedPricing.discountType,
      discountPercentage: parsedPricing.discountPercentage,
      taxIncludedPrice: parsedPricing.taxIncludedPrice,
      taxRule: parsedPricing.taxRule,
      unitPrice: parsedPricing.unitPrice,
      minOrderQty: parsedPricing.minOrderQty,

      shipping: {
        width: parsedShipping.width,
        height: parsedShipping.height,
        depth: parsedShipping.depth,
        weight: parsedShipping.weight
      }
    });

    const savedProduct = await newProduct.save(); 

    const allFiles = [
      ...(req.files?.image || []),
      ...(req.files?.video || [])
    ];

    const docEntries = allFiles.map((file) => {
      const meta = parsedFileMeta.find((m) => m.fileName === file.originalname) || {};
      return {
        userId: req.user._id,
        fileName: file.originalname,
        filePath: file.location,
        s3Key: file.key,
        mimeType: file.mimetype,
        fileType: meta.fileType || "Other",
        fileCategory: meta.category || "Other",
        productId: savedProduct._id
      };
    });

    const insertedDocs = await vendorDocument.insertMany(docEntries);

    // ✅ Add media reference to product
    savedProduct.media = insertedDocs.map(doc => doc._id);
    await savedProduct.save();

    const populated = await Product.findById(savedProduct._id)
      .populate({ path: 'user', select: '_id email username' });

    return res.status(200).json({
      code: 200,
      message: 'Product created with media successfully',
      data: populated
    });

  } catch (err) {
    console.error('Add Product Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Server error',
      error: err.message
    });
  }
};


const getUserProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    const products = await Product.find({ user: userId })
      .populate({ path: 'user', select: '_id email username' })
      .populate('media');

    res.status(200).json({
      code: 200,
      message: 'User products fetched successfully',
      data: products
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      message: 'Server error',
      error: err.message
    });
  }
};

const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, productDetails } = req.body;

  if (!productId || !productDetails || !productDetails.quantity || !productDetails.price) {
    return res.status(400).json({
      message: 'productId, productDetails with quantity and price are required',
      data: null,
      code: 400
    });
  }

  try {
    const incomingQty = Number(productDetails.quantity);
    const incomingPrice = Number(productDetails.price);

    if (isNaN(incomingQty) || isNaN(incomingPrice)) {
      return res.status(400).json({
        message: 'Invalid quantity or price format',
        data: null,
        code: 400
      });
    }


    let cart = await Cart.findOne({ userId });


    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, productDetails: { ...productDetails, quantity: incomingQty, price: incomingPrice } }]
      });
      await cart.save();
    } else {

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex > -1) {

        cart.items[itemIndex].productDetails.quantity += incomingQty;
        cart.items[itemIndex].productDetails.price += incomingPrice; // override or recalculate if needed
      } else {

        cart.items.push({
          productId,
          productDetails: { ...productDetails, quantity: incomingQty, price: incomingPrice }
        });
      }

      cart.markModified('items');
      await cart.save();
    }

    return res.status(200).json({
      message: 'Cart updated successfully',
      data: {
        userId: cart.userId,
        items: cart.items
      },
      code: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      data: null,
      code: 500
    });
  }
};



const deleteFromCart = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      message: 'productId is required',
      data: null,
      code: 400
    });
  }

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found',
        data: null,
        code: 404
      });
    }

    return res.status(200).json({
      message: 'Product removed from cart',
      data: {
        userId: cart.userId,
        items: cart.items
      },
      code: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      data: null,
      code: 500
    });
  }
};

const saveAddressHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const address = req.body;

    if (!address || Object.keys(address).length === 0) {
      return res.status(400).json({ code: 400, message: "Address is required", data: null });
    }

    const session = await Order.findOneAndUpdate(
      { userId },
      { userId, shippingAddress: address },
      { upsert: true, new: true }
    );

    res.status(200).json({
      code: 200,
      message: "Address saved",
      data: {
        userId: session.userId,
        address: session.shippingAddress
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: "Failed to save address", data: null });
  }
};


const completeOrderHandler = async (req, res) => {
  const { orderData, tracking } = req.body;

  try {
    // Generate custom order ID
    const orderId = "ORD" + new Date().getTime();
    const trackingUrl = `https://track.shippo.com/#/${tracking.carrier}/${tracking.tracking_number}`;

    // Create and save the order
    const newOrder = new Order({
      ...orderData,
      tracking,
      createdAt: new Date()
    });

    await newOrder.save();

    res.status(200).json({
      code: 200,
      message: "Order completed successfully",
      data: {
        orderId,
        trackingId: tracking.object_id,
        trackingUrl
      }
    });
  } catch (error) {
    console.error("Order insert error:", error);
    res.status(500).json({
      code: 500,
      message: "Failed to complete order",
      data: null
    });
  }
};



const shippingHandler = async (req, res) => {
  try {
    const { addressTo, parcel } = req.body;

    // Ensure parcel fields are in string format
    const formattedParcel = {
      length: String(parcel.length),
      width: String(parcel.width),
      height: String(parcel.height),
      distanceUnit: parcel.distanceUnit || "in",
      weight: String(parcel.weight),
      massUnit: parcel.massUnit || "lb"
    };

    const addressFrom = {
      name: process.env.FROM_NAME,
      street1: process.env.FROM_STREET1,
      city: process.env.FROM_CITY,
      state: process.env.FROM_STATE,
      zip: process.env.FROM_ZIP,
      country: process.env.FROM_COUNTRY,
      phone: process.env.FROM_PHONE,
      email: process.env.FROM_EMAIL
    };
    console.log("Secret Key::" + process.env.SHIPPO_API_KEY);

    const shipment = await shippo.shipments.create({
      addressFrom,
      addressTo,
      parcels: [formattedParcel],
      async: false
    });

    const selectedRate = shipment.rates?.[0];

    if (!selectedRate) {
      return res.status(404).json({
        code: 404,
        message: 'No shipping rates found',
        data: null
      });
    }

    res.status(200).json({
      code: 200,
      message: 'Shipping rate fetched',
      data: selectedRate
    });
  } catch (error) {
    console.error("Shippo error:", error);
    res.status(500).json({
      code: 500,
      message: 'Failed to get shipping rate',
      data: null
    });
  }
};


const paymentHandler = async (req, res) => {
  const { amount, paymentMethodId } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    });
    res.status(200).json({ code: 200, message: "Payment successful", data: paymentIntent });
  } catch (error) {
    res.status(400).json({ code: 400, message: "Payment failed", data: error.message });
  }
};

const getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        message: 'Cart is empty',
        data: [],
        code: 200
      });
    }

    return res.status(200).json({
      message: 'Cart fetched successfully',
      data: cart.items,
      code: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch cart',
      data: null,
      code: 500
    });
  }
};


module.exports = {
  addProduct, getUserProducts, addToCart, deleteFromCart,
  paymentHandler, saveAddressHandler, shippingHandler, completeOrderHandler,
  getCartItems
};
