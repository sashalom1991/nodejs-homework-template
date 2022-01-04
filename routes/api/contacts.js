const express = require('express')
const router = express.Router();
// const createError = require("http-errors");
const { NotFound, BadRequest } = require("http-errors");
const Joi = require("joi");

const joiSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string(),
  phone: Joi.string()
});

const schemaUpdate = Joi.object({
  name: Joi.string(),    
  email: Joi.string(),
  phone: Joi.string()
}).min(1)

const contactsOperation = require("../../models/contacts");

router.get('/', async (req, res, next) => {
  try {
    const contacts = await contactsOperation.listContacts()
  return res.json(contacts);
  } catch (error) {
    next(error);
  }
})

router.get('/:id', async (req, res, next) => {
  console.log(req.params);
  const { id } = req.params;
  try {
    const contact = await contactsOperation.getById(id)
    if (!contact) {
      throw new NotFound();
      // const error = new Error("Not found");
      // error.status = '404';
      // throw error;
    }
    res.json(contact);
  }
  catch (error) {
    next(error);
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message)
    }
    console.log(req)
    const newContact = await contactsOperation.addContact(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteContact = await contactsOperation.removeContact(id);
    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({message: "contact deleted"})
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { error } = schemaUpdate.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { id } = req.params;
    const updateContact = await contactsOperation.updateByIdContact({ id, ...req.body});
    if (!updateContact) {
      throw new BadRequest(error.message);
    }
    res.json(updateContact);
  } catch (error) {
    next(error);
  }
})

module.exports = router;
