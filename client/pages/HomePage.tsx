import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the types for your navigation stack
type RootStackParamList = {
  Home: undefined; // Add other screens as needed, e.g., 'Scan': undefined;
  Scan: undefined;
};

type HomePageProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const HomePage: React.FC<HomePageProps>= ({ navigation }) => {
    return (
        <View style={styles.container}>
            {/* Logo and Text */}
            <View style={styles.textContainer}>
                <Text style={styles.logoText}>PiX</Text>
                <Text style={styles.descriptionText}>Share uncompressed files with a perma-link</Text>
            </View>
            {/* Button */}
            <TouchableOpacity onPress={() => navigation.navigate("Scan")} style={styles.button}>
                <Text style={styles.buttonText}>Connect to a bucket</Text>
            </TouchableOpacity>
        </View>
      );
};

const styles = StyleSheet.create({
    container : {
        flex:1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5ede3',
        justifyContent :  'center'
    },
    textContainer : {
        alignSelf: 'stretch',
        alignItems: 'flex-start',
        marginBottom: 40
    },
    logoText: {
        fontFamily: 'KumbhSans-Bold',
        fontSize: 50,
        marginLeft: 30,
        marginBottom: 10
    },
    descriptionText: {
        fontSize: 23,
        fontFamily: 'InriaSerif-Regular',
        marginLeft: 30,
    },
    button: {
        borderWidth : 1,
        borderColor :'#4b4b4b',
        padding : 10,
        borderRadius : 10,
        alignItems: 'center',
        paddingLeft: 75,
        paddingRight: 75,
    },
    buttonText : {
        fontSize : 22,
        color : '#4b4b4b',
        fontFamily: 'InriaSerif-Regular',
    }
});
export default HomePage;