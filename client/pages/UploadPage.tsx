import React, { useState, useEffect } from 'react';
import { Share, View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp} from '@react-navigation/stack';
import { Video } from 'expo-av';

// Define the types for your navigation stack
type RootStackParamList = {
  Upload: undefined; // Add other screens as needed
};

type UploadPageProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Upload'>;
};


const UploadPage: React.FC<UploadPageProps> = ({ navigation }) => {
  const [selectedFiles, setSelectedFiles] = useState<ImagePicker.Asset[]>([]);
  const [apiToken, setApiToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: (string | Video.Props)[] }>({});
  const [selectedFileIndices, setSelectedFileIndices] = useState<{ [key: string]: boolean[] }>({});
  const [showActionPopup, setShowActionPopup] = useState<boolean>(false);
  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);


  useEffect(() => {
    const fetchStoredData = async () => {
      const storedApiToken = await AsyncStorage.getItem('apiToken');
      const storedServerUrl = await AsyncStorage.getItem('serverUrl');
      const storedFilesJson = await AsyncStorage.getItem('uploadedFiles');
      const storedFiles = storedFilesJson ? JSON.parse(storedFilesJson) : {};

      if (storedApiToken && storedServerUrl) {
        setApiToken(storedApiToken);
        setServerUrl(storedServerUrl);
      }
      setUploadedFiles(storedFiles);
    };

    fetchStoredData();
  }, []);

  useEffect(() => {
    const selectedCount = Object.values(selectedFileIndices).flat().filter(Boolean).length;
    setShowActionPopup(selectedCount > 0);
  }, [selectedFileIndices]);

  const handleFileSelection = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
    });

    if (!result.cancelled) {
      setSelectedFiles(result.assets);
      setShowUploadButton(true); // Show the "Upload Files" button
    }
  };


  const handleFileUpload = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((asset) => {
        formData.append('files', {
          uri: asset.uri,
          name: asset.fileName || (asset.type === 'video' ? 'video.mp4' : 'image.jpg'),
          type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        } as any);
      });
  
      const response = await fetch(`${serverUrl}api/v1/upload-file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        body: formData,
      });
  
      const data = await response.json();
      if (data.success) {
        const today = new Date().toISOString().split('T')[0];
        const files = data.files.map((file: { location: any; }) => ({
          uri: file.location,
          type: file.location.endsWith('.mp4') ? 'video' : 'image',
        }));
        const newFiles = uploadedFiles[today] ? [...uploadedFiles[today], ...files] : files;
        const updatedFiles = { ...uploadedFiles, [today]: newFiles };
        setUploadedFiles(updatedFiles);
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
        setSelectedFileIndices((prevSelectedFileIndices) => ({
          ...prevSelectedFileIndices,
          [today]: newFiles.map(() => false),
        }));
        setSelectedFiles([]); 
        setShowUploadButton(false); 
      }
    } catch (err) {
      console.error('Error uploading files:', err);
    } finally {
      setIsUploading(false);
      Alert.alert('Upload Status', 'Files have been uploaded successfully!');
    }
  };
  
       

  const handleDateCheckmarkPress = (date: string) => {
    setSelectedFileIndices((prevSelectedFileIndices) => {
      const allSelected = prevSelectedFileIndices[date]?.every((selected) => selected);
      return {
        ...prevSelectedFileIndices,
        [date]: prevSelectedFileIndices[date]?.map(() => !allSelected) || [],
      };
    });
  };

  const handleFilePress = (date: string, index: number) => {
    setSelectedFileIndices((prevSelectedFileIndices) => {
      const updatedSelections = [...(prevSelectedFileIndices[date] || [])];
      updatedSelections[index] = !updatedSelections[index];
      return {
        ...prevSelectedFileIndices,
        [date]: updatedSelections,
      };
    });
  };

  const getSelectedFilesCount = () => {
    return Object.values(selectedFileIndices).flat().filter(Boolean).length;
  };

  const handleShare = async () => {
    const selectedFileUrls = Object.entries(selectedFileIndices)
      .flatMap(([date, selections]) =>
        selections.map((selected, index) => (selected ? uploadedFiles[date][index] : null)).filter(Boolean)
      );

    try {
      await Share.share({
        message: `Check out these files: ${selectedFileUrls.join(', ')}`,
      });
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    Alert.alert(
      'Delete Files',
      'Are you sure you want to delete the selected files?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const fileKeysToDelete = Object.entries(selectedFileIndices)
              .flatMap(([date, selections]) =>
                selections.map((selected, index) => (selected ? uploadedFiles[date][index] : null)).filter(Boolean)
              )
              .map((file: { uri: string; type: string; }) => {
                const parts = file.uri.split('/');
                const lastPart = parts[parts.length - 1];
                return decodeURIComponent(lastPart);
              });
  
            try {
              const token = await AsyncStorage.getItem('apiToken');
              const serverUrl = await AsyncStorage.getItem('serverUrl');
  
              const response = await fetch(`${serverUrl}api/v1/delete-file`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ fileKeys: fileKeysToDelete }),
              });
  
  
              if (response.ok) {
                const responseData = await response.json();
                setIsDeleting(false);
  
                const updatedFiles = { ...uploadedFiles };
                const updatedSelections = { ...selectedFileIndices };
  
                Object.entries(selectedFileIndices).forEach(([date, selections]) => {
                  const updatedDateFiles = uploadedFiles[date].filter((_, index) => !selections[index]);
                  const updatedDateSelections = selections.filter((selected) => !selected);
  
                  if (updatedDateFiles.length === 0) {
                    delete updatedFiles[date];
                    delete updatedSelections[date];
                  } else {
                    updatedFiles[date] = updatedDateFiles;
                    updatedSelections[date] = updatedDateSelections;
                  }
                });
  
                setUploadedFiles(updatedFiles);
                setSelectedFileIndices(updatedSelections);
                await AsyncStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
                Alert.alert('Success', 'Files deleted successfully');
              } else {
                const errorData = await response.json();
                console.error('Error deleting files:', errorData);
                Alert.alert('Error', 'Failed to delete files. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting files:', error);
              Alert.alert('Error', 'Failed to delete files. Please try again.');
            }
          },
        },
      ]
    );
  };


  const renderFile = (file: { uri: string; type: string; }, date: string, index: number) => {
    if (file.type === 'image') {
      // Render image
      return (
        <TouchableOpacity key={index} onPress={() => handleFilePress(date, index)}>
          <View style={styles.fileWrapper}>
            <Image source={{ uri: file.uri }} style={styles.image} />
            {selectedFileIndices[date]?.[index] && (
              <View style={styles.fileCheckmarkContainer}>
                <MaterialCommunityIcons name="check" size={16} color="black" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    } else {
      // Render video
      return (
        <TouchableOpacity key={index} onPress={() => handleFilePress(date, index)}>
          <View style={styles.fileWrapper}>
            <Video source={{ uri: file.uri }} style={styles.video} useNativeControls resizeMode="cover" />
            {selectedFileIndices[date]?.[index] && (
              <View style={styles.fileCheckmarkContainer}>
                <MaterialCommunityIcons name="check" size={16} color="black" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }
  };
          

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.logo}>PiX</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {Object.entries(uploadedFiles).map(([date, files], index) => (
          <View key={index} style={styles.entry}>
            <View style={styles.dateContainer}>
              <Text style={styles.date}>{date}</Text>
              <TouchableOpacity
                style={[
                  styles.checkmarkButton,
                  selectedFileIndices[date]?.every((selected) => selected) && styles.checkmarkButtonSelected,
                ]}
                onPress={() => handleDateCheckmarkPress(date)}
              >
                {selectedFileIndices[date]?.every((selected) => selected) && (
                  <MaterialCommunityIcons name="check" size={16} color="black" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.fileContainer}>
              {files.map((file, fileIndex) => renderFile(file, date, fileIndex))}
            </View>
          </View>
        ))}
        {isUploading && (
          <View style={styles.uploadingContainer}>
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
         {isDeleting && (
          <View style={styles.uploadingContainer}>
            <Text style={styles.uploadingText}>Deleting...</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleFileSelection}>
        <Text style={styles.buttonText}>Select Files</Text>
      </TouchableOpacity>

      {showUploadButton && (
        <TouchableOpacity style={styles.button} onPress={handleFileUpload}>
          <Text style={styles.buttonText}>Upload Files</Text>
        </TouchableOpacity>
      )}

      {showActionPopup && (
        <View style={styles.actionPopup}>
          <Text style={styles.actionPopupText}>{getSelectedFilesCount()} item selected</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: '#f5ede3',
  // },
  container: {
    flex: 1,
    backgroundColor: '#f5ede3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f5ede3',
    marginTop: 25,
  },
  backButton: {
    position: 'absolute',
    left: 5,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  logo: {
    fontFamily: 'KumbhSans-Bold',
    fontSize: 24,
  },
  scrollView: {
    marginVertical: 20,
  },
  entry: {
    marginBottom: 20,
    paddingLeft: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  date: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 18,
  },
  checkmarkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4b4b4b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  checkmarkButtonSelected: {
    backgroundColor: 'white',
  },
  fileContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  fileWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 120,
    height: 150,
  },
  video: {
    width: 120,
    height: 150,
  },
  fileCheckmarkContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderWidth: 1,
    borderColor: '#4b4b4b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
    marginLeft: 50,
    marginRight: 50,
  },
  buttonText: {
    fontSize: 22,
    color: '#4b4b4b',
    fontFamily: 'InriaSerif-Regular',
  },
  uploadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  uploadingText: {
    fontSize: 20,
    color: '#4b4b4b',
  },
  actionPopup: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  actionPopupText: {
    fontSize: 18,
    fontFamily: 'InriaSerif-Regular',
    color: '#4b4b4b',
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#4b4b4b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 18,
    color: '#4b4b4b',
    fontFamily: 'InriaSerif-Regular',
  },
});

export default UploadPage;