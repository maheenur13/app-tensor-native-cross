import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Image } from "react-native";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export default function CameraApp() {
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [objectDetected, setObjectDetected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const detectObjects = async () => {
    if (cameraRef && !isDetecting) {
      setIsDetecting(true);
      const photo = await cameraRef.takePictureAsync();
      const resizedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [],
        { compress: 0.5 }
      );
      const model = await cocoSsd.load();
      const predictions = await model.detect(resizedPhoto.uri as any);
      if (predictions.length > 0) {
        setObjectDetected(predictions[0].class as any);
      } else {
        setObjectDetected("No object detected");
      }
      setIsDetecting(false);
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "red" }}>
      <Camera
        style={{ flex: 1 }}
        // type={Camera.Constants.Type}
        ref={(ref) => setCameraRef(ref)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 0.1,
              alignSelf: "flex-end",
              alignItems: "center",
            }}
            onPress={detectObjects}
          >
            <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
              {" "}
              Detect{" "}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
      {objectDetected && (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 20, color: "red" }}>Detected Object:</Text>
          <Text style={{ fontSize: 18, marginTop: 10, color: "red" }}>
            {objectDetected}
          </Text>
        </View>
      )}
    </View>
  );
}
