const listContacts = require("./listContacts");
const updateContacts = require("./updateContacts");

const removeContact = async(id) => {
    const contacts = await listContacts();
    const idx = contacts.findIndex(item => String(item.id) === String(id));
    if(idx === -1){
        return null;
    }
    const removeContactById = contacts.splice(idx, 1);
    await updateContacts(contacts);
    return removeContactById;
}

module.exports = removeContact;