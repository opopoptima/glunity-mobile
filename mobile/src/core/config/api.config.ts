import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function resolveWebApiBaseUrl(): string {
	if (typeof window !== 'undefined' && window.location?.hostname) {
		return `http://${window.location.hostname}:5000/api`;
	}
	return 'http://localhost:5000/api';
}

function resolveDefaultApiBaseUrl(): string {
	if (Platform.OS === 'web') {
		return resolveWebApiBaseUrl();
	}
	// For Android emulator use: http://10.0.2.2:5000/api
	// For iOS simulator use:    http://localhost:5000/api
	// For physical device use your machine LAN IP.
	return 'http://10.246.38.32:5000/api';
}

export const API_BASE_URL = envUrl || resolveDefaultApiBaseUrl();
