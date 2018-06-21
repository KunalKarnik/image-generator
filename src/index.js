import express from 'express';
import gm from 'gm';
import { map, has } from 'lodash';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

// Image manipulation

//TODO: add the other forms to the staticForms folder and names to this list.
const forms = {
  EngVR: "http://127.0.0.1:8080/federal-voter-registration_1-25-16_english_200.png",
  goat: "http://cdn.playbuzz.com/cdn/c1ffedc1-2f64-4503-8c91-689bb8c48218/8325ab64-99f2-4ce1-9da3-c98b8ae7e395.jpg"
}

app.post('/voteregeng', (req, res) => {

  const imageStream = gm(forms.goat);

  res.set('Content-Type', 'image/png');

  imageStream
    .setFormat('png')
    .stream()
    .pipe(res);


    // write information to fill the form

  /*
  baseForm.font('Roboto-Regular.ttf', 20);

    /*

      map(data, (value, key) => {
    if (has(template.fields, key)) {
      baseForm.drawText(template.fields[key].x, template.fields[key].y, value);
    }
  });

    */


});

app.post('/test', (req, res) => {
  res.send("Alive");
});

app.get('/', (req, res) => res.send('Hello World!'));

app.use(express.static('staticForms'));

app.listen(8080, '0.0.0.0', () => console.log('App running on port 8080!'));