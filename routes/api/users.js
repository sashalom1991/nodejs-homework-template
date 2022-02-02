const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const Jimp = require('jimp');
const { nanoid } = require('nanoid');
const { BadRequest, Conflict, Unauthorized, NotFound } = require('http-errors');

const { User } = require('../../models');
const { joiSignupSchema, joiLoginSchema } = require('../../models/user');
const { authenticate, upload } = require('../../middlewares');
const { sendEmail } = require('../../helpers');
const { SECRET_KEY, SITE_NAME } = process.env;

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
    const verificationToken = nanoid();
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({
      email,
      subscription,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    // Отправления на email подтверждения верификации
    const data = {
      to: 'janekis708@chinamkm.com',
      subject: 'Верификация - подтверждение email',
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Подтвердить email</a>`,
    };

    await sendEmail(data);

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
    const user = await User.findOne({ email });
    if (!user) {
      throw Unauthorized('Email or password is wrong');
    }
    if (!user.verify) {
      throw new Unauthorized('Email not verify');
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
  try {
    const { error } = joiSignupSchema.validate(req.body);
    if (error) {
      throw new BadRequest('Ошибка от Joi или другой библиотеки  валидации');
    }
    const { _id } = req.user;
    const { subscription } = req.body;

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

router.post('/verify', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequest('missing required field email');
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFound('User not found');
    }
    if (user.verify) {
      throw new BadRequest('Verification has already been passed');
    }

    const { verificationToken } = user;
    // Повторное отправления на email подтверждения верификации
    const data = {
      to: 'janekis708@chinamkm.com',
      subject: 'Верификация - подтверждение email',
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Подтверждения верификации</a>`,
    };

    await sendEmail(data);
    res.json({
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/verify/:verificationToken', async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw new NotFound('User not found');
    }
    await User.findOneAndUpdate(user._id, {
      verificationToken: null,
      verify: true,
    });
    res.json({ message: 'Verification successful' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
