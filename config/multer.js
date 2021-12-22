const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(
      {
        message: "unsupported file formate",
      },
      false
    );
  }
};
const upload = multer({
  storage: storage,
  limits: { fileSize: 1048576 },
  fileFilter: fileFilter,
});

module.exports = upload;
