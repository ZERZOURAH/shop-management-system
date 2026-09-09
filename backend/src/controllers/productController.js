const Product = require('../models/Product');
const { Op } = require('sequelize');

// الحصول على جميع المنتجات
const getAllProducts = async (req, res) => {
  try {
    const { الصفحة = 1, الحد = 10, الفئة } = req.query;
    const offset = (الصفحة - 1) * الحد;

    const whereClause = { isActive: true };
    if (الفئة) whereClause.category = الفئة;

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(الحد),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      المنتجات: rows,
      الإجمالي: count,
      الصفحات: Math.ceil(count / الحد),
      الصفحة_الحالية: parseInt(الصفحة)
    });
  } catch (error) {
    res.status(500).json({ خطأ: error.message });
  }
};

// الحصول على منتج معين
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ خطأ: 'المنتج غير موجود' });
    }
    res.json({ المنتج: product });
  } catch (error) {
    res.status(500).json({ خطأ: error.message });
  }
};

// إنشاء منتج جديد
const createProduct = async (req, res) => {
  try {
    const { الاسم, الوصف, رمز, الفئة, السعر, سعر_التكلفة, الكمية, الحد_الأدنى } = req.body;

    // التحقق من البيانات المطلوبة
    if (!الاسم || !رمز || !السعر || !الفئة) {
      return res.status(400).json({
        خطأ: 'الاسم والرمز والسعر والفئة مطلوبة'
      });
    }

    // التحقق من عدم تكرار الرمز
    const existingProduct = await Product.findOne({ where: { sku: رمز } });
    if (existingProduct) {
      return res.status(400).json({
        خطأ: 'رمز المنتج موجود بالفعل'
      });
    }

    const product = await Product.create({
      name: الاسم,
      description: الوصف || null,
      sku: رمز,
      category: الفئة,
      price: السعر,
      costPrice: سعر_التكلفة || السعر * 0.7,
      quantity: الكمية || 0,
      minQuantity: الحد_الأدنى || 5
    });

    res.status(201).json({
      رسالة: '✅ تم إنشاء المنتج بنجاح',
      المنتج: product
    });
  } catch (error) {
    res.status(500).json({ خطأ: error.message });
  }
};

// تحديث منتج
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { الاسم, الوصف, السعر, الكمية, الحد_الأدنى } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ خطأ: 'المنتج غير موجود' });
    }

    await product.update({
      name: الاسم || product.name,
      description: الوصف || product.description,
      price: السعر || product.price,
      quantity: الكمية !== undefined ? الكمية : product.quantity,
      minQuantity: الحد_الأدنى || product.minQuantity
    });

    res.json({
      رسالة: '✅ تم تحديث المنتج بنجاح',
      المنتج: product
    });
  } catch (error) {
    res.status(500).json({ خطأ: error.message });
  }
};

// حذف منتج
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ خطأ: 'المنتج غير موجود' });
    }

    await product.update({ isActive: false });

    res.json({
      رسالة: '✅ تم حذف المنتج بنجاح'
    });
  } catch (error) {
    res.status(500).json({ خطأ: error.message });
  }
};

// الحصول على المنتجات ذات المخزون المنخفض
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        quantity: {
          [Op.lte]: sequelize.where(
            sequelize.col('minQuantity'),
            Op.eq,
            sequelize.col('quantity')
          )
        }
      },
      order: [['quantity', 'ASC']]
    });

    res.json({
      المنتجات: products,
      الإجمالي: products.length
    });
  } catch (error) {
    res.status(500).json({ خطأ: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
};
