const User = require('../models/User');
const jwt = require('jsonwebtoken');

// تسجيل مستخدم جديد
const signup = async (req, res) => {
  try {
    const { الاسم, البريد, كلمة_المرور, الهاتف } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findOne({ where: { email: البريد } });
    if (user) {
      return res.status(400).json({
        خطأ: 'المستخدم موجود بالفعل'
      });
    }

    // إنشاء مستخدم جديد
    const newUser = await User.create({
      name: الاسم,
      email: البريد,
      password: كلمة_المرور,
      phone: الهاتف
    });

    // إنشاء التوكن
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      رسالة: 'تم إنشاء المستخدم بنجاح',
      توكن: token,
      المستخدم: {
        المعرف: newUser.id,
        الاسم: newUser.name,
        البريد: newUser.email,
        الدور: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      خطأ: error.message
    });
  }
};

// تسجيل الدخول
const login = async (req, res) => {
  try {
    const { البريد, كلمة_المرور } = req.body;

    // البحث عن المستخدم
    const user = await User.findOne({ where: { email: البريد } });
    if (!user) {
      return res.status(400).json({
        خطأ: 'البريد أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من كلمة المرور
    const isValid = await user.verifyPassword(كلمة_المرور);
    if (!isValid) {
      return res.status(400).json({
        خطأ: 'البريد أو كلمة المرور غير صحيحة'
      });
    }

    // تحديث آخر تسجيل دخول
    user.lastLogin = new Date();
    await user.save();

    // إنشاء التوكن
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      رسالة: 'تم تسجيل الدخول بنجاح',
      توكن: token,
      المستخدم: {
        المعرف: user.id,
        الاسم: user.name,
        البريد: user.email,
        الدور: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      خطأ: error.message
    });
  }
};

module.exports = { signup, login };
