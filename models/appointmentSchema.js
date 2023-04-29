const mongoose = require("mongoose");

const appointment = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "serviceinfo" },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "teacherinfo" },
  slotes: Array,
  status: String,
});
appointment.set("timestamps", true);
module.exports = mongoose.model("appointment", appointment);
