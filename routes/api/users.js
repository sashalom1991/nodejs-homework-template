const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const Jimp = require('jimp');
const { BadRequest, Conflict, Unauthorized } = require('http-errors');

const { User } = require('../../models');
const { joiSignupSchema, joiLoginSchema } = require('../../models/user');
const { authenticate, upload } = require('../../middlewares');
const { SECRET_KEY } = process.env;

const avatarsDir = path.join(__dirname, '../../', 'public', 'avatars');

const router = express.Router();

// регистрация пользователя с хешированием пароля
router.post('/signup', async (req, res, next) => {
  try {
    const { error } = joiSignupSchema.validate(req.body);
    if (error) {
      throw new BadRequest('Ошибка от Joi или другой библиотеки  валидации');
    }
    const { email, password, subscription } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict('Email in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({
      email,
      subscription,
      password: hashPassword,
      avatarURL,
    });
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

// логирование пользователя на сайте
router.post('/login', async (req, res, next) => {
  try {
    const { error } = joiLoginSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    console.log(req.body);
    const user = await User.findOne({ email });
    if (!user) {
      throw Unauthorized('Email or password is wrong');
    }
    const passwordUser = await bcrypt.compare(password, user.password);
    if (!passwordUser) {
      throw Unauthorized('Email or password is wrong');
    }

    const { _id, subscription } = user;
    const payload = {
      id: _id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    await User.findByIdAndUpdate(_id, { token });
    res.json({
      token,
      user: {
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

// текущий пользователь
router.get('/current', authenticate, async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    user: {
      email,
      subscription,
    },
  });
});

// разлогинивание пользователя
router.get('/logout', authenticate, async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).send();
});

// обновление подписки (subscription) пользователя через эндпоинт
router.patch('/', authenticate, async (req, res, next) => {
  console.log(req.user);
  try {
    const { error } = joiSignupSchema.validate(req.body);
    if (error) {
      throw new BadRequest('Ошибка от Joi или другой библиотеки  валидации');
    }
    const { _id } = req.user;
    const { subscription } = req.body;
    console.log(subscription);
    console.log(res);
    // возращает объект обновлений в бази но не res
    // const updateSubscrition = await User.findByIdAndUpdate(_id, {subscription})
    const updateSubscrition = await User.findByIdAndUpdate(
      _id,
      { subscription },
      { new: true },
    );

    res.json(updateSubscrition);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/avatars',
  authenticate,
  upload.single('avatar'),
  async (req, res, next) => {
    const { path: tempUpload, filename } = req.file;

    await Jimp.read(tempUpload)
      .then(img => {
        return img
          .resize(256, 256) // resize
          .write(tempUpload); // save
      })
      .catch(err => {
        next(err);
      });

    const [extension] = filename.split('.').reverse();
    const newFileName = `${req.user._id}.${extension}`;
    const fileUpload = path.join(avatarsDir, newFileName);
    await fs.rename(tempUpload, fileUpload);
    const avatarURL = path.join('avatars', newFileName);
    await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });
    res.json({ avatarURL });
  },
);

module.exports = router;
