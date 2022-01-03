const updateContacts = require("./updateContacts");
const listContacts = require("./listContacts");

const updateByIdContact = async ({ id, name, email, phone }) => {
    const contacts = await listContacts();
    const idx = contacts.findIndex(item => String(item.id) === String(id));
    if (idx === -1) {
        return null;
    }

    contacts[idx] = { id, name, email, phone };
    console.table(contacts);
    await updateContacts(contacts);
    return contacts[idx];
}

module.exports = updateByIdContact;

