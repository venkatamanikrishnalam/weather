const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 5000;

const path = require('path');

// Serve HTML files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'getWeather.html'));
});

app.get('/modifyWeather', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'modifyWeather.html'));
});

const dbURL = "mongodb://localhost:27017"; // MongoDB connection URL
const dbName = "weather_db"; 

// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB
let db;
MongoClient.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to Database');
        db = client.db(dbName);
    })
    .catch(error => console.error('Error connecting to MongoDB:', error));

// 1. Get weather for a specific city
app.get('/getWeather/:city', (req, res) => {
    const city = req.params.city;

    db.collection('cities')
        .findOne({ city })
        .then(result => {
            if (!result) {
                return res.status(404).json({ error: 'City not found' });
            }
            res.json(result);
        })
        .catch(error => {
            console.error('Error fetching city:', error);
            res.status(500).json({ error: 'Failed to fetch city data' });
        });
});

// 2. Update weather of a specific city
app.put('/updateCity/:city', (req, res) => {
    const city = req.params.city;
    const updatedWeather = req.body;

    db.collection('cities').updateOne({ city }, { $set: updatedWeather })
        .then(result => {
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'City not found' });
            }
            res.json({ message: 'City weather updated successfully' });
        })
        .catch(error => {
            console.error('Error updating city:', error);
            res.status(500).json({ error: 'Failed to update city' });
        });
});

// 3. Add a new city
app.post('/addCity', (req, res) => {
    const newCity = req.body;

    db.collection('cities').insertOne(newCity)
        .then(result => {
            res.status(201).json({ _id: result.insertedId, ...newCity });
        })
        .catch(error => {
            console.error('Error adding city:', error);
            res.status(500).json({ error: 'Failed to add city' });
        });
});

// Delete a city route
app.delete('/removeCity/:city', (req, res) => {
  const cityName = req.params.city;

  db.collection('cities').deleteOne({ city: cityName }) // Adjust the query according to your document structure
      .then(result => {
          if (result.deletedCount === 0) {
              return res.status(404).json({ error: 'City not found' });
          }
          console.log('City Deleted:', cityName);
          res.status(200).json({ message: 'City deleted successfully' });
      })
      .catch(error => {
          console.error('Error deleting city:', error);
          res.status(500).json({ error: 'Failed to delete city', details: error });
      });
});

// 5. Display all weather data
app.get('/displayAllWeather', (req, res) => {
    db.collection('cities').find().toArray()
        .then(results => {
            res.json(results);
        })
        .catch(error => {
            console.error('Error fetching all cities:', error);
            res.status(500).json({ error: 'Failed to fetch data for all cities' });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
