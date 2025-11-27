import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import itemService from '../../services/item.service';

export default function AddItemScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'pcs' | 'kg' | 'ltr'>('pcs');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };
const handleSubmit = async () => {
  if (!name || !quantity) {
    Alert.alert('Error', 'Please fill in required fields');
    return;
  }

  setLoading(true);
  try {
    let imageFile;
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      imageFile = {
        uri: imageUri,
        name: filename,
        type,
      };
    }

    const result = await itemService.createItem(
      {
        name,
        sku: sku || undefined,
        description: description || undefined,
        quantity: parseInt(quantity),
        unit,
        category: category || undefined,
        location: location || undefined,
        minThreshold: minThreshold ? parseInt(minThreshold) : undefined,
      },
      imageFile
    );

    // -----------------------------------------
    // 🔥 NEW: Show Tag + QR Code Popup
    // -----------------------------------------
    Alert.alert(
      "Material Created",
      "Material has been added successfully.",
      [
        {
          text: "View Material",
          onPress: () => {
            // support different response shapes (server returns `material`, older clients expect `item`)
            const created = (result as any)?.item || (result as any)?.material || result;
            const id = created?._id || created?._localId;
            if (id) {
              router.push(`/material/item-detail?id=${id}`);
            } else {
              // fallback: just go back if no id available
              router.back();
            }
          }
        },
        {
          text: "OK",
          onPress: () => router.back(),
        }
      ]
    );

  } catch (error: any) {
    Alert.alert('Error', error.response?.data?.error || 'Failed to add material');
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}> 
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              iconColor="#FFFFFF"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8 }}
              accessibilityLabel="Back"
            />

            <Text variant="headlineSmall" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
              Add New Material
            </Text>

            <View style={{ width: 48 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.imageSection}>
              <Text variant="bodyMedium" style={styles.label}>
                Material Image
              </Text>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                  <IconButton
                    icon="close-circle"
                    size={32}
                    iconColor={colors.error}
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  />
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                  <MaterialCommunityIcons name="camera-plus" size={48} color={colors.textMuted} />
                  <Text variant="bodyMedium" style={styles.imagePlaceholderText}>
                    Tap to add image
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              label="Material Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="SKU"
              value={sku}
              onChangeText={setSku}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Quantity *"
              value={quantity}
              onChangeText={setQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <View style={styles.unitContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Unit
              </Text>
              <SegmentedButtons
                value={unit}
                onValueChange={(value) => setUnit(value as 'pcs' | 'kg' | 'ltr')}
                buttons={[
                  { value: 'pcs', label: 'Pieces' },
                  { value: 'kg', label: 'KG' },
                  { value: 'ltr', label: 'Liter' },
                ]}
                style={styles.segmentedButtons}
                theme={{
                  colors: {
                    secondaryContainer: colors.primary,
                    onSecondaryContainer: colors.text,
                  },
                }}
              />
            </View>

            <TextInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Minimum Threshold"
              value={minThreshold}
              onChangeText={setMinThreshold}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Add Material
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
 headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 12
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
  },
  unitContainer: {
    marginVertical: 8,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 16,
     borderWidth: 1,
    borderColor:colors.border,
    marginBottom:12,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
  imageSection: {
    marginBottom: 8,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: colors.textMuted,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.surface + 'CC',
  },
});
