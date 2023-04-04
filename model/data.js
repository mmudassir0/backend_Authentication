const mongoose = require("mongoose");
const formData = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
});
module.exports = mongoose.model("formdata", formData);
