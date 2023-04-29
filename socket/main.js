const serviceCTRl = require("../controllers/service");
const teacherCTRl = require("../controllers/teacher");
const aptCTRl = require("../controllers/appointement");
module.exports.mainSocket = (io, socket) => {
  socket.on("request", async (data) => {
    const { event, body } = data;
    try {
      switch (event) {
        // service module
        case "newService":
          serviceCTRl.newService(body, socket);
          break;
        case "getAllService":
          serviceCTRl.getAllService(body, socket);
          break;
        case "updateServiceById":
          serviceCTRl.updateServiceById(body, socket);
          break;
        case "deleteServiceById":
          serviceCTRl.deleteServiceById(body, socket);
          break;
        case "getServiceByid":
          serviceCTRl.getServiceByid(body, socket);
          break;
        //   teacher module
        case "todayShedule":
          teacherCTRl.todayShedule(body, socket);
          break;
        case "serviceAssign":
          teacherCTRl.serviceAssign(body, socket);
          break;
        // appointemnt module
        case "newAppointement":
          aptCTRl.newAppointement(body, socket);
          break;
        case "appointmentList":
          aptCTRl.appointmentList(body, socket);
          break;
        case "cancelAppoitmentById":
          aptCTRl.cancelAppoitmentById(body, socket);
          break;
        case "deleteAppoitemntById":
          aptCTRl.deleteAppoitemntById(body, socket);
          break;

        default:
          io.emit("response", { message: "This is wrong event" });
          break;
      }
    } catch (error) {
      socket.emit("response", { message: error.message });
    }
  });
};
