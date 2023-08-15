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
        const { fullName, email } = req.body;

        // Obtener las imágenes que ya se han subido al servidor a través de /upload-image
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
                to: 'gabriel.jeannot@uao.edu.co',
                subject: `Car Walk Around from ${fullName}`,
                html: `<h1>CarWAS - Car Walk Around System</h1>
            <p>The following information was submitted by ${fullName} on ${new Date()} with email: ${email}, using Walk Around 4less: a website to easily send the information about the rented vehicle before using it. This software was developed for Rent a car 4 less by Gabriel Jeannot.</p>`,
                attachments,
            },
            (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                    res.status(500).json({ status: 'Error sending email' });
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

app.listen(7000, () => console.log('Running on 7000'));
