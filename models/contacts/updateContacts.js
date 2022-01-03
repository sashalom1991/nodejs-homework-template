const fs = require("fs/promises");
const contactsPath = require("./contactsPath");

const updateContacts = async (data) => {
    await fs.writeFile(contactsPath, JSON.stringify(data, null, 2));
}

module.exports = updateContacts;