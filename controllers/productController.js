const Product = require('../models/Product');
const Media = require('../models/productMedia');

const addProduct = async (req, res) => {
  try {
    const {
      basicInfo,
      inventory,
      pricing,
      shipping
    } = req.body;

    const parsedBasicInfo = JSON.parse(basicInfo);
    const parsedInventory = JSON.parse(inventory);
    const parsedPricing = JSON.parse(pricing);
    const parsedShipping = JSON.parse(shipping);

    
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

   
    const mediaEntries = await Promise.all(
      req.files?.map(async file => {
        const isVideo = file.mimetype.startsWith('video');
        const mediaDoc = new Media({
          fileUrl: file.path,
          type: isVideo ? 'video' : 'image',
          product: savedProduct._id,
          uploadedBy: req.user._id
        });
        return await mediaDoc.save();
      }) || []
    );

    
    savedProduct.media = mediaEntries.map(m => m._id);
    await savedProduct.save();

    
    const populated = await Product.findById(savedProduct._id)
      .populate({ path: 'user', select: '_id email username' })
      .populate({ path: 'media' });

    res.status(200).json({
      code: 200,
      message: 'Product created with media successfully',
      data: populated
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


module.exports = { addProduct,getUserProducts  };
