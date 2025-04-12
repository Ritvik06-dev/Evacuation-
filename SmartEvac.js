import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showRoute, setShowRoute] = useState(false);

  // Define a mock safe zone (a sample hospital nearby)
  const safeZone = {
    latitude: 37.78845,
    longitude: -122.4324,
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const handleAlert = async () => {
    Alert.alert("🚨 Emergency Alert!", "Route to nearest safe zone is shown.");
    setShowRoute(true);

    if (location) {
      try {
        const response = await fetch("http://<YOUR-IP-OR-NGROK-LINK>:5000/trigger-alert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        });

        const data = await response.json();
        console.log("Backend response:", data);
      } catch (error) {
        console.error("Error sending location to backend:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Smart Evacuation App</Text>

      <Button title="Send Emergency Alert" onPress={handleAlert} color="#e63946" />

      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* User Marker */}
          <Marker
            coordinate={location}
            title="You are here"
            pinColor="red"
          />

          {/* Safe Zone Marker */}
          <Marker
            coordinate={safeZone}
            title="Safe Zone"
            description="Nearby Hospital"
            pinColor="green"
          />

          {/* Draw Route */}
          {showRoute && (
            <Polyline
              coordinates={[location, safeZone]}
              strokeColor="#1d3557"
              strokeWidth={4}
            />
          )}
        </MapView>
      ) : (
        <Text style={{ marginTop: 20 }}>{errorMsg || "Fetching location..."}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1faee',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  map: {
    width: '90%',
    height: 400,
    marginTop: 20,
    borderRadius: 12,
  },
});
