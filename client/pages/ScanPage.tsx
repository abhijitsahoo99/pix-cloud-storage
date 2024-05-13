import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { CameraView , useCameraPermissions, PermissionStatus } from 'expo-camera/next';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Scan: undefined;
  Upload: undefined;
};

type ScanPageProps = {
  navigation: StackNavigationProp<RootStackParamList, "Scan">;
};

type QRCodeScanningResult = {
    type: string;
    data: string;
  };


const ScanPage: React.FC<ScanPageProps> = ({ navigation }) => {
    const [permissions, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
  
    useEffect(() => {
      (async () => {
        if (!permissions) {
          await requestPermission();
        }
      })();
    }, [permissions, requestPermission]);
  
    const handleBarCodeScanned = async ({ type, data }: QRCodeScanningResult) => {
      setScanned(true);
      try {
        const { token, serverUrl } = JSON.parse(data);
        if (token && serverUrl) {
          await AsyncStorage.setItem('apiToken', token);
          await AsyncStorage.setItem('serverUrl', serverUrl);

          alert('API Token and Server URL have been saved successfully!');
        } else {
          alert('QR Code does not contain the necessary information.');
        }
      } catch (error) {
        console.log(error);
        alert('Failed to parse the QR Code. Please ensure it is correct and try again.');
      }
    };
  
    if (!permissions) {
      return <Text>Requesting for camera permissions...</Text>;
    }
  
    if (permissions.status !== PermissionStatus.GRANTED) {
      return <Text>No access to camera</Text>;
    }  


  return (
    <View style={styles.container}>
   
      <CameraView
            style={{ flex: 1, width: "100%" , height: "80%"}}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: ['qr'],
             }}>
        </CameraView>
      <View style={styles.bolderBorder}></View>
      {/* Logo and Text */}
      <View style={styles.textContainer}>
        <Text style={styles.logoText}>Scan QR Code.</Text>
        <Text style={styles.descriptionText}>
          Once your server is storage server is deployed, it will display a QR
          code.
        </Text>
      </View>
      {/* Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Upload")}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Deploy a Storage Server</Text>
        <View style={styles.iconPadding}>
          <Feather name="arrow-up-right" size={15} color="black" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 20,
    backgroundColor: "#f5ede3",
    justifyContent: "center",
  },
  bolderBorder: {
    alignSelf: "stretch",
    borderTopWidth: 2,
    borderColor: "#4b4b4b",
    marginBottom: 20,
  },
  textContainer: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  logoText: {
    fontFamily: "KumbhSans-Bold",
    fontSize: 45,
    marginLeft: 10,
    marginBottom: 10,
    paddingLeft: 10,
    paddingTop: 20,
  },
  descriptionText: {
    fontSize: 23,
    fontFamily: "InriaSerif-Regular",
    marginLeft: 10,
    paddingLeft: 10,
  },
  button: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#4b4b4b",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    paddingLeft: 70,
    paddingRight: 70,
  },
  iconPadding: {
    // paddingBottom: 1,
    paddingLeft: 2,
  },
  buttonText: {
    fontSize: 22,
    color: "#4b4b4b",
    fontFamily: "InriaSerif-Regular",
  },
});
export default ScanPage;
