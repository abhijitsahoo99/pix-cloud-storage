import React, {useState, useEffect} from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import UploadPage from './pages/UploadPage';


export default function App() {
  const Stack = createNativeStackNavigator();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load fonts
        await Font.loadAsync({
          'KumbhSans-Bold': require('./assets/fonts/KumbhSans-Bold.ttf'),
          'InriaSerif-Regular': require('./assets/fonts/InriaSerif-Regular.ttf'),
          // Load other fonts here
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        // Simulate a delay for the splash screen
        setTimeout(() => setShowSplashScreen(false), 2000); // Adjust time as needed
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" />;
  }

  if (showSplashScreen) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen  name='Home' component={HomePage} options={{ headerShown: false }}/>
        <Stack.Screen  name='Scan' component={ScanPage} options={{ headerShown: false }}/>
        <Stack.Screen  name='Upload' component={UploadPage} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });