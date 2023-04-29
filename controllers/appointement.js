const serviceSchema = require("../models/serviceSchema");
const teacherSchema = require("../models/teacherSchema");
const userSchema = require("../models/userSchema");
const appointmentSchema = require("../models/appointmentSchema");
const json = require("jsonwebtoken");
const json2xls = require("json2xls");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// verify token for user
const verifyuser = async (socket) => {
  try {
    let token = socket.handshake.headers.authorization;
    if (token) {
      const verify = json.verify(token, process.env.secrate);
      let checkIdExist = await userSchema.findById(verify.id);
      if (checkIdExist) {
        return checkIdExist;
      } else {
        socket.emit("response", {
          message: "Not have rights controller this module",
        });
      }
    } else {
      socket.emit("response", {
        message: "This serviceId & timerid must be required",
      });
    }
  } catch (error) {
    socket.emit("response", { message: error.message });
  }
};
module.exports = {
  // add new appointment for user
  newAppointement: async (data, socket) => {
    try {
      const { serviceId, times } = data;
      if (serviceId && times) {
        // verify user by token
        let user = await verifyuser(socket);
        if (user) {
          // check service details by unique id
          let serviceCheck = await serviceSchema.findById(serviceId);
          if (serviceCheck) {
            // check this time slote teacher is available or not
            let checkTimeSlot = await teacherSchema.find(
              {
                times: {
                  $elemMatch: {
                    startTime: times[0].startTime,
                    endTime: times[0].endTime,
                  },
                },
              },
              { "times.$": 1 }
            );
            // if yes then move forword else return message
            if (checkTimeSlot) {
              // check this time slot user is availabe or not
              let checkTimeSlotBooked = await appointmentSchema.find(
                { userid: user.id },
                {
                  slotes: {
                    $elemMatch: {
                      startTime: times[0].startTime,
                      endTime: times[0].endTime,
                    },
                  },
                },
                { "slotes.$": 1 }
              );
              // if yes then return message else  move forword
              if (checkTimeSlotBooked.length > 0) {
                socket.emit("response", {
                  message: "you cannot booked the slot at same time ",
                });
              } else {
                // add new appointment for this user
                await appointmentSchema.create({
                  userid: user.id,
                  serviceId: serviceCheck.id,
                  teacherId: checkTimeSlot[0].id,
                  slotes: times,
                  status: "booked",
                });
                // remove time slote in teacher schema for specified user time slote
                await teacherSchema.findByIdAndUpdate(checkTimeSlot[0].id, {
                  $pull: {
                    times: {
                      startTime: times[0].startTime,
                      endTime: times[0].endTime,
                    },
                  },
                });
                socket.emit("response", {
                  message: "your appoinment is booked",
                });
              }
            }
          } else {
            socket.emit("response", {
              message: "This serviceId & timerid must be required",
            });
          }
        }
      } else {
        socket.emit("response", {
          message: "Token is required",
        });
      }
    } catch (error) {
      socket.emit("response", { message: error.message });
    }
  },
  // get all appointment details for that user
  appointmentList: async (data, socket) => {
    try {
      const { teacherId, startTime, endTime } = data;
      let search = {};
      // get appointment by teacher details
      if (teacherId) {
        search["teacherId"] = teacherId;
      }
      // get appointment by startTime   and endtime
      if (startTime) {
        search["slotes.startTime"] = { $gte: startTime };
      }
      if (endTime) {
        search["slotes.endTime"] = { $lte: endTime };
      }
      // data to json
      let json = [];
      // verify user by token
      let user = await verifyuser(socket);
      if (user) {
        // get appointment details with filter
        let result = await appointmentSchema
          .find(search)
          .find({ userid: user.id })
          .populate([
            { path: "userid", select: { name: 1, _id: 0 } },
            { path: "serviceId", select: { name: 1, _id: 0 } },
            { path: "teacherId", select: { name: 1, _id: 0 } },
          ]);
        // store required filed and value for show data in excel
        result.forEach((i) => {
          json.push({
            username: i.userid.name,
            service: i.serviceId.name,
            teacher: i.teacherId.name,
            strarTime: i.slotes[0].startTime,
            endTime: i.slotes[0].endTime,
            status: i.status,
          });
        });
        // convert json to excel formate
        const xls = json2xls(json);
        let fileName = `apt_sheet_${Date.now()}.xlsx`;
        // store this file in specific forler
        fs.writeFileSync(
          path.join(__dirname, "../public", fileName),
          xls,
          "binary"
        );
        // give output
        socket.emit("response", {
          message: "List of your appointemnts ",
          downloadLink: `http://localhost:4000/${fileName}`,
          result,
        });
      }
    } catch (error) {
      socket.emit("response", { message: error.message });
    }
  },
  // user can cancel the appointment by id
  cancelAppoitmentById: async (data, socket) => {
    try {
      const { apId } = data;
      // verify token for user
      let user = await verifyuser(socket);
      if (user) {
        // check appoitment is exist or not
        let checkData = await appointmentSchema.findById(apId);
        if (checkData) {
          // check this appoitment for user is valid or not
          if (checkData.userid == user.id) {
            // thi user appoinment time slot can add in teacher schema because other user can book this same time slot
            await teacherSchema.findByIdAndUpdate(checkData.teacherId, {
              $push: {
                times: {
                  startTime: checkData.slotes[0].startTime,
                  endTime: checkData.slotes[0].endTime,
                },
              },
            });
            // it remove user time slot for booked appointment
            await appointmentSchema.findByIdAndUpdate(checkData.id, {
              status: "cancelled",
              $pull: {
                slotes: {
                  startTime: checkData.slotes[0].startTime,
                  endTime: checkData.slotes[0].endTime,
                },
              },
            });
            socket.emit("response", {
              message: "This appointment is cancelled successfully",
            });
          } else {
            socket.emit("response", {
              message: "you dont rights to controll others appointments",
            });
          }
        } else {
          socket.emit("response", {
            message: "This appointemnt is not exist",
          });
        }
      }
    } catch (error) {
      socket.emit("response", { message: error.message });
    }
  },
  // user delete the appointment
  deleteAppoitemntById: async (data, socket) => {
    try {
      const { apId } = data;
      // verify user by token
      let user = await verifyuser(token, socket);
      if (user) {
        // check this appointment is exist or not by appoinment unique id
        let checkData = await appointmentSchema.findById(apId);
        if (checkData) {
          // check this appoitment for user is valid or not
          if (checkData.userid == user.id) {
            // delete this appoitment by appoinment unique id
            await appointmentSchema.findByIdAndDelete(checkData.id);
            socket.emit("response", {
              message: "this appoitment is deleted successfuly",
            });
          } else {
            socket.emit("response", {
              message: "you dont rights to controll others appointments",
            });
          }
        } else {
          socket.emit("response", {
            message: "This appointemnt is not exist",
          });
        }
      }
    } catch (error) {
      socket.emit("response", { message: error.message });
    }
  },
};
