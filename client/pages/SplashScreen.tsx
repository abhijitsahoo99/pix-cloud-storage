// SplashScreen.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Font from 'expo-font';

const SplashScreen: React.FC = () => {
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'KumbhSans-Bold': require('../assets/fonts/KumbhSans-Bold.ttf'),
      });
    }

    loadFonts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>PiX</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5ede3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'KumbhSans-Bold',
    fontSize: 60,
  },
});

export default SplashScreen;
