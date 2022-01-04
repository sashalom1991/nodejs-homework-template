const fs = require("fs/promises");
const contactsPath = require("./contactsPath");

console.log(contactsPath)
const listContacts = async() =>{
    const data = await fs.readFile(contactsPath);
    const products = JSON.parse(data);
    return products;
}
module.exports = listContacts;