import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { fetch } from "@tensorflow/tfjs-react-native";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

// wrap the camera component with tensor flow.js
const TensorCamera = cameraWithTensors(Camera);

export default function Tensor() {
  const [hasPermission, setHasPermission] = useState<any>(null);
  const [isModelReady, setIsModelReady] = useState<any>(false);
  const [objectDetected, setObjectDetected] = useState<any>("");
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      setIsModelReady(true);
    })();
  }, []);

  const handleCameraStream = async (
    images: IterableIterator<tf.Tensor3D>,
    updatePreview: () => void,
    gl: any
  ) => {
    const loop = async () => {
      if (!isModelReady || !images) return;
      const imageTensor = images.next().value;
      if (!imageTensor) return;

      const predictions = await model?.detect(imageTensor);

      if (predictions && predictions.length > 0) {
        const scores = predictions.map((prediction) => prediction.score);
        const bboxes = predictions.map((prediction) => prediction.bbox);
        const indicesTensor = await tf.image.nonMaxSuppressionAsync(
          bboxes,
          scores,
          20,
          0.5
        );
        const indices = await indicesTensor.array();
        // tf.dispose(indicesTensor);
        const detectedObjects = indices.map(
          (index) => predictions[index].class
        );
        setObjectDetected(detectedObjects.join(", "));
      } else {
        setObjectDetected("No object detected");
      }

      tf.dispose(imageTensor);
      requestAnimationFrame(loop);
    };
    loop();
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <TensorCamera
        useCustomShadersToResize
        style={{ flex: 1 }}
        type={Camera.Constants.Type.back}
        cameraTextureHeight={1200}
        cameraTextureWidth={1600}
        resizeHeight={300}
        resizeWidth={400}
        resizeDepth={3}
        onReady={handleCameraStream}
        autorender={true}
      />
      <View
        style={{ alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        <Text style={{ fontSize: 20 }}>Detected Object:</Text>
        <Text style={{ fontSize: 18, marginTop: 10 }}>{objectDetected}</Text>
      </View>
    </View>
  );
}
