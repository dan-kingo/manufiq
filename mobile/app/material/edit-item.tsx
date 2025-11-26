import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import itemService, { Item } from '../../services/item.service';

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'pcs' | 'kg' | 'ltr'>('pcs');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await itemService.getItem(id as string);
      setName(data.name);
      setSku(data.sku || '');
      setDescription(data.description || '');
      setUnit(data.unit);
      setCategory(data.category || '');
      setLocation(data.location || '');
      setMinThreshold(data.minThreshold?.toString() || '');
      setExistingImage(data.image || null);
    } catch (error) {
      console.error('Failed to load material:', error);
      Alert.alert('Error', 'Failed to load material details');
    } finally {
      setLoading(false);
    }
  };

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
    setExistingImage(null);
  };

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Error', 'Material name is required');
      return;
    }

    setSaving(true);
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

      await itemService.updateItem(id as string, {
        name,
        sku: sku || undefined,
        description: description || undefined,
        unit,
        category: category || undefined,
        location: location || undefined,
        minThreshold: minThreshold ? parseInt(minThreshold) : undefined,
      }, imageFile);

      Alert.alert('Success', 'Material updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update material');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

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
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => router.back()}
            textColor={colors.secondary}
            icon={() => <MaterialCommunityIcons name="arrow-left" size={20} color={colors.secondary} />}
          >
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Edit Material
          </Text>
          <View style={{ width: 80 }} />
        </View>

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
              {imageUri || existingImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri || existingImage || '' }} style={styles.imagePreview} resizeMode="cover" />
                  <IconButton
                    icon="close-circle"
                    size={32}
                    iconColor={colors.error}
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  />
                  {!imageUri && existingImage && (
                    <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                      <MaterialCommunityIcons name="camera" size={24} color={colors.text} />
                      <Text variant="bodySmall" style={styles.changeImageText}>
                        Change Image
                      </Text>
                    </TouchableOpacity>
                  )}
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
              activeOutlinecolor={colors.text}
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
              activeOutlinecolor={colors.text}
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
              activeOutlinecolor={colors.text}
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
              activeOutlinecolor={colors.text}
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
              activeOutlinecolor={colors.text}
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
              activeOutlinecolor={colors.text}
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
              loading={saving}
              disabled={saving}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Save Changes
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeImageText: {
    color: colors.text,
    fontWeight: '600',
  },
});
