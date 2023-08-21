const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');

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
        const buttonIndex = req.body.buttonIndex;
        const { filename, path: imagePath } = req.file;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const imageName = `${year}_${month}_${day}_${buttonIndex}.jpg`;

        const imageFolder = path.join(
            __dirname,
            `client/src/assets/carimages`
        );

        if (!fs.existsSync(imageFolder)) {
            fs.mkdirSync(imageFolder, { recursive: true });
        }

        const newImagePath = path.join(
            imageFolder,
            imageName
        );

        fs.renameSync(imagePath, newImagePath);

        res.status(200).json({ message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Error uploading image' });
    }
});

app.post('/send-email', async (req, res) => {
    try {
        const { fullName, email, latitude, longitude, city, region } = req.body;
        const imageFiles = fs.readdirSync(path.join(__dirname, 'client/src/assets/carimages'));

        const attachments = imageFiles.map((imageName, index) => {
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

        transporter.sendMail(
            {
                from: `Rac4less ${config.email}`,
                to: 'rentacar4lessfll@gmail.com',
                subject: `Car Walk Around from ${fullName}`,
                html: `<h1>Walk Around 4less</h1>
      <p>City: ${city} | Region: ${region} | Latitude and longitude: ${latitude},${longitude} (paste it on Google Maps) | The following information was submitted by ${fullName} on ${new Date()} with email: ${email} using Walk around 4less: a website to easily send the information about the rented vehicle before using it. 
      By sending this email, the user guarantees that he accepts the <a href="https://drive.google.com/file/d/1qUzcF3mbIv1VS_lODQLAFWSKohfGUXw0/view" target="_blank" rel="noopener noreferrer">terms and conditions</a> in which the vehicle is located, and also provides evidence of the car before using it.</p>`,
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
        const imageFolder = path.join(__dirname, 'client/src/assets/carimages');
        const imageFiles = fs.readdirSync(imageFolder);

        imageFiles.forEach((imageName) => {
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
