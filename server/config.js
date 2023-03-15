import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
const DB = new Sequelize(
  `${process.env.DB_NAME}`,
  `${process.env.DB_USERNAME}`,
  `${process.env.DB_PASS}`,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
  }
);

try {
  await DB.authenticate();
  console.log("db connected");
} catch (err) {
  console.log("error db connection");
}

export default DB;
