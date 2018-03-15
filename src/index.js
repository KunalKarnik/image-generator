import express from 'express';
import gm from 'gm';
// import request from "request"
import { map, has } from 'lodash';
import redis from 'redis';
import bluebird from 'bluebird';
import bodyParser from 'body-parser';
import uuidv4 from 'uuid/v4';
import yup from 'yup';

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient({ host: process.env.DATA_REDIS_HOST, port: 6379 });

// const goat = "http://cdn.playbuzz.com/cdn/c1ffedc1-2f64-4503-8c91-689bb8c48218/8325ab64-99f2-4ce1-9da3-c98b8ae7e395.jpg"

const app = express();
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.post('/registerData', async (req, res) => {
  // generate uuid
  const id = uuidv4();
  // write JSON data to redis
  if (!req.body) {
    return res.send('No valid body payload');
  }
  // in the future validate the payload with YUP
  await client.setAsync(id, JSON.stringify(req.body), 'EX', 86400);
  return res.send(id);
});

app.post('/registerTemplate', async (req, res) => {
  // generate uuid
  const id = uuidv4();
  // write JSON data to redis
  if (!req.body) {
    return res.send('No valid body payload');
  }

  const topSchema = yup.object().shape({
    fields: yup.object().required(),
    base: yup.object().shape({
      source: yup
        .string()
        .url()
        .required(),
    }),
    style: yup.object().shape({
      size: yup
        .number()
        .positive()
        .required(),
    }),
  });

  const topSchemaValid = await topSchema.isValid(req.body);
  if (!topSchemaValid) {
    return res.send('Template definition does not meet required schema');
  }

  const xySchema = yup.object().shape({
    x: yup
      .number()
      .positive()
      .required(),
    y: yup
      .number()
      .positive()
      .required(),
  });
  map(req.body.fields, async (value, key) => {
    const xySchemaValid = await xySchema.isValid(value);
    if (!xySchemaValid) {
      return res.send(`${key} is not valid xy definition`);
    }
  });

  // in the future validate the payload with YUP
  await client.setAsync(id, JSON.stringify(req.body), 'EX', 31536000);
  return res.send(id);
});

app.get('/generate', async (req, res) => {
  // get data from redis
  const rdata = await client
    .multi()
    .get(req.query.data)
    .get(req.query.template)
    .execAsync();
  if (!rdata[0]) {
    return res.send('template not found');
  }
  const data = JSON.parse(rdata[0]);

  if (!rdata[1]) {
    return res.send('data not found');
  }
  const template = JSON.parse(rdata[1]);

  res.set('Content-Type', 'image/png');

  const imageStream = gm(template.base.source);
  // console.log(template)
  if (template.style && template.style.size) {
    // only supporting this one font for now.
    imageStream.font('Roboto-Regular.ttf', template.style.size);
  }
  map(data, (value, key) => {
    if (has(template.fields, key)) {
      imageStream.drawText(template.fields[key].x, template.fields[key].y, value);
    }
  });
  imageStream
    .setFormat('png')
    .stream()
    .pipe(res);
});

app.get('/', (req, res) => res.send('Hello World!'));
app.listen(8080, '0.0.0.0', () => console.log('Example app listening on port 8080!'));
