import React, { PureComponent } from 'react';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import { TouchableOpacity, Alert, StyleSheet, View } from 'react-native';

export default class Camera extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      takingPic: false,
    };
  }

  takePicture = async () => {
    if (this.camera && !this.state.takingPic) {
      let options = {
        quality: 0.85,
        fixOrientation: true,
        forceUpOrientation: true,
      };

      this.setState({ takingPic: true });

      try {
        const data = await this.camera.takePictureAsync(options);
        Alert.alert('Success', JSON.stringify(data));
      } catch (err) {
        Alert.alert('Error', 'Failed: ' + (err.message || err));
      } finally {
        this.setState({ takingPic: false });
      }
    }
  };

  render() {
    return (
      <RNCamera
        ref={ref => { this.camera = ref; }}
        style={{ flex: 1 }}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
      >
        <View style={styles.btnAlignment}>
          <TouchableOpacity onPress={this.takePicture}>
            <Icon name="camera" size={50} color="#fff" />
          </TouchableOpacity>
        </View>
      </RNCamera>
    );
  }
}

const styles = StyleSheet.create({
  btnAlignment: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
});
