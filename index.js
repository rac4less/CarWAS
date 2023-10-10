const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');

//Alternative config.json
//"email": "gabriel.jeannot.personal@gmail.com",
//"Pass": "kylgvxsmugnunbvg"

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'client/src/assets/carimages' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email,
        pass: config.Pass,
    },
});

app.use(express.static(path.join(__dirname, 'client')));

app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        const imageName = req.body.imageName;
        const { path: imagePath } = req.file;

        const imageFolder = path.join(__dirname, 'client/src/assets/carimages');

        if (!fs.existsSync(imageFolder)) {
            fs.mkdirSync(imageFolder, { recursive: true });
        }

        const newImagePath = path.join(imageFolder, imageName);

        fs.renameSync(imagePath, newImagePath);

        res.status(200).json({ message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Error uploading image' });
    }
});

app.post('/send-email', async (req, res) => {
    try {
        const { fullName, email, latitude, longitude, city, region, userId } = req.body;
        const imageFiles = fs.readdirSync(path.join(__dirname, 'client/src/assets/carimages'));

        const attachments = imageFiles
            .filter(imageName => imageName.startsWith(userId))
            .map((imageName, index) => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hour = String(now.getHours()).padStart(2, '0');
                const minute = String(now.getMinutes()).padStart(2, '0');
                return {
                    filename: `${year}_${month}_${day}_${hour}_${minute}_${index + 1}.jpg`,
                    path: path.join(__dirname, 'client/src/assets/carimages', imageName),
                };
            });

        const termsAndConditions = fs.readFileSync('t&c.txt', 'utf8');

        var maillist = [
            'rentacar4lessfll@gmail.com',
            `${email}`,
        ];

        transporter.sendMail(
            {
                from: `Rac4less ${config.email}`,
                to: maillist,
                subject: `Car Walk Around from ${fullName}`,
                html: `<h1>Walk Around 4less</h1>
      <p>City: ${city} | Region: ${region} | Latitude and longitude: ${latitude},${longitude} (it might not be precise) | This email is sent as confirmation of the car walk around process done by ${fullName} on ${new Date()} with email: ${email} using Walk around 4less: a website to easily send the information about the rented vehicle before using it. 
      By sending this email, the user guarantees that he accepts the <a href="https://drive.google.com/file/d/1LoJia2xn7Jufgd7H4MkftmXZa2ptSiQ6/view?usp=sharing" target="_blank" rel="noopener noreferrer">terms and conditions</a> in which the vehicle is located, and also provides evidence of the car before using it.</p>
      <p style="font-size: smaller">${termsAndConditions}</p>`,
                attachments,
            },
            (err, info) => {
                if (err) {
                    console.error('Error sending email in backend:', err);
                    res.status(500).json({ status: 'Error sending email in the backend' });
                } else {
                    res.json({ status: info.response });
                }
            }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ status: 'Error sending email', error: error.message });
    }
});

app.post('/delete-images', async (req, res) => {
    try {
        const userId = req.body.userId;
        const imageFolder = path.join(__dirname, 'client/src/assets/carimages');
        const imageFiles = fs.readdirSync(imageFolder);

        imageFiles
            .filter(imageName => imageName.startsWith(userId))
            .forEach((imageName) => {
                const imagePath = path.join(imageFolder, imageName);
                fs.unlinkSync(imagePath);
            });

        res.status(200).json({ message: 'Images deleted successfully' });
    } catch (error) {
        console.error('Error deleting images:', error);
        res.status(500).json({ message: 'Error deleting images' });
    }
});

app.listen(7000, () => console.log('Running on 7000'));
