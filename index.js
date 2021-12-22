const express = require("express");
const app = express();
const port = 5000 || process.env.PORT;
const Pool = require("pg").Pool;
const fetch = require("node-fetch");
const cloudinary = require("./config/cloudinary");
const upload = require("./config/multer");
const fs = require("fs");
const formData = require("form-data");
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const pool = new Pool({
  user: process.env.user,
  host: process.env.host,
  database: process.env.database,
  password: process.env.password,
  port: 5432,
});

app.get("/hello", (req, res) => {
  res.send("hello");
});

app.get("/getproducts", (req, res) => {
  pool.query(`select * from crud_ecommerce`, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("internal server error");
    }
    return res.status(200).json(result.rows);
  });
});
app.post("/createproduct", upload.array("image"), (req, res) => {
  const { name, details, price } = req.body;
  if (!name || !details || !price)
    return res.status(403).json({
      success: 0,
      message: "enter all details",
    });
  const form = new formData();
  for (const file of req.files) {
    const buffer = fs.readFileSync(file.path);
    form.append("image", buffer, {
      contentType: file.mimetype,
      name: "image",
      filename: file.originalname,
    });
  }
  let imageurl;
  fetch("http://localhost:5000/image-uploads", {
    method: "POST",
    body: form,
  })
    .then((res) => res.json())
    .then((data) => {
      imageurl = data;
      console.log(imageurl.data);
      pool.query(
        "insert into crud_ecommerce (name,details,price,images) values($1,$2,$3,$4)",
        [name, details, price, imageurl.data],
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "internal server error" });
          }
          return res.status(200).json({
            success: 1,
            message: "product added",
          });
        }
      );
    })
    .catch((err) => console.log(err));
});
app.put("/updateproduct", (req, res) => {
  const { name, details, price, id } = req.body;
  if (!name || !details || !price || !id)
    return res.status(403).json({
      success: 0,
      message: "enter all details",
    });
  pool.query(
    "update crud_ecommerce set name=$1,details=$2,price=$3 where id=$4",
    [name, details, price, id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("internal server error");
      }
      return res.status(200).json({
        success: 1,
        message: "product updated",
      });
    }
  );
});
app.delete("/deleteproduct", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(403).json({
      success: 0,
      message: "enter id to delete",
    });
  }
  pool.query("delete from crud_ecommerce where id=$1", [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("internal server error");
    }
    return res.status(200).json({
      success: 1,
      message: "product deleted",
    });
  });
});

app.use("/image-uploads", upload.array("image"), async (req, res) => {
  const uploader = async (path) => await cloudinary.upload(path, "Images");

  if (req.method === "POST") {
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }
    return res.status(200).json({
      message: "images uploaded",
      data: urls,
    });
  } else {
    return res.status(405).json({
      err: `${req.method} method is not allowed`,
    });
  }
});
app.listen(port, () => {
  console.log(`app started at port ${port}`);
});
