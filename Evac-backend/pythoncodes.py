from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime

# Optional: For SMS
from twilio.rest import Client

app = Flask(__name__)
CORS(app)

# =========================
# Configure Twilio (for SMS)
# =========================
# Get these from https://console.twilio.com/
TWILIO_SID = 'YOUR_TWILIO_SID'
TWILIO_AUTH_TOKEN = 'YOUR_TWILIO_AUTH_TOKEN'
TWILIO_PHONE = 'YOUR_TWILIO_PHONE_NUMBER'
ALERT_RECIPIENTS = ['+919123456789', '+919876543210']  # Numbers to receive SMS

client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

# =========================
# SQLite Setup
# =========================
def init_db():
    conn = sqlite3.connect('alerts.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL,
            longitude REAL,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# =========================
# API Endpoint
# =========================
@app.route('/trigger-alert', methods=['POST'])
def trigger_alert():
    data = request.json
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not latitude or not longitude:
        return jsonify({'status': 'error', 'message': 'Missing location data'}), 400

    timestamp = datetime.datetime.now().isoformat()

    # Save to SQLite
    conn = sqlite3.connect('alerts.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO alerts (latitude, longitude, timestamp) VALUES (?, ?, ?)', 
                   (latitude, longitude, timestamp))
    conn.commit()
    conn.close()

    # Send SMS Alert (optional — comment this block to skip)
    for number in ALERT_RECIPIENTS:
        message = f'🚨 Emergency near your location!\nCoordinates: {latitude}, {longitude}'
        try:
            client.messages.create(
                body=message,
                from_=TWILIO_PHONE,
                to=number
            )
        except Exception as e:
            print(f"Failed to send SMS to {number}: {e}")

    return jsonify({'status': 'success', 'message': 'Alert received and processed'}), 200

# =========================
# Run the server
# =========================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
