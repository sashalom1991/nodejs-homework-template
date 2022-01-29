const express = require('express');
const router = express.Router();
const { NotFound, BadRequest } = require('http-errors');

const { authenticate } = require('../../middlewares');
const { Contact } = require('../../models');
const { joiSchema } = require('../../models/contact');

router.get('/', authenticate, async (req, res, next) => {
  try {
    // console.log(req.query);
    const { page = 1, limit = 20, favorite = true } = req.query;
    const skip = (page - 1) * limit;

    const { _id } = req.user;
    const contacts = await Contact.find({ owner: _id, favorite }, '', {
      skip,
      limit: Number(limit),
    });
    return res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  // console.log(req.params);
  const { id } = req.params;
  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      throw new NotFound();
      // const error = new Error("Not found");
      // error.status = '404';
      // throw error;
    }
    res.json(contact);
  } catch (error) {
    if (error.message.includes('Cast to ObjectId failed')) {
      error.status = 404;
    }
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { _id } = req.user;
    const newContact = await Contact.create({ ...req.body, owner: _id });
    res.status(201).json(newContact);
  } catch (error) {
    if (error.message.includes('validation failed')) {
      error.status = 400;
    }
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    // console.log(id);
    const deleteContact = await Contact.findByIdAndRemove(id);
    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({ message: 'contact deleted' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateContact = await Contact.findByIdAndUpdate(id, req.body);
    if (!updateContact) {
      throw new NotFound();
    }
    res.json(updateContact);
  } catch (error) {
    if (error.message.includes('validation failed')) {
      error.status = 400;
    }
    next(error);
  }
});

router.patch('/:id/favorite', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.body.favorite === undefined) {
      throw new BadRequest('missing field favorite');
    }
    const updateContact = await Contact.findByIdAndUpdate(id, req.body);
    if (!updateContact) {
      throw new NotFound();
    }
    res.json(updateContact);
  } catch (error) {
    if (error.message.includes('validation failed')) {
      error.status = 400;
    }
    next(error);
  }
});

module.exports = router;
