const listContacts = require("./listContacts");

async function getContactById(id) {
    const contacts = await listContacts();
    const index = contacts.findIndex(item => (item.id).toString() === id);
  if (index === -1) {
    return null;
  }
  console.log(contacts[index]);
  return contacts[index];
  }

module.exports = getContactById;