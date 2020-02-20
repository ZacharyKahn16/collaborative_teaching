import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import asyncHandler from 'express-async-handler';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/env', (req, res, next) => {
  return res.send(process.env);
});

app.get('/env', (req, res, next) => {
  return res.send(process.env);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.debug(`Server started at http://localhost:${PORT}`);
});
