import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Registramos la aplicación en el sistema principal
AppRegistry.registerComponent('main', () => App);

// Si detecta que estamos en la web, inyecta la app directamente en la página
if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root') || document.getElementById('main');
  AppRegistry.runApplication('main', { rootTag });
}
