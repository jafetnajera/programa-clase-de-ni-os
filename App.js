import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Text, View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Switch, Modal, Share, Linking, Platform, StatusBar, KeyboardAvoidingView, Alert, Image, Animated, RefreshControl, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OneSignal from 'react-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conexión a Supabase
const supabaseUrl = 'https://clspbwuvzqnzkvnaafzo.supabase.co';
const supabaseKey = 'sb_publishable_QThR0YIh1opBm9vLBKrjCw_4cv3grQE';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

let usuarioActivoGlobal = null;
let rolUsuarioActivoGlobal = null;
let equipoActivoGlobal = null;

// Contexto Global para el Tema
const ThemeContext = createContext();

// Paleta de Colores Dinámica
const getColors = (isDark) => ({
  background: isDark ? '#1C1B19' : '#EAE9E5',
  cardBg: isDark ? '#2A2927' : '#FFFFFF',
  cardBorder: isDark ? '#3C3A36' : '#D6D3CC',
  textMain: isDark ? '#F2F0EA' : '#2B2A27',
  textSub: isDark ? '#B9B6AE' : '#5B5A56',
  inputBg: isDark ? '#2A2927' : '#FFFFFF',
  inputBorder: isDark ? '#4A4742' : '#D6D3CC',
  inputText: isDark ? '#F2F0EA' : '#2B2A27',
});

// Paleta "pastel apagado" para las tarjetas del menú principal
const PALETA_MENU = {
  claro: {
    'Clases de niños': { fondo: '#A9CFC8', texto: '#1F4F4A' },
    'Predicaciones': { fondo: '#C6BCDD', texto: '#3E3360' },
    'Anuncios': { fondo: '#E8C57A', texto: '#5A4010' },
    'Petición': { fondo: '#D6A5AF', texto: '#5C2433' },
        'Calendario': { fondo: '#B3C3CE', texto: '#26404F' },
    'Niños': { fondo: '#D6A5AF', texto: '#5C2433' },
    'Pre adolescentes': { fondo: '#E8C57A', texto: '#5A4010' },
    'Adolescentes': { fondo: '#A9CFC8', texto: '#1F4F4A' },
    'Cuneros': { fondo: '#B9CBE0', texto: '#24405F' },
    'Cuneros tarde': { fondo: '#D5BFA8', texto: '#5A3E22' },
    'Tarde 4 a 8': { fondo: '#E3B59B', texto: '#5E3420' },
        'Tarde 9 a 12': { fondo: '#B7C9A8', texto: '#34472A' },
    'Coritos': { fondo: '#D9B8C9', texto: '#55304A' },
  },
  oscuro: {
    'Clases de niños': { fondo: '#8FB9B1', texto: '#173B37' },
    'Predicaciones': { fondo: '#B0A4CE', texto: '#2E2550' },
    'Anuncios': { fondo: '#D9B15F', texto: '#45300A' },
    'Petición': { fondo: '#C58C98', texto: '#4A1B28' },
        'Calendario': { fondo: '#9DB0BD', texto: '#1B3341' },
    'Niños': { fondo: '#C58C98', texto: '#4A1B28' },
    'Pre adolescentes': { fondo: '#D9B15F', texto: '#45300A' },
        'Adolescentes': { fondo: '#8FB9B1', texto: '#173B37' },
    'Cuneros': { fondo: '#9FB5CF', texto: '#18324F' },
    'Cuneros tarde': { fondo: '#C4AA90', texto: '#45301A' },
    'Tarde 4 a 8': { fondo: '#D29F84', texto: '#4A2614' },
        'Tarde 9 a 12': { fondo: '#A0B591', texto: '#26381D' },
    'Coritos': { fondo: '#C7A0B4', texto: '#422238' },
  },
};

// Función para obtener el color dinámico del grupo
const getThemeColors = (grupo, isDark) => {
  switch(grupo) {
    case 'Niños': return { main: '#FFB7A1', textDark: isDark ? '#FFB7A1' : '#D96E53', bgLight: isDark ? 'rgba(255, 183, 161, 0.1)' : '#FFF0EC' }; 
    case 'Pre adolescentes': return { main: '#EFBC68', textDark: isDark ? '#EFBC68' : '#C48B29', bgLight: isDark ? 'rgba(239, 188, 104, 0.1)' : '#FDF6EB' }; 
        case 'Adolescentes': return { main: '#919F89', textDark: isDark ? '#919F89' : '#6A7A61', bgLight: isDark ? 'rgba(145, 159, 137, 0.1)' : '#EEF1ED' };
    case 'Cuneros': return { main: '#7E9CC2', textDark: isDark ? '#9FB5CF' : '#3E5F87', bgLight: isDark ? 'rgba(126, 156, 194, 0.15)' : '#EEF3F9' };
    case 'Cuneros tarde': return { main: '#B8977A', textDark: isDark ? '#D5BFA8' : '#7A5634', bgLight: isDark ? 'rgba(184, 151, 122, 0.15)' : '#F8F1EA' };
    case 'Tarde 4 a 8': return { main: '#D08F6E', textDark: isDark ? '#E3B59B' : '#9A5432', bgLight: isDark ? 'rgba(208, 143, 110, 0.15)' : '#FBF0EA' };
        case 'Tarde 9 a 12': return { main: '#8FA57E', textDark: isDark ? '#B7C9A8' : '#55703F', bgLight: isDark ? 'rgba(143, 165, 126, 0.15)' : '#F0F5EC' };
    case 'Coritos': return { main: '#B98BA3', textDark: isDark ? '#D9B8C9' : '#7A4766', bgLight: isDark ? 'rgba(185, 139, 163, 0.15)' : '#F8EFF4' };
    case 'Clases de niños': return { main: '#5FA8A0', textDark: isDark ? '#5FA8A0' : '#2F6E5E', bgLight: isDark ? 'rgba(95, 168, 160, 0.15)' : '#EAF3F0' };
    case 'Predicaciones': return { main: '#7EA0D8', textDark: isDark ? '#9FBCE8' : '#2C4A73', bgLight: isDark ? 'rgba(126, 160, 216, 0.18)' : '#EDF2FA' };
    case 'Anuncios': return { main: '#E0935A', textDark: isDark ? '#E0935A' : '#8A4F1E', bgLight: isDark ? 'rgba(224, 147, 90, 0.15)' : '#FBEEDD' };
    case 'Petición': return { main: '#9B8AC4', textDark: isDark ? '#9B8AC4' : '#5B4A8A', bgLight: isDark ? 'rgba(155, 138, 196, 0.15)' : '#F1EDFA' };
    case 'Calendario': return { main: '#C97A7A', textDark: isDark ? '#C97A7A' : '#A34A4A', bgLight: isDark ? 'rgba(201, 122, 122, 0.15)' : '#FDEFEF' };
    default: return { main: '#4A5568', textDark: isDark ? '#A0AEC0' : '#4A5568', bgLight: isDark ? '#3B424D' : '#FFFFFF' }; 
  }
};

// Calcula si una fecha es Clase o Predicación según el día y horario
const mesesEspanol = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
const parsearMesAnio = (texto) => {
  if (!texto) return null;
  const partes = texto.trim().split(' ');
  const mes = mesesEspanol[partes[0].toLowerCase()];
  const anio = parseInt(partes[1]);
  if (mes === undefined || isNaN(anio)) return null;
  return new Date(anio, mes, 1);
};

// Clases de niños: cada columna del CSV representa un grupo
const GRUPOS_CLASES = [
  { columna: 'grupo_cuneros', grupo: 'Cuneros', horario: 'mañana' },
  { columna: 'grupo_3_6', grupo: 'Niños', horario: 'mañana' },
  { columna: 'grupo_7_9', grupo: 'Pre adolescentes', horario: 'mañana' },
  { columna: 'grupo_10_13', grupo: 'Adolescentes', horario: 'mañana' },
  { columna: 'grupo_cuneros_tarde', grupo: 'Cuneros tarde', horario: 'tarde' },
  { columna: 'grupo_4_8', grupo: 'Tarde 4 a 8', horario: 'tarde' },
  { columna: 'grupo_9_12', grupo: 'Tarde 9 a 12', horario: 'tarde' },
];
// Cómo funciona cada grupo: con temario propio, solo cuidado (cuneros) o repaso de un grupo de la mañana
const GRUPOS_INFO = {
  'Cuneros': { turno: 'Mañana', edades: '0 a 3 años', icono: 'heart', cuidado: true },
  'Niños': { turno: 'Mañana', edades: '3 a 6 años', icono: 'smile', temario: true },
  'Pre adolescentes': { turno: 'Mañana', edades: '7 a 9 años', icono: 'users', temario: true },
  'Adolescentes': { turno: 'Mañana', edades: '10 a 13 años', icono: 'book', temario: true },
  'Cuneros tarde': { turno: 'Tarde', edades: '0 a 3 años', icono: 'moon', cuidado: true },
  'Tarde 4 a 8': { turno: 'Tarde', edades: '4 a 8 años', icono: 'sun', repasoDe: 'Niños' },
  'Tarde 9 a 12': { turno: 'Tarde', edades: '9 a 12 años', icono: 'sunset', repasoDe: 'Adolescentes' },
};
const ORDEN_GRUPOS = Object.keys(GRUPOS_INFO);
// A dónde lleva un grupo: al temario si tiene, o a sus domingos (cuneros y tarde)
const destinoDeGrupo = (grupo, extra = {}) => (GRUPOS_INFO[grupo] && !GRUPOS_INFO[grupo].temario ? { pantalla: 'Domingos', params: { grupo } } : { pantalla: 'Temas', params: { grupo, ...extra } });
// Grupos de la tarde: la clase de la mañana de un domingo (según el tema de ese mes)
const claseDeLaMananaDel = async (grupoFuente, fecha) => {
  const d = new Date(fecha + 'T00:00:00');
  const numero = domingosDelMes(d.getFullYear(), d.getMonth()).indexOf(fecha) + 1;
  if (numero < 1) return null;
  const { data: temas } = await supabase.from('temas_mensuales').select('*').ilike('mes_anio', `${NOMBRES_MESES[d.getMonth()]} ${d.getFullYear()}`).limit(1);
  const tema = temas && temas[0];
  if (!tema) return null;
  const { data: clases } = await supabase.from('clases_detalle').select('*').eq('tema_id', tema.id).eq('rango_edad', grupoFuente).eq('numero_clase', numero).limit(1);
  return clases && clases[0] ? { clase: clases[0], tema } : null;
};
// Repaso de la tarde: la clase del domingo anterior y la de ese mismo domingo
const clasesDeRepaso = async (grupoFuente, fecha) => {
  const d = new Date(fecha + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  const [anterior, actual] = await Promise.all([claseDeLaMananaDel(grupoFuente, fechaISO(d)), claseDeLaMananaDel(grupoFuente, fecha)]);
  return { anterior, actual };
};
const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const fechaISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const domingosDelMes = (anio, mes) => {
  const fechas = [];
  const d = new Date(anio, mes, 1);
  while (d.getMonth() === mes) {
    if (d.getDay() === 0) fechas.push(fechaISO(d));
    d.setDate(d.getDate() + 1);
  }
  return fechas;
};
// Convierte "Neri Sánchez" en "nerisanchez" (conserva la ñ), igual que los usuarios
const normalizarUsuario = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, (m) => (m === '\u0303' ? m : '')).normalize('NFC').replace(/\s+/g, '').toLowerCase();
const normalizarEncabezado = (texto) => (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const parsearHorarioMinutos = (horario) => {
  const match = (horario || '').match(/(\d+):(\d+)\s*(am|pm)/i);
  if (!match) return 0;
  let horas = parseInt(match[1]);
  const minutos = parseInt(match[2]);
  const esPM = match[3].toLowerCase() === 'pm';
  if (esPM && horas !== 12) horas += 12;
  if (!esPM && horas === 12) horas = 0;
  return horas * 60 + minutos;
};

const calcularTipo = (fechaTexto, horario) => {
  const dia = new Date(fechaTexto + 'T00:00:00').getDay(); // 0 = domingo, 2 = martes, 4 = jueves
  if (dia === 0) {
    return (horario || '').includes('10') ? 'Clase' : 'Predicación';
  }
  return 'Clase';
};

const Stack = createNativeStackNavigator();

// Columnas según el ancho de pantalla: 1 en celular, 2 en tablet, 3 en PC
const useColumnas = () => {
  const { width } = useWindowDimensions();
  return width >= 1100 ? 3 : width >= 768 ? 2 : 1;
};

// Mapea cada pantalla a una URL propia para que el navegador registre un paso de historial
// por cada pantalla. Sin esto, el gesto/botón de regresar del navegador no tiene nada que
// "deshacer" dentro de la app y termina saliéndose de ella por completo.
const linking = {
  prefixes: [],
  config: {
    screens: {
      Login: 'login',
            MenuPrincipal: 'inicio',
      Notificaciones: 'notificaciones',
      Grupos: 'grupos',
      MiRol: 'mi-rol',
      Temas: 'temas',
      Clases: 'clases',
            ClaseDetalle: 'clase-detalle',
      Domingos: 'domingos',
            DomingoDetalle: 'domingo',
      Coritos: 'coritos',
      Tablon: 'tablon',
      Admin: 'admin',
      TodosUsuarios: 'todos-usuarios',
      DetalleUsuario: 'detalle-usuario',
    },
  },
};

// ==========================================
// COMPONENTES MODALES
// ==========================================
const AlertaPersonalizada = ({ visible, titulo, mensaje, textoConfirmar, textoCancelar, onConfirmar, onCancelar, isDark, themeColor }) => {
  const colors = getColors(isDark);
  const btnColor = themeColor || '#EFBC68'; 
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.textMain }]}>{titulo}</Text>
          <Text style={[styles.modalMessage, { color: colors.textSub }]}>{mensaje}</Text>
          <View style={styles.modalButtons}>
            {onCancelar && (
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]} onPress={onCancelar}>
                <Text style={[styles.modalCancelText, { color: colors.textSub }]}>{textoCancelar || "Cancelar"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: btnColor }]} onPress={onConfirmar}>
              <Text style={styles.modalConfirmText}>{textoConfirmar || "Aceptar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ModalEdicion = ({ visible, maestro, onGuardar, onCancelar, isDark }) => {
  const [nuevoNumeroEquipo, setNuevoNumeroEquipo] = useState('');
    const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoNombreCompleto, setNuevoNombreCompleto] = useState('');
  const [nuevoElegibleClases, setNuevoElegibleClases] = useState(false);
  const [nuevoElegiblePredicaciones, setNuevoElegiblePredicaciones] = useState(false);
  const colors = getColors(isDark);
  
  useEffect(() => { 
    if (maestro) {
      const soloNumeros = (maestro.equipo || '').replace(/[^0-9]/g, '');
      setNuevoNumeroEquipo(soloNumeros);
      setNuevoTelefono(maestro.telefono || '');
      setNuevoNombreCompleto(maestro.nombre_completo || '');
      setNuevoElegibleClases(!!maestro.elegible_clases_ninos);
      setNuevoElegiblePredicaciones(!!maestro.elegible_predicaciones);
    } 
  }, [maestro]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <Text style={[styles.modalTitle, { color: colors.textMain }]}>Editar Maestro</Text>
          <Text style={[styles.modalMessage, { color: colors.textSub }]}>{maestro?.nombre_usuario}</Text>

          <Text style={[styles.label, { color: colors.textSub, marginTop: 12 }]}>Nombre para mostrar</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} 
            value={nuevoNombreCompleto} 
            onChangeText={setNuevoNombreCompleto} 
            placeholder="Ej. Jafet Najera" 
            placeholderTextColor={colors.textSub}
          />

          <Text style={[styles.label, { color: colors.textSub, marginTop: 12 }]}>Número celular</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} 
            value={nuevoTelefono} 
            onChangeText={(texto) => setNuevoTelefono(texto.replace(/[^0-9]/g, ''))} 
            placeholder="Ej. 8123456789" 
            placeholderTextColor={colors.textSub}
            keyboardType="numeric" 
          />

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Clases de niños</Text>
            <Switch trackColor={{ false: colors.cardBorder, true: "#5FA8A0" }} thumbColor={"#FFFFFF"} onValueChange={setNuevoElegibleClases} value={nuevoElegibleClases} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Predicaciones y Clases</Text>
            <Switch trackColor={{ false: colors.cardBorder, true: "#7EA0D8" }} thumbColor={"#FFFFFF"} onValueChange={setNuevoElegiblePredicaciones} value={nuevoElegiblePredicaciones} />
          </View>

          <View style={[styles.modalButtons, { marginTop: 20 }]}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]} onPress={onCancelar}>
              <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EFBC68' }]} onPress={() => { onGuardar({ telefono: nuevoTelefono, nombre_completo: nuevoNombreCompleto, elegible_clases_ninos: nuevoElegibleClases, elegible_predicaciones: nuevoElegiblePredicaciones }); }}>
              <Text style={styles.modalConfirmText}>Guardar</Text>
            </TouchableOpacity>
          </View>
                </View>
      </View>
    </Modal>
  );
};

// ---- AVISOS PUSH: estado de este dispositivo y cómo activarlos ----
// Devuelve: 'activo' | 'pendiente' | 'bloqueado' | 'instalar' | 'no-soportado'
// OneSignal: se inicia una sola vez y todo lo demás (login, logout, permisos) espera a que termine de iniciar
let promesaOneSignal = null;
let colaOneSignal = Promise.resolve();
const iniciarOneSignal = () => {
  if (!promesaOneSignal) {
    promesaOneSignal = OneSignal.init({ appId: "a598b3d5-0064-4124-bf93-2543c79a9922" })
      .catch((e) => { console.error('OneSignal no se pudo inicializar:', e); });
  }
  return promesaOneSignal;
};
const vincularOneSignal = (usuario) => {
  if (!usuario) return colaOneSignal;
  colaOneSignal = colaOneSignal.then(async () => {
    try { await iniciarOneSignal(); await OneSignal.login(usuario); } catch (e) { console.error('OneSignal.login falló:', e); }
  });
  return colaOneSignal;
};
const cerrarOneSignal = () => {
  colaOneSignal = colaOneSignal.then(async () => {
    try { await iniciarOneSignal(); await OneSignal.logout(); } catch (e) { console.error('OneSignal.logout falló:', e); }
  });
  return colaOneSignal;
};

const estadoAvisos = () => {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') return 'no-soportado';
    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const instalada = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    if (esIOS && !instalada) return 'instalar';
    if (typeof Notification === 'undefined') return 'no-soportado';
    if (Notification.permission === 'denied') return 'bloqueado';
    if (Notification.permission === 'granted') {
            let suscrito = false;
      try { suscrito = OneSignal.User.PushSubscription.optedIn === true; } catch (e) {}
      return suscrito ? 'activo' : 'pendiente';
    }
    return 'pendiente';
  } catch (e) { return 'no-soportado'; }
};

// Pide el permiso (debe llamarse desde un toque de la persona) y vincula este dispositivo con su usuario
const activarAvisos = async () => {
  try {
        await iniciarOneSignal();
    await OneSignal.Notifications.requestPermission();
    if (OneSignal.User.PushSubscription.optedIn !== true) await OneSignal.User.PushSubscription.optIn();
    if (usuarioActivoGlobal) await vincularOneSignal(usuarioActivoGlobal);
  } catch (e) { console.error('No se pudieron activar los avisos:', e); }
  return estadoAvisos();
};

// Panel de Ajustes: se desliza desde la izquierda y cubre solo una parte de la pantalla
const PanelAjustes = ({ visible, onCerrar, isDark, toggleTheme, onCerrarSesion }) => {
  const colors = getColors(isDark);
    const anim = useRef(new Animated.Value(0)).current;
    const [nombreVisible, setNombreVisible] = useState(usuarioActivoGlobal || '');
  const [avisos, setAvisos] = useState(estadoAvisos());

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: false }).start();
        if (visible) setAvisos(estadoAvisos());
    if (!visible) return;
        if (usuarioActivoGlobal) {
      setNombreVisible(usuarioActivoGlobal);
      cargarMapaNombres().then((mapa) => { const n = mapa[usuarioActivoGlobal.toLowerCase()]; if (n) setNombreVisible(ponerMayusculas(n)); });
      return;
    }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('maestros').select('nombre_usuario').eq('user_id', session.user.id).single();
        if (data) { usuarioActivoGlobal = data.nombre_usuario; setNombreVisible(data.nombre_usuario); }
      } catch (e) { console.error('No se pudo leer el usuario:', e); }
    })();
  }, [visible]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] });
  const overlayOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableOpacity activeOpacity={1} onPress={onCerrar} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: overlayOpacity }]} />
      </TouchableOpacity>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '65%', maxWidth: 300, backgroundColor: colors.background, borderTopRightRadius: 44, borderBottomRightRadius: 44, overflow: 'hidden', transform: [{ translateX }], paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 30 : 60, paddingHorizontal: 20 }}>
                <Text style={{ color: colors.textMain, fontSize: 20, fontWeight: '700', marginBottom: 18 }}>Hola, {nombreVisible}</Text>
        <Text style={[styles.titleMini, { color: colors.textSub, marginBottom: 14 }]}>Ajustes</Text>
        <TouchableOpacity onPress={() => { onCerrar(); toggleTheme(); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
          <Feather name={isDark ? "sun" : "moon"} size={20} color={colors.textSub} />
          <Text style={{ marginLeft: 14, fontSize: 15, color: colors.textMain }}>{isDark ? 'Modo claro' : 'Modo oscuro'}</Text>
        </TouchableOpacity>
                {avisos !== 'no-soportado' && (
          <TouchableOpacity activeOpacity={avisos === 'pendiente' ? 0.6 : 1} onPress={async () => { if (avisos === 'pendiente') setAvisos(await activarAvisos()); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
            <Feather name={avisos === 'activo' ? 'bell' : 'bell-off'} size={20} color={avisos === 'pendiente' ? colors.textMain : colors.textSub} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textMain }}>{avisos === 'activo' ? 'Avisos activados' : avisos === 'pendiente' ? 'Activar avisos' : avisos === 'bloqueado' ? 'Avisos bloqueados' : 'Instala la app para recibir avisos'}</Text>
              {avisos === 'bloqueado' && <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>Actívalos en los ajustes de tu teléfono o navegador</Text>}
              {avisos === 'instalar' && <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>Agrégala a tu pantalla de inicio</Text>}
            </View>
          </TouchableOpacity>
        )}
        <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 6 }} />
        <TouchableOpacity onPress={() => { onCerrar(); onCerrarSesion(); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
          <Feather name="log-out" size={20} color={colors.textSub} />
          <Text style={{ marginLeft: 14, fontSize: 15, color: colors.textMain }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Ícono de notificaciones: marco con dos cortes + círculo de aviso
const IconoNotificacion = ({ size = 26, color, activo }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Path d="M3,7 A4,4 0 0 1 7,3 L14,3 M21,10 L21,17 A4,4 0 0 1 17,21 L7,21 A4,4 0 0 1 3,17 L3,7" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={19} cy={5} r={3} fill={activo ? '#E5484D' : 'transparent'} stroke={activo ? '#E5484D' : color} strokeWidth={1.6} />
  </Svg>
);

// Ícono de "muchas personas" para las carpetas de equipos, en el mismo estilo que "users" de Feather
const IconoGrupoGrande = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 36 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={9} cy={7} r={4} stroke={color} strokeWidth={2} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M28 21v-2a4 4 0 0 0-4-4H16a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={20} cy={7} r={4} stroke={color} strokeWidth={2} />
    <Path d="M34 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M27 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Modal para solicitar apoyo: cualquiera elegible, o alguien específico (cobertura o intercambio de fechas)
// Pone la primera letra de cada palabra en mayúscula (para mostrar nombres)
const ponerMayusculas = (t) => (t || '').split(' ').map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join(' ');

// Devuelve un mapa { usuario en minúsculas: nombre completo } con la lista pública de usuarios
const cargarMapaNombres = async () => {
  const { data } = await supabase.rpc('nombres_publicos');
  const mapa = {};
  (data || []).forEach((m) => { mapa[(m.nombre_usuario || '').toLowerCase()] = m.nombre_completo || m.nombre_usuario; });
  return mapa;
};

// Revisa si una persona ya tiene predicación o clase de niños en una fecha.
// Devuelve un texto (por ejemplo "una clase con Niños ese día") o null si está libre.
// "ignorar" permite no contar la fecha que esa persona entregaría en un intercambio.
const buscarConflictoDia = async (usuario, fecha, ignorar = {}) => {
  if (!usuario || !fecha) return null;
  const [roles, clases] = await Promise.all([
    supabase.from('programa_servicios').select('id, horario').ilike('nombre_usuario', usuario).eq('fecha', fecha),
    supabase.from('clases_asignadas').select('id, grupo').ilike('nombre_usuario', usuario).eq('fecha', fecha),
  ]);
  const rol = (roles.data || []).find((r) => !(ignorar.rolId && r.id === ignorar.rolId));
  if (rol) return `una predicación ese día (${rol.horario})`;
  const clase = (clases.data || []).find((c) => !(ignorar.claseId && c.id === ignorar.claseId));
  if (clase) return `una clase con ${clase.grupo} ese día`;
  return null;
};

// ---- NOTIFICACIONES: avisos de apoyo para el usuario activo ----
const claveVistas = () => `notificaciones_vistas_${(usuarioActivoGlobal || '').toLowerCase()}`;

const marcarNotificacionesVistas = async (items) => {
  try {
    const claves = items.map((n) => n.clave).slice(0, 300);
    await AsyncStorage.setItem(claveVistas(), JSON.stringify(claves));
  } catch (e) { console.error('No se pudieron guardar las notificaciones vistas:', e); }
};

// Devuelve { items, vistas }. Cada item: { clave, accion, mensaje, detalle }
//  - accion = true: algo que la persona puede responder (dirigida a ella o general para quien esté libre)
//  - accion = false: aviso informativo para el coordinador (alguien de su equipo pide apoyo o lo aceptaron)
const obtenerNotificaciones = async () => {
  const items = [];
  try {
    const yo = (usuarioActivoGlobal || '').toLowerCase();
    const hoy = fechaISO(new Date());
    const { data: lista } = await supabase.rpc('nombres_publicos');
    const mapa = {};
    (lista || []).forEach((m) => { mapa[(m.nombre_usuario || '').toLowerCase()] = m.nombre_completo || m.nombre_usuario; });
    const nom = (u) => ponerMayusculas(mapa[(u || '').toLowerCase()] || u);
    const yoInfo = (lista || []).find((m) => (m.nombre_usuario || '').toLowerCase() === yo);
        const soyElegibleClases = !!(yoInfo && yoInfo.elegible_clases_ninos);
    const soyElegiblePred = !!(yoInfo && yoInfo.elegible_predicaciones);

    const { data: reqs } = await supabase.from('solicitudes_sustitucion').select('*').or(`fecha_referencia.is.null,fecha_referencia.gte.${hoy}`).order('creado_en', { ascending: false }).range(0, 499);
    const solicitudes = reqs || [];

    const idsClases = [...new Set(solicitudes.filter((s) => s.clase_asignada_id).map((s) => s.clase_asignada_id))];
    const coordPorClase = {};
    if (idsClases.length > 0) {
      const { data: cl } = await supabase.from('clases_asignadas').select('id, coordinador').in('id', idsClases);
      (cl || []).forEach((c) => { coordPorClase[c.id] = (c.coordinador || '').toLowerCase(); });
    }
        const irTablon = (s) => ({ pantalla: 'Tablon', params: { solicitudId: s.id, ...(s.grupo_clase === 'Predicaciones' ? { soloGrupo: 'Predicaciones' } : { excluirGrupo: 'Predicaciones' }) } });
    const irGrupos = { pantalla: 'Grupos', params: {} };
    const cuando = (s) => `${s.titulo_tema}${s.grupo_clase ? ' • ' + s.grupo_clase : ''}${s.tipo_intercambio === 'intercambio' ? ' • Intercambio de fechas' : ''}`;

    for (const s of solicitudes) {
      const solicitante = (s.maestro_solicitante || '').toLowerCase();
            const esClase = !!s.clase_asignada_id;
      const antes = items.length;
      if (s.estado === 'Pendiente' && (s.maestro_destino || '').toLowerCase() === yo) {
        items.push({ clave: `dir:${s.id}`, accion: true, destino: irTablon(s), mensaje: `${nom(s.maestro_solicitante)} te pide apoyo`, detalle: cuando(s) });
      } else if (s.estado === 'Pendiente' && esClase && !s.maestro_destino && solicitante !== yo && soyElegibleClases && s.fecha_referencia) {
        const conflicto = await buscarConflictoDia(usuarioActivoGlobal, s.fecha_referencia);
        if (!conflicto) items.push({ clave: `gen:${s.id}`, accion: true, destino: irTablon(s), mensaje: `${nom(s.maestro_solicitante)} pide apoyo y tú estás libre`, detalle: cuando(s) });
      }
            if (s.estado === 'Pendiente' && !esClase && s.grupo_clase === 'Predicaciones' && !s.maestro_destino && solicitante !== yo && soyElegiblePred && s.fecha_referencia) {
        const conflictoPred = await buscarConflictoDia(usuarioActivoGlobal, s.fecha_referencia);
        if (!conflictoPred) items.push({ clave: `gen-rol:${s.id}`, accion: true, destino: irTablon(s), mensaje: `${nom(s.maestro_solicitante)} pide apoyo en una predicación y tú estás libre`, detalle: cuando(s) });
      }
      if (s.estado === 'Cubierta' && solicitante === yo && s.maestro_suplente) {
        items.push({ clave: `acepto:${s.id}`, accion: false, destino: irTablon(s), mensaje: `${nom(s.maestro_suplente)} aceptó ${s.tipo_intercambio === 'intercambio' ? 'el intercambio contigo' : 'cubrirte'}`, detalle: cuando(s) });
      }
            if (rolUsuarioActivoGlobal === 'administrador' && items.length === antes && solicitante !== yo && !(esClase && coordPorClase[s.clase_asignada_id] === yo)) {
        if (s.estado === 'Pendiente') items.push({ clave: `admin-pide:${s.id}`, accion: false, abierta: true, destino: irTablon(s), mensaje: `${nom(s.maestro_solicitante)} pide apoyo`, detalle: cuando(s) });
        else if (s.estado === 'Cubierta' && s.maestro_suplente && (s.maestro_suplente || '').toLowerCase() !== yo) items.push({ clave: `admin-acepta:${s.id}`, accion: false, destino: irTablon(s), mensaje: `${nom(s.maestro_suplente)} aceptó cubrir a ${nom(s.maestro_solicitante)}`, detalle: cuando(s) });
      }
      if (esClase && coordPorClase[s.clase_asignada_id] === yo && solicitante !== yo) {
        if (s.estado === 'Pendiente' && items.length === antes) items.push({ clave: `coord-pide:${s.id}`, accion: false, abierta: true, destino: irTablon(s), mensaje: `${nom(s.maestro_solicitante)} (tu equipo) pide apoyo`, detalle: cuando(s) });
        else if (s.estado === 'Cubierta') items.push({ clave: `coord-acepta:${s.id}`, accion: false, destino: irTablon(s), mensaje: `${nom(s.maestro_suplente)} aceptó cubrir a ${nom(s.maestro_solicitante)}`, detalle: cuando(s) });
      }
    }
      // ---- RECORDATORIOS: clases, equipo y rol (desaparecen solos cuando pasa la fecha) ----
    const recordatorios = [];
    const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
    const hoyD = new Date();
    const inicioSiguienteMes = fechaISO(new Date(hoyD.getFullYear(), hoyD.getMonth() + 1, 1));
    const finSiguienteMes = fechaISO(new Date(hoyD.getFullYear(), hoyD.getMonth() + 2, 0));
    const domingosMes = domingosDelMes(hoyD.getFullYear(), hoyD.getMonth());
    const desdeUltimoDomingo = hoy >= domingosMes[domingosMes.length - 1];
    const [{ data: misClases }, { data: miRol }] = await Promise.all([
      supabase.from('clases_asignadas').select('id, fecha, grupo, nombre_usuario, coordinador').gte('fecha', hoy).lte('fecha', finSiguienteMes).or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`),
      supabase.from('programa_servicios').select('id, fecha, horario, estado_confirmacion').gte('fecha', hoy).ilike('nombre_usuario', usuarioActivoGlobal).order('fecha', { ascending: true }),
    ]);
    const pendientesPropios = new Set(solicitudes.filter((s) => s.estado === 'Pendiente' && s.clase_asignada_id && (s.maestro_solicitante || '').toLowerCase() === yo).map((s) => s.clase_asignada_id));
    const equiposVistos = new Set();
    (misClases || []).forEach((c) => {
      const d = diasEntre(hoy, c.fecha);
      const mia = (c.nombre_usuario || '').toLowerCase() === yo;
            const irTemas = destinoDeGrupo(c.grupo);
      if (d <= 4 && mia) {
        if (pendientesPropios.has(c.id)) recordatorios.push({ clave: `rec-pend:${c.id}`, accion: false, abierta: true, destino: { pantalla: 'Tablon', params: { excluirGrupo: 'Predicaciones' } }, mensaje: 'Tu solicitud de apoyo para este domingo sigue pendiente', detalle: `Recordatorio • ${c.grupo}` });
                else if ((GRUPOS_INFO[c.grupo] || {}).cuidado) recordatorios.push({ clave: `rec-clase:${c.id}:${d <= 2 ? 'v' : 'm'}`, accion: false, destino: irTemas, mensaje: 'Este domingo te toca cubrir cuneros', detalle: `Recordatorio • ${c.grupo}` });
        else recordatorios.push({ clave: `rec-clase:${c.id}:${d <= 2 ? 'v' : 'm'}`, accion: false, destino: irTemas, mensaje: d <= 2 ? 'Este domingo tienes clase, ¿ya estás listo?' : 'Este domingo tienes clase', detalle: `Prepara tu tema • ${c.grupo}` });
      }
      if (d <= 2 && !mia && (c.coordinador || '').toLowerCase() === yo && !equiposVistos.has(`${c.fecha}:${c.grupo}`)) {
        equiposVistos.add(`${c.fecha}:${c.grupo}`);
        recordatorios.push({ clave: `rec-equipo:${c.fecha}:${c.grupo}`, accion: false, destino: irTemas, mensaje: 'Este domingo le toca a tu equipo', detalle: `Recordatorio • ${c.grupo}` });
      }
    });
    if (desdeUltimoDomingo) {
      const claveMes = inicioSiguienteMes.slice(0, 7);
      const delMes = (misClases || []).filter((c) => c.fecha >= inicioSiguienteMes);
      const propia = delMes.find((c) => (c.nombre_usuario || '').toLowerCase() === yo);
      const deEquipo = delMes.find((c) => (c.coordinador || '').toLowerCase() === yo);
      if (propia) recordatorios.push({ clave: `rec-mes:${claveMes}:clases`, accion: false, destino: destinoDeGrupo(propia.grupo, { verFuturo: true }), mensaje: (GRUPOS_INFO[propia.grupo] || {}).cuidado ? 'El próximo mes te toca cubrir cuneros' : 'El próximo mes tienes clases programadas', detalle: `Recordatorio • ${propia.grupo}` });
      else if (deEquipo) recordatorios.push({ clave: `rec-mes:${claveMes}:equipo`, accion: false, destino: destinoDeGrupo(deEquipo.grupo, { verFuturo: true }), mensaje: 'El próximo mes tu equipo tiene clases programadas', detalle: `Recordatorio • ${deEquipo.grupo}` });
      const rolMes = (miRol || []).find((r) => r.fecha >= inicioSiguienteMes && r.fecha <= finSiguienteMes);
      if (rolMes) recordatorios.push({ clave: `rec-mes:${claveMes}:rol`, accion: false, destino: { pantalla: 'MiRol', params: { servicioId: rolMes.id } }, mensaje: 'El próximo mes tienes predicaciones programadas', detalle: 'Recordatorio • Mi rol' });
    }
    let porConfirmarLejos = null;
    (miRol || []).forEach((r) => {
      const d = diasEntre(hoy, r.fecha);
      const confirmada = r.estado_confirmacion === 'confirmado';
      const tipo = calcularTipo(r.fecha, r.horario).toLowerCase();
      if (d <= 15) {
        const cuando = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`;
        const etapa = d <= 1 ? 'cerca' : d <= 3 ? '3' : d <= 7 ? '7' : '15';
        recordatorios.push({ clave: `rec-rol:${r.id}:${confirmada ? 'c' : 'p'}:${etapa}`, accion: !confirmada, destino: { pantalla: 'MiRol', params: { servicioId: r.id } }, mensaje: `Tienes una ${tipo} ${cuando}`, detalle: confirmada ? 'Recordatorio • Mi rol' : 'Toca para confirmarla en Mi rol' });
      } else if (!confirmada && !porConfirmarLejos) porConfirmarLejos = r;
    });
    if (porConfirmarLejos) recordatorios.push({ clave: 'rec-rol-pend', accion: true, destino: { pantalla: 'MiRol', params: { servicioId: porConfirmarLejos.id } }, mensaje: 'Tienes fechas por confirmar en tu rol', detalle: 'Toca para revisarlas en Mi rol' });
    items.unshift(...recordatorios);
  } catch (e) { console.error('Error leyendo notificaciones:', e); }
  let vistas = [];
  try { vistas = JSON.parse((await AsyncStorage.getItem(claveVistas())) || '[]'); } catch (e) {}
  return { items, vistas };
};

const ModalSolicitarApoyo = ({ visible, maestrosElegibles, usuarioPropio, isDark, onCancelar, onConfirmar, tipoItem = 'rol', item = null }) => {
  const colors = getColors(isDark);
  const [paso, setPaso] = useState('inicio');
  const [texto, setTexto] = useState('');
  const [destino, setDestino] = useState(null);
  const [fechasDestino, setFechasDestino] = useState([]);
    const [cargandoFechas, setCargandoFechas] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (visible) { setPaso('inicio'); setTexto(''); setDestino(null); setFechasDestino([]); setAviso(''); }
  }, [visible]);

  const formatearFechaCorta = (fechaTexto) => new Date(fechaTexto + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const confirmarConChequeo = async (tipo, fechaOtra, idOtro) => {
    setAviso('');
    if (item) {
      const nombreDestino = destino.nombre_completo || destino.nombre_usuario;
      const ignDestino = tipo === 'intercambio' ? (tipoItem === 'clase' ? { claseId: idOtro } : { rolId: idOtro }) : {};
      const c1 = await buscarConflictoDia(destino.nombre_usuario, item.fecha, ignDestino);
      if (c1) return setAviso(`${nombreDestino} ya tiene ${c1}, así que no puede cubrirte.`);
      if (tipo === 'intercambio' && fechaOtra) {
        const ignPropio = tipoItem === 'clase' ? { claseId: item.id } : { rolId: item.id };
        const c2 = await buscarConflictoDia(item.nombre_usuario || usuarioPropio, fechaOtra, ignPropio);
        if (c2) return setAviso(`Ya tienes ${c2}, no puedes tomar esa fecha.`);
      }
    }
    onConfirmar({ destino: destino.nombre_usuario, tipo, fechaIntercambioId: tipo === 'intercambio' ? idOtro : null });
  };

  const resultados = texto.length > 0
    ? maestrosElegibles.filter((m) => m.nombre_usuario.toLowerCase() !== usuarioPropio.toLowerCase() && (m.nombre_completo || m.nombre_usuario).toLowerCase().includes(texto.toLowerCase()))
    : [];

  const elegirIntercambio = async () => {
    setCargandoFechas(true);
    setPaso('fecha');
    const hoy = fechaISO(new Date());
    const { data } = await supabase.from(tipoItem === 'clase' ? 'clases_asignadas' : 'programa_servicios').select('*').ilike('nombre_usuario', destino.nombre_usuario).gte('fecha', hoy).order('fecha', { ascending: true });
    setFechasDestino(data || []);
    setCargandoFechas(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
            <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 40 }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
          <Text style={[styles.title, { color: colors.textMain, marginBottom: 15 }]}>Solicitar apoyo</Text>

          {paso === 'inicio' && (
            <>
              <Text style={{ color: colors.textSub, marginBottom: 20 }}>¿Tienes a alguien específico en mente para pedirle el cambio?</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setPaso('buscar')}>
                <Text style={styles.primaryButtonText}>Sí, alguien específico</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={() => onConfirmar({ destino: null, tipo: null, fechaIntercambioId: null })}>
                <Text style={[styles.primaryButtonText, { color: colors.textMain }]}>No, cualquiera elegible</Text>
              </TouchableOpacity>
            </>
          )}

          {paso === 'buscar' && (
            <>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 10 }]} placeholder="Escribe un nombre..." placeholderTextColor={colors.textSub} value={texto} onChangeText={setTexto} autoFocus />
              <ScrollView style={{ maxHeight: 180 }}>
                {resultados.map((m) => (
                  <TouchableOpacity key={m.nombre_usuario} onPress={() => { setDestino(m); setPaso('tipo'); }} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                    <Text style={{ color: colors.textMain, fontSize: 14 }}>{m.nombre_completo || m.nombre_usuario}</Text>
                  </TouchableOpacity>
                ))}
                {texto.length > 0 && resultados.length === 0 && (
                  <Text style={{ color: colors.textSub, fontSize: 13, paddingVertical: 10 }}>Nadie elegible coincide con ese nombre.</Text>
                )}
              </ScrollView>
            </>
          )}

          {paso === 'tipo' && destino && (
            <>
              <Text style={{ color: colors.textSub, marginBottom: 15 }}>Se lo pedirás a {destino.nombre_completo || destino.nombre_usuario}. ¿Cómo?</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => confirmarConChequeo('cobertura', null, null)}>
                <Text style={styles.primaryButtonText}>Solo que me cubra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={elegirIntercambio}>
                <Text style={[styles.primaryButtonText, { color: colors.textMain }]}>Intercambio de fechas</Text>
              </TouchableOpacity>
            </>
          )}

          {paso === 'fecha' && (
            <>
              <Text style={{ color: colors.textSub, marginBottom: 15 }}>¿Cuál de sus fechas te gustaría tomar a cambio?</Text>
              {cargandoFechas ? (
                <ActivityIndicator color={colors.textSub} />
              ) : fechasDestino.length === 0 ? (
                <Text style={{ color: colors.textSub, fontSize: 13 }}>Esta persona no tiene fechas próximas para intercambiar.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 180 }}>
                  {fechasDestino.map((f) => (
                    <TouchableOpacity key={f.id} onPress={() => confirmarConChequeo('intercambio', f.fecha, f.id)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                      <Text style={{ color: colors.textMain, fontSize: 14 }}>{formatearFechaCorta(f.fecha)} • {tipoItem === 'clase' ? f.grupo : f.horario}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {aviso ? <Text style={{ color: '#C97A7A', marginTop: 14, fontSize: 13 }}>{aviso}</Text> : null}
          <TouchableOpacity onPress={onCancelar} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textSub, fontSize: 14 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Tarjeta del menú principal: esquinas muy redondeadas, ícono en círculo y título
const TarjetaMenu = ({ icono, titulo, subtitulo, detalle, categoria, pronto, isDark, columnas, esUltima, total, onPress }) => {
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro'][categoria];
  const m = columnas === 3
    ? { alto: 236, radio: 54, circulo: 54, icono: 26, texto: 25, vertical: 24, lateral: 30, pill: 12 }
    : columnas === 2
    ? { alto: 260, radio: 58, circulo: 60, icono: 28, texto: 28, vertical: 26, lateral: 32, pill: 13 }
    : { alto: 120, radio: 46, circulo: 44, icono: 22, texto: 19, vertical: 16, lateral: 20, pill: 11 };

  // La última tarjeta ocupa el espacio que queda libre en su fila
  let ancho = columnas === 3 ? '31.9%' : columnas === 2 ? '48.5%' : '100%';
  const resto = total % columnas;
  if (esUltima && columnas >= 2 && resto !== 0) {
    ancho = (columnas - resto + 1) === columnas ? '100%' : '65.9%';
  }

  const circuloClaro = isDark ? 'rgba(255,255,255,0.50)' : '#FFFFFF';
  const pastillaFondo = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.62)';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityLabel={titulo}
      onPress={onPress}
      style={{ width: ancho, minHeight: m.alto, borderRadius: m.radio, backgroundColor: paleta.fondo, overflow: 'hidden', paddingVertical: m.vertical, paddingHorizontal: m.lateral, justifyContent: 'space-between' }}
    >
      <View style={{ pointerEvents: 'none', position: 'absolute', right: -m.alto * 0.275, top: -m.alto * 0.35, width: m.alto * 1.25, height: m.alto * 1.25, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.30)' }} />
      <View style={{ pointerEvents: 'none', position: 'absolute', right: m.alto * 0.55, bottom: -m.alto * 0.425, width: m.alto * 0.85, height: m.alto * 0.85, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)' }} />
      <View style={{ width: m.circulo, height: m.circulo, borderRadius: m.circulo / 2, backgroundColor: circuloClaro, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icono} size={m.icono} color={paleta.texto} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
          <Text style={{ fontSize: m.texto, fontWeight: '700', letterSpacing: -0.2, color: paleta.texto }}>{titulo}</Text>
          {subtitulo ? <Text style={{ fontSize: Math.round(m.texto * 0.68), fontWeight: '500', marginTop: 2, color: paleta.texto }}>{subtitulo}</Text> : null}
          {detalle ? <Text style={{ fontSize: Math.round(m.texto * 0.62), fontWeight: '600', marginTop: 5, color: paleta.texto }}>{detalle}</Text> : null}
        </View>
        {pronto && (
          <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: pastillaFondo }}>
            <Text style={{ fontSize: m.pill, fontWeight: '700', color: paleta.texto }}>Pronto</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Tarjeta para listas (temario y clases): mismo estilo redondeado que las del menú
const TarjetaLista = ({ icono, titulo, subtitulo, detalle, asignado, etiqueta, categoria, isDark, ancho, onPress }) => {
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro'][categoria] || PALETA_MENU[isDark ? 'oscuro' : 'claro']['Niños'];
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ width: ancho || '100%', borderRadius: 38, backgroundColor: paleta.fondo, overflow: 'hidden', paddingVertical: 18, paddingHorizontal: 22, marginBottom: 14 }}>
      <View style={{ pointerEvents: 'none', position: 'absolute', right: -50, top: -60, width: 160, height: 160, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.30)' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: isDark ? 'rgba(255,255,255,0.50)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icono} size={22} color={paleta.texto} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.2, color: paleta.texto }}>{titulo}</Text>
          {subtitulo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 3 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: paleta.texto }}>{subtitulo}</Text>
              {etiqueta ? <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.70)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 }}><Text style={{ fontSize: 11, fontWeight: '700', color: paleta.texto }}>{etiqueta}</Text></View> : null}
            </View>
          ) : null}
          {detalle ? <Text style={{ fontSize: 12.5, fontStyle: 'italic', marginTop: 3, color: paleta.texto }}>{detalle}</Text> : null}
          {asignado ? <Text style={{ fontSize: 12.5, fontWeight: '600', marginTop: 5, color: paleta.texto }}>{asignado}</Text> : null}
        </View>
        <Feather name="chevron-right" size={22} color={paleta.texto} />
      </View>
    </TouchableOpacity>
  );
};

// Botón para elegir un archivo CSV (reemplaza al botón nativo del navegador)
const BloqueAdmin = ({ categoria, isDark, children }) => {
  const p = PALETA_MENU[isDark ? 'oscuro' : 'claro'][categoria];
  return (
    <View style={{ backgroundColor: p.fondo + (isDark ? '33' : '66'), borderColor: p.fondo, borderWidth: 1.5, borderRadius: 32, padding: 20, marginBottom: 22 }}>
      {children}
    </View>
  );
};

const SelectorArchivo = ({ onArchivo, isDark, etiqueta }) => {
  const colors = getColors(isDark);
  const inputRef = useRef(null);
  const [nombre, setNombre] = useState('');
  if (Platform.OS !== 'web') return null;
  return (
    <View style={{ marginBottom: 15 }}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const archivo = e.target.files[0];
          setNombre(archivo ? archivo.name : '');
          onArchivo(e);
          e.target.value = '';
        }}
      />
      <TouchableOpacity onPress={() => inputRef.current && inputRef.current.click()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textSub, backgroundColor: colors.cardBg }}>
        <Feather name="upload" size={20} color={colors.textSub} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{nombre || etiqueta || 'Elegir archivo CSV'}</Text>
          <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 2 }}>{nombre ? 'Toca para elegir otro archivo' : 'Formato .csv'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ---- CORITOS: audios en Supabase Storage (carpeta "coritos"), letra opcional y reproductor ----
// Grupos que llevan coritos (la Tarde 4 a 8 usa los de Niños, porque repasa sus clases)
const GRUPOS_CORITOS = ['Niños', 'Pre adolescentes'];
const FILTROS_CORITOS = ['Todos', 'Niños', 'Pre adolescentes', 'Tarde 4 a 8'];
const urlCorito = (archivo) => supabase.storage.from('coritos').getPublicUrl(archivo).data.publicUrl;
const gruposDeCoritos = (grupo) => ((GRUPOS_INFO[grupo] || {}).repasoDe ? [grupo, GRUPOS_INFO[grupo].repasoDe] : [grupo]);
const sinAcentos = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const formatoTiempo = (s) => { const n = Math.max(0, Math.floor(s || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
// Coritos ligados a una o varias clases
const coritosDeClases = async (idsClases) => {
  const ids = (idsClases || []).filter((x) => x !== null && x !== undefined).map(String);
  if (ids.length === 0) return [];
  const { data: ligas } = await supabase.from('clase_coritos').select('corito_id').in('clase_id', ids);
  const idsCoritos = [...new Set((ligas || []).map((l) => l.corito_id))];
  if (idsCoritos.length === 0) return [];
  const { data } = await supabase.from('coritos').select('*').in('id', idsCoritos).order('titulo', { ascending: true });
  return data || [];
};

// Reproduce un corito a la vez y se detiene solo al salir de la pantalla
const useReproductor = () => {
  const audioRef = useRef(null);
  const listaRef = useRef([]);
  const actualRef = useRef(null);
  const [actual, setActual] = useState(null);
  const [sonando, setSonando] = useState(false);
  const [tiempo, setTiempo] = useState({ pos: 0, dur: 0 });
  const detener = () => { if (audioRef.current) audioRef.current.pause(); setSonando(false); };
  useFocusEffect(React.useCallback(() => () => detener(), []));
  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } }, []);
  const tocar = (corito, lista) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !corito) return;
    if (lista) listaRef.current = lista;
    if (!audioRef.current) {
      const a = new window.Audio();
      a.preload = 'metadata';
      const medir = () => setTiempo({ pos: a.currentTime || 0, dur: isFinite(a.duration) ? a.duration : 0 });
      a.addEventListener('timeupdate', medir);
      a.addEventListener('loadedmetadata', medir);
      a.addEventListener('play', () => setSonando(true));
      a.addEventListener('pause', () => setSonando(false));
      a.addEventListener('ended', () => pasar(1));
      audioRef.current = a;
    }
    const a = audioRef.current;
    if (actualRef.current && actualRef.current.id === corito.id) {
      if (a.paused) a.play().catch(() => {}); else a.pause();
      return;
    }
    actualRef.current = corito;
    setActual(corito);
    setTiempo({ pos: 0, dur: 0 });
    a.src = urlCorito(corito.archivo);
    a.play().catch(() => {});
  };
  const pasar = (paso) => {
    const lista = listaRef.current || [];
    const i = lista.findIndex((c) => actualRef.current && c.id === actualRef.current.id);
    const siguiente = lista[i + paso];
    if (siguiente) tocar(siguiente); else detener();
  };
  const buscar = (proporcion) => { const a = audioRef.current; if (a && isFinite(a.duration)) a.currentTime = Math.min(Math.max(proporcion, 0), 1) * a.duration; };
  const quitarSiEs = (corito) => { if (actualRef.current && corito && actualRef.current.id === corito.id) { detener(); actualRef.current = null; setActual(null); } };
  return { actual, sonando, tiempo, tocar, pasar, buscar, quitarSiEs };
};

// Un corito en la lista: tocar para escuchar, ver la letra y (admin) borrarlo
const FilaCorito = ({ corito, rep, lista, onLetra, onBorrar, isDark, ancho }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const activo = rep.actual && rep.actual.id === corito.id;
  return (
    <View style={{ width: ancho || '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: activo ? paleta.fondo : colors.cardBg, borderWidth: 1, borderColor: activo ? paleta.fondo : colors.cardBorder, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 }}>
      <TouchableOpacity onPress={() => rep.tocar(corito, lista)} accessibilityLabel={`Escuchar ${corito.titulo}`} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: activo ? '#FFFFFF' : paleta.fondo }}>
        <Feather name={activo && rep.sonando ? 'pause' : 'play'} size={18} color={paleta.texto} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => rep.tocar(corito, lista)} style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: activo ? paleta.texto : colors.textMain }} numberOfLines={2}>{corito.titulo}</Text>
        {(corito.grupos || []).length > 0 ? <Text style={{ fontSize: 12, color: activo ? paleta.texto : colors.textSub, marginTop: 2 }}>{corito.grupos.join(' • ')}</Text> : null}
      </TouchableOpacity>
      {corito.letra ? (
        <TouchableOpacity onPress={() => onLetra(corito)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: activo ? paleta.texto : colors.cardBorder }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: activo ? paleta.texto : colors.textSub }}>Letra</Text>
        </TouchableOpacity>
      ) : null}
      {onBorrar ? (
        <TouchableOpacity onPress={() => onBorrar(corito)} style={{ padding: 6 }} accessibilityLabel="Borrar corito">
          <Feather name="trash-2" size={16} color={activo ? paleta.texto : colors.textSub} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// Mini reproductor: anterior, play/pausa, siguiente y barra de avance
const BarraReproductor = ({ rep, isDark }) => {
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const [anchoBarra, setAnchoBarra] = useState(1);
  if (!rep.actual) return null;
  const avance = rep.tiempo.dur > 0 ? rep.tiempo.pos / rep.tiempo.dur : 0;
  return (
    <View style={{ backgroundColor: paleta.fondo, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 18, marginTop: 6, marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Feather name="music" size={18} color={paleta.texto} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: paleta.texto }} numberOfLines={1}>{rep.actual.titulo}</Text>
        <TouchableOpacity onPress={() => rep.pasar(-1)} style={{ padding: 6 }} accessibilityLabel="Anterior"><Feather name="skip-back" size={18} color={paleta.texto} /></TouchableOpacity>
        <TouchableOpacity onPress={() => rep.tocar(rep.actual)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={rep.sonando ? 'Pausa' : 'Reproducir'}>
          <Feather name={rep.sonando ? 'pause' : 'play'} size={18} color={paleta.texto} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => rep.pasar(1)} style={{ padding: 6 }} accessibilityLabel="Siguiente"><Feather name="skip-forward" size={18} color={paleta.texto} /></TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={1} onLayout={(e) => setAnchoBarra(e.nativeEvent.layout.width || 1)} onPress={(e) => rep.buscar(e.nativeEvent.locationX / anchoBarra)} style={{ paddingVertical: 8, marginTop: 4 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.55)' }}>
          <View style={{ width: `${Math.round(avance * 100)}%`, height: 6, borderRadius: 3, backgroundColor: paleta.texto }} />
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: paleta.texto }}>{formatoTiempo(rep.tiempo.pos)}</Text>
        <Text style={{ fontSize: 11, color: paleta.texto }}>{formatoTiempo(rep.tiempo.dur)}</Text>
      </View>
    </View>
  );
};

// Ventana emergente con la letra
const ModalLetra = ({ corito, onCerrar, isDark }) => {
  const colors = getColors(isDark);
  return (
    <Modal visible={!!corito} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 40 }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.cardBorder, maxHeight: '86%', width: '90%', maxWidth: 520 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[styles.title, { color: colors.textMain, flex: 1 }]} numberOfLines={2}>{corito ? corito.titulo : ''}</Text>
            <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }}><Feather name="x" size={22} color={colors.textSub} /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textMain }}>{corito ? corito.letra : ''}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Ventana para que un administrador suba un corito nuevo
const ModalNuevoCorito = ({ visible, onCerrar, onGuardado, isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const inputRef = useRef(null);
  const [titulo, setTitulo] = useState('');
  const [letra, setLetra] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const limpiar = () => { setTitulo(''); setLetra(''); setGrupos([]); setArchivo(null); setMensaje(''); };
  const cerrar = () => { if (!guardando) { limpiar(); onCerrar(); } };
  const alternarGrupo = (g) => setGrupos((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  const guardar = async () => {
    if (!titulo.trim()) return setMensaje('Escribe el título del corito.');
    if (grupos.length === 0) return setMensaje('Elige al menos un grupo.');
    if (!archivo) return setMensaje('Elige el archivo de audio.');
    if (archivo.size > 15 * 1024 * 1024) return setMensaje('El audio pesa más de 15 MB. Comprímelo antes de subirlo (MP3 a 64 o 96 kbps).');
    setGuardando(true);
    setMensaje('Subiendo audio…');
    const extension = ((archivo.name || '').split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
    const ruta = `${Date.now()}_${sinAcentos(titulo).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'corito'}.${extension}`;
    const { error: errorSubida } = await supabase.storage.from('coritos').upload(ruta, archivo, { contentType: archivo.type || 'audio/mpeg', upsert: false });
    if (errorSubida) { setGuardando(false); return setMensaje('No se pudo subir el audio: ' + errorSubida.message); }
    const { error } = await supabase.from('coritos').insert([{ titulo: titulo.trim(), letra: letra.trim() || null, grupos, archivo: ruta }]);
    if (error) { await supabase.storage.from('coritos').remove([ruta]); setGuardando(false); return setMensaje('No se pudo guardar: ' + error.message); }
    setGuardando(false);
    limpiar();
    onGuardado();
  };
  const estiloInput = { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 10 };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
      <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 40 }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.cardBorder, maxHeight: '90%', width: '90%', maxWidth: 520 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Agregar corito</Text>
            <TouchableOpacity onPress={cerrar} style={{ padding: 6 }}><Feather name="x" size={22} color={colors.textSub} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput style={[styles.input, estiloInput]} placeholder="Título del corito" placeholderTextColor={colors.textSub} value={titulo} onChangeText={setTitulo} />
            <TextInput style={[styles.input, estiloInput, { minHeight: 120, textAlignVertical: 'top' }]} placeholder="Letra (opcional)" placeholderTextColor={colors.textSub} value={letra} onChangeText={setLetra} multiline />
            <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 8 }}>¿Para qué grupos? (la Tarde 4 a 8 usa los de Niños)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {GRUPOS_CORITOS.map((g) => (
                <TouchableOpacity key={g} onPress={() => alternarGrupo(g)} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: grupos.includes(g) ? paleta.texto : colors.cardBorder, backgroundColor: grupos.includes(g) ? paleta.fondo : colors.cardBg }}>
                  <Text style={{ color: grupos.includes(g) ? paleta.texto : colors.textMain, fontWeight: '600', fontSize: 13 }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {Platform.OS === 'web' ? (
              <input ref={inputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => { setArchivo(e.target.files[0] || null); e.target.value = ''; }} />
            ) : null}
            <TouchableOpacity onPress={() => inputRef.current && inputRef.current.click()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textSub, backgroundColor: colors.cardBg, marginBottom: 10 }}>
              <Feather name="music" size={20} color={colors.textSub} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{archivo ? archivo.name : 'Elegir audio'}</Text>
                <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 2 }}>{archivo ? `${(archivo.size / 1024 / 1024).toFixed(1)} MB • toca para cambiarlo` : 'MP3 recomendado, de preferencia menos de 2 MB'}</Text>
              </View>
            </TouchableOpacity>
            {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 6 }}>{mensaje}</Text> : null}
            <TouchableOpacity onPress={guardar} disabled={guardando} style={[styles.primaryButton, { backgroundColor: paleta.texto, opacity: guardando ? 0.6 : 1 }]}>
              {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar corito</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Ventana para que un administrador elija los coritos de una clase
const ModalLigarCoritos = ({ visible, claseId, grupo, onCerrar, isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const [coritos, setCoritos] = useState([]);
  const [ligados, setLigados] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    if (!visible || claseId === null || claseId === undefined) return;
    (async () => {
      setCargando(true);
      const [{ data: todos }, { data: ligas }] = await Promise.all([
        supabase.from('coritos').select('id, titulo, grupos').order('titulo', { ascending: true }),
        supabase.from('clase_coritos').select('corito_id').eq('clase_id', String(claseId)),
      ]);
      setCoritos((todos || []).filter((c) => (c.grupos || []).includes(grupo)));
      setLigados((ligas || []).map((l) => l.corito_id));
      setCargando(false);
    })();
  }, [visible, claseId, grupo]);
  const alternar = async (c) => {
    if (ligados.includes(c.id)) {
      setLigados((prev) => prev.filter((x) => x !== c.id));
      await supabase.from('clase_coritos').delete().eq('clase_id', String(claseId)).eq('corito_id', c.id);
    } else {
      setLigados((prev) => [...prev, c.id]);
      await supabase.from('clase_coritos').insert([{ clase_id: String(claseId), corito_id: c.id }]);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 40 }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.cardBorder, maxHeight: '86%', width: '90%', maxWidth: 520 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Coritos de la clase</Text>
            <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }}><Feather name="x" size={22} color={colors.textSub} /></TouchableOpacity>
          </View>
          {cargando ? <ActivityIndicator color={colors.textSub} /> : coritos.length === 0 ? (
            <Text style={{ color: colors.textSub, fontSize: 14 }}>Todavía no hay coritos de {grupo}. Súbelos primero en la sección Coritos del menú.</Text>
          ) : (
            <ScrollView>
              {coritos.map((c) => (
                <TouchableOpacity key={c.id} onPress={() => alternar(c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                  <Feather name={ligados.includes(c.id) ? 'check-circle' : 'circle'} size={20} color={ligados.includes(c.id) ? paleta.texto : colors.textSub} />
                  <Text style={{ flex: 1, fontSize: 15, color: colors.textMain }}>{c.titulo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Sección "Coritos" dentro de una clase (y en el repaso de la tarde)
const SeccionCoritos = ({ idsClases, grupo, isDark, puedeElegir }) => {
  const colors = getColors(isDark);
  const theme = getThemeColors(grupo, isDark);
  const rep = useReproductor();
  const [coritos, setCoritos] = useState([]);
  const [letra, setLetra] = useState(null);
  const [eligiendo, setEligiendo] = useState(false);
  const clave = JSON.stringify(idsClases || []);
  const cargar = () => coritosDeClases(idsClases).then(setCoritos);
  useEffect(() => { cargar(); }, [clave]);
  if (coritos.length === 0 && !puedeElegir) return null;
  return (
    <View style={styles.seccionDetalle}>
      <Text style={[styles.seccionTitulo, { color: theme.textDark }]}>Coritos</Text>
      {coritos.length === 0 ? <Text style={{ color: colors.textSub, fontSize: 14, marginBottom: 8 }}>Esta clase aún no tiene coritos.</Text> : null}
      {coritos.map((c) => <FilaCorito key={c.id} corito={c} rep={rep} lista={coritos} onLetra={setLetra} isDark={isDark} />)}
      <BarraReproductor rep={rep} isDark={isDark} />
      {puedeElegir ? (
        <TouchableOpacity onPress={() => setEligiendo(true)} style={[styles.solicitarBtnClaro, { backgroundColor: colors.background, borderColor: colors.cardBorder, marginTop: 6 }]}>
          <Feather name="music" size={16} color={colors.textSub} />
          <Text style={[styles.solicitarBtnClaroText, { color: colors.textSub }]}>Elegir coritos de esta clase</Text>
        </TouchableOpacity>
      ) : null}
      <ModalLetra corito={letra} onCerrar={() => setLetra(null)} isDark={isDark} />
      <ModalLigarCoritos visible={eligiendo} claseId={(idsClases || [])[0]} grupo={grupo} onCerrar={() => { setEligiendo(false); cargar(); }} isDark={isDark} />
    </View>
  );
};

// Ventana para tomar lista de una clase: buscar a un niño, o agregarlo si no existe
const ModalAsistencia = ({ visible, onCerrar, fecha, grupo, isDark, usuario }) => {
  const colors = getColors(isDark);
  const [paso, setPaso] = useState('inicio');
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarAsistentes = async () => {
    if (!fecha) return;
    const { data } = await supabase.from('asistencia_clases').select('id, nino_id, ninos(nombre_completo)').eq('fecha', fecha).eq('grupo', grupo).order('created_at', { ascending: true });
    setAsistentes(data || []);
  };

  useEffect(() => {
    if (visible) { setPaso('inicio'); setTexto(''); setResultados([]); setMensaje(''); cargarAsistentes(); }
  }, [visible]);

  useEffect(() => {
    if (paso !== 'buscar' || texto.trim().length < 2) { setResultados([]); return; }
    let cancelado = false;
    const espera = setTimeout(async () => {
      const { data } = await supabase.from('ninos').select('id, nombre_completo, grupo').ilike('nombre_completo', `%${texto.trim()}%`).order('nombre_completo', { ascending: true }).limit(15);
      if (!cancelado) setResultados(data || []);
    }, 250);
    return () => { cancelado = true; clearTimeout(espera); };
  }, [texto, paso]);

  const registrar = async (nino) => {
    if (asistentes.some((a) => a.nino_id === nino.id)) { setMensaje(`${nino.nombre_completo} ya está en la lista.`); return false; }
    const { error } = await supabase.from('asistencia_clases').insert([{ fecha, grupo, nino_id: nino.id, registrado_por: usuario }]);
    if (error) { setMensaje(error.code === '23505' ? `${nino.nombre_completo} ya está en la lista.` : 'No se pudo guardar: ' + error.message); return false; }
    await cargarAsistentes();
    return true;
  };

  const marcar = async (nino) => {
    setGuardando(true);
    const ok = await registrar(nino);
    setGuardando(false);
    if (ok) { setMensaje(`Registrado: ${nino.nombre_completo}`); setTexto(''); setResultados([]); }
  };

  const agregarYMarcar = async () => {
    const nombre = texto.trim().replace(/\s+/g, ' ');
    if (nombre.length < 3) { setMensaje('Escribe el nombre completo del niño.'); return; }
    setGuardando(true);
    const { data: existente } = await supabase.from('ninos').select('id, nombre_completo').ilike('nombre_completo', nombre).limit(1);
    if (existente && existente.length > 0) { setGuardando(false); setMensaje(`Ya existe "${existente[0].nombre_completo}". Búscalo y márcalo.`); return; }
    const { data: nuevo, error } = await supabase.from('ninos').insert([{ nombre_completo: nombre, grupo, creado_por: usuario }]).select('id, nombre_completo').single();
    if (error) { setGuardando(false); setMensaje('No se pudo agregar: ' + error.message); return; }
    const ok = await registrar(nuevo);
    setGuardando(false);
    if (ok) { setMensaje(`Registrado: ${nuevo.nombre_completo}`); setTexto(''); setPaso('inicio'); }
  };

  const quitar = async (id) => {
    const { data } = await supabase.from('asistencia_clases').delete().eq('id', id).select('id');
    if (!data || data.length === 0) setMensaje('No se pudo quitar de la lista.');
    await cargarAsistentes();
  };

  const fechaTexto = fecha ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const fechaBonita = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
  const estiloInput = { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 10 };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 40 }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.cardBorder, maxHeight: '88%' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Tomar lista</Text>
            <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }}><Feather name="x" size={22} color={colors.textSub} /></TouchableOpacity>
          </View>
          <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 16 }}>{fechaBonita} • {grupo}</Text>

          {paso === 'inicio' && (
            <>
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 0 }]} onPress={() => { setMensaje(''); setTexto(''); setPaso('buscar'); }}>
                <Feather name="search" size={16} color="#FFFFFF" />
                <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Buscar niño</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={() => { setMensaje(''); setTexto(''); setPaso('agregar'); }}>
                <Feather name="user-plus" size={16} color={colors.textMain} />
                <Text style={[styles.primaryButtonText, { color: colors.textMain, marginLeft: 8 }]}>Agregar niño</Text>
              </TouchableOpacity>
              {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 12 }}>{mensaje}</Text> : null}
              <Text style={{ color: colors.textMain, fontWeight: '700', marginTop: 20, marginBottom: 8 }}>Asistencia ({asistentes.length})</Text>
              <ScrollView style={{ maxHeight: 220 }}>
                {asistentes.length === 0 ? (
                  <Text style={{ color: colors.textSub, fontSize: 13 }}>Todavía no hay niños registrados en esta clase.</Text>
                ) : asistentes.map((a) => (
                  <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                    <Text style={{ flex: 1, color: colors.textMain, fontSize: 14 }}>{a.ninos ? a.ninos.nombre_completo : '—'}</Text>
                    <TouchableOpacity onPress={() => quitar(a.id)} style={{ padding: 6 }}><Feather name="x" size={16} color={colors.textSub} /></TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {paso === 'buscar' && (
            <>
              <TextInput style={[styles.input, estiloInput]} placeholder="Nombre del niño..." placeholderTextColor={colors.textSub} value={texto} onChangeText={(t) => { setTexto(t); setMensaje(''); }} autoFocus />
              {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 8 }}>{mensaje}</Text> : null}
              <ScrollView style={{ maxHeight: 200 }}>
                {resultados.map((n) => (
                  <TouchableOpacity key={n.id} onPress={() => marcar(n)} disabled={guardando} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textMain, fontSize: 14 }}>{n.nombre_completo}</Text>
                      <Text style={{ color: colors.textSub, fontSize: 12 }}>{n.grupo}</Text>
                    </View>
                    {asistentes.some((a) => a.nino_id === n.id) ? <Feather name="check-circle" size={18} color={colors.textSub} /> : <Feather name="plus-circle" size={18} color={colors.textMain} />}
                  </TouchableOpacity>
                ))}
                {texto.trim().length >= 2 && resultados.length === 0 && (
                  <View style={{ paddingVertical: 10 }}>
                    <Text style={{ color: colors.textSub, fontSize: 13 }}>No encontré a "{texto.trim()}".</Text>
                    <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={() => setPaso('agregar')}>
                      <Feather name="user-plus" size={16} color="#FFFFFF" />
                      <Text style={[styles.primaryButtonText, { marginLeft: 8, fontSize: 14 }]}>Agregarlo como niño nuevo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity onPress={() => { setPaso('inicio'); setTexto(''); setMensaje(''); }} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textSub, fontSize: 14 }}>Listo, volver a la lista</Text>
              </TouchableOpacity>
            </>
          )}

          {paso === 'agregar' && (
            <>
              <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 8 }}>Nombre completo del niño (quedará en el grupo {grupo}):</Text>
              <TextInput style={[styles.input, estiloInput]} placeholder="Nombre y apellido" placeholderTextColor={colors.textSub} value={texto} onChangeText={(t) => { setTexto(t); setMensaje(''); }} autoFocus />
              {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 8 }}>{mensaje}</Text> : null}
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 4 }]} onPress={agregarYMarcar} disabled={guardando}>
                {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar y marcar asistencia</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setPaso('inicio'); setTexto(''); setMensaje(''); }} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textSub, fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// PANTALLA 0: LOGIN
// ==========================================
function LoginScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [pinLogin, setPinLogin] = useState('');
    const [ingresando, setIngresando] = useState(false);
  const { width: anchoVentana, height: altoVentana } = useWindowDimensions();
  const esTactil = Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  const compacto = esTactil && anchoVentana > altoVentana;
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '' });

  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });

    async function iniciarSesion() {
    if (!usuarioLogin || !pinLogin) return setAlerta({ visible: true, titulo: "Aviso", mensaje: "Ingresa tu usuario y PIN." });
    setIngresando(true);
    try {
      const email = `${usuarioLogin.trim().toLowerCase()}@indus.app`;
      const password = `IndusApp-${pinLogin.trim()}`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.session) {
        setAlerta({ visible: true, titulo: "Acceso denegado", mensaje: "Usuario o PIN incorrectos." });
      } else {
        const { data, error } = await supabase.from('maestros').select('*').eq('user_id', authData.user.id).single();
        if (error || !data) {
          setAlerta({ visible: true, titulo: "Error", mensaje: "No se encontró tu perfil de maestro." });
        } else {
                    usuarioActivoGlobal = data.nombre_usuario;
          rolUsuarioActivoGlobal = data.rol;
          equipoActivoGlobal = data.equipo;
                    vincularOneSignal(data.nombre_usuario);
          setUsuarioLogin(''); setPinLogin('');
                    navigation.replace('MenuPrincipal');
        }
      }
    } catch (error) { setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo iniciar sesión." }); } finally { setIngresando(false); }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: compacto ? 'flex-start' : 'center', alignItems: 'center', padding: 20, paddingTop: compacto ? 12 : 20 }}>
                    <View style={{ width: '100%', maxWidth: 450 }}>
                        <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: compacto ? 110 : 180, height: compacto ? 78 : 128, resizeMode: 'contain', alignSelf: 'center', marginBottom: compacto ? 12 : 30 }} />
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>Usuario</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholderTextColor={colors.textSub} value={usuarioLogin} onChangeText={(t) => setUsuarioLogin(t.replace(/\s/g, '').toLowerCase())} autoCapitalize="none" autoCorrect={false} spellCheck={false}/>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>PIN</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholderTextColor={colors.textSub} value={pinLogin} onChangeText={setPinLogin} keyboardType="numeric" maxLength={4} secureTextEntry={true}/>
            </View>
            <TouchableOpacity style={[styles.primaryButton, ingresando && styles.buttonDisabled]} onPress={iniciarSesion} disabled={ingresando}>
              {ingresando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AlertaPersonalizada visible={alerta.visible} titulo={alerta.titulo} mensaje={alerta.mensaje} onConfirmar={cerrarAlerta} isDark={isDark} />
    </SafeAreaView>
  );
}
// ==========================================
// PANTALLA 1: MENÚ PRINCIPAL
// ==========================================
function MenuPrincipalScreen({ navigation }) {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });
        const [tieneRol, setTieneRol] = useState(false);
  const [tieneClases, setTieneClases] = useState(false);
    const [mostrarAjustes, setMostrarAjustes] = useState(false);
        const [hayNotificaciones, setHayNotificaciones] = useState(false);
    const [avisosPush, setAvisosPush] = useState(estadoAvisos());
    const columnas = useColumnas();
  const esTablet = columnas >= 2;
  const tarjetas = [
    tieneClases && { icono: 'smile', titulo: 'Clases de niños', categoria: 'Clases de niños', onPress: () => navigation.navigate('Grupos') },
        tieneRol && { icono: 'calendar', titulo: 'Rol de predicaciones', categoria: 'Predicaciones', onPress: () => navigation.navigate('MiRol') },
    { icono: 'music', titulo: 'Coritos', categoria: 'Coritos', onPress: () => navigation.navigate('Coritos') },
    { icono: 'volume-2', titulo: 'Anuncios', categoria: 'Anuncios', pronto: true, onPress: () => proximamente(getThemeColors('Anuncios', isDark).textDark) },
    { icono: 'heart', titulo: 'Petición de oración', categoria: 'Petición', pronto: true, onPress: () => proximamente(getThemeColors('Petición', isDark).textDark) },
    { icono: 'calendar', titulo: 'Calendario de actividades', categoria: 'Calendario', pronto: true, onPress: () => proximamente(getThemeColors('Calendario', isDark).textDark) },
  ].filter(Boolean);

    useFocusEffect(
    React.useCallback(() => {
                                    setAvisosPush(estadoAvisos());
      iniciarOneSignal().then(() => setAvisosPush(estadoAvisos()));
      const revisarNotificaciones = async () => {
        const { items, vistas } = await obtenerNotificaciones();
        setHayNotificaciones(items.some((n) => n.accion || !vistas.includes(n.clave)));
      };
      revisarNotificaciones();
      const temporizador = setInterval(revisarNotificaciones, 30000);
      if (rolUsuarioActivoGlobal === 'administrador') { setTieneRol(true); setTieneClases(true); return () => clearInterval(temporizador); }
      (async () => {
        const hoy = fechaISO(new Date());
        const { data } = await supabase.from('programa_servicios').select('id').ilike('nombre_usuario', usuarioActivoGlobal).gte('fecha', hoy);
        setTieneRol(data && data.length > 0);
      })();
            (async () => {
        const { data } = await supabase.from('clases_asignadas').select('id').or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`).gte('fecha', fechaISO(new Date())).limit(1);
        setTieneClases(!!(data && data.length > 0));
      })();
            return () => clearInterval(temporizador);
    }, [])
  );

   const cerrarSesion = async () => {
        await supabase.auth.signOut();
    cerrarOneSignal();
    usuarioActivoGlobal = null;
    rolUsuarioActivoGlobal = null;
    navigation.replace('Login');
  };

  const confirmarCerrarSesion = () => {
    setAlerta({
      visible: true,
      titulo: "Cerrar sesión",
      mensaje: "¿Seguro que quieres cerrar tu sesión?",
            textoConfirmar: "Sí, cerrar sesión",
      themeColor: '#4A5568',
      onCancelar: cerrarAlerta,
      isDark: isDark,
      onConfirmar: () => { cerrarAlerta(); cerrarSesion(); }
    });
  };

    const proximamente = (color) => {
    setAlerta({ visible: true, titulo: "Próximamente", mensaje: "Esta sección todavía se está construyendo.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: color });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
                <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: esTablet ? 1100 : 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => setMostrarAjustes(true)} style={{ padding: 8 }}>
            <Feather name="settings" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 90, height: 64, resizeMode: 'contain' }} />
          </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Notificaciones')} style={{ padding: 8 }}>
            <IconoNotificacion size={28} color={colors.textSub} activo={hayNotificaciones} />
          </TouchableOpacity>
        </View>

                                                                {avisosPush !== 'activo' && avisosPush !== 'no-soportado' && (
          <View style={{ width: '95%', maxWidth: esTablet ? 1100 : 850, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 14 }}>
            <Feather name="bell-off" size={20} color={colors.textSub} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 13, color: colors.textMain }}>
              {avisosPush === 'pendiente' ? 'Activa los avisos para enterarte de las solicitudes de apoyo.' : avisosPush === 'bloqueado' ? 'Los avisos están bloqueados. Actívalos en los ajustes de tu teléfono o navegador.' : 'Para recibir avisos, instala la app en tu pantalla de inicio.'}
            </Text>
            {avisosPush === 'pendiente' && (
              <TouchableOpacity onPress={async () => setAvisosPush(await activarAvisos())} style={{ marginLeft: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.textMain }}>
                <Text style={{ color: colors.background, fontWeight: '700', fontSize: 13 }}>Activar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={[styles.gruposContainer, { width: '95%', maxWidth: esTablet ? 1100 : 850 }, esTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          {tarjetas.map((t, i) => (
            <TarjetaMenu key={t.titulo} {...t} isDark={isDark} columnas={columnas} esUltima={i === tarjetas.length - 1} total={tarjetas.length} />
          ))}
        </View>

        {rolUsuarioActivoGlobal === 'administrador' && (
          <TouchableOpacity style={[styles.adminButton, { width: '95%', maxWidth: 850 }]} onPress={() => navigation.navigate('Admin')}>
            <Feather name="settings" size={16} color={colors.textSub} />
            <Text style={[styles.adminButtonText, { color: colors.textSub }]}>Panel Admin</Text>
          </TouchableOpacity>
        )}
            </ScrollView>
            <AlertaPersonalizada {...alerta} />
      <PanelAjustes visible={mostrarAjustes} onCerrar={() => setMostrarAjustes(false)} isDark={isDark} toggleTheme={toggleTheme} onCerrarSesion={confirmarCerrarSesion} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: MI ROL
// ==========================================
function MiRolScreen({ navigation, route }) {
  // Si se abre desde un aviso, baja hasta esa fecha, la resalta y hace parpadear el botón de confirmar
  const servicioId = route?.params?.servicioId;
  const scrollRolRef = useRef(null);
  const yaDesplazadoRol = useRef(false);
  const listaRolY = useRef(0);
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!servicioId) return;
    yaDesplazadoRol.current = false;
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.4, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulso, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [servicioId]);
  const esObjetivo = (item) => !!servicioId && String(item.id) === String(servicioId);
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
    const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mapaNombres, setMapaNombres] = useState({});
const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });
  const [mostrarModalApoyo, setMostrarModalApoyo] = useState(false);
  const [itemApoyo, setItemApoyo] = useState(null);
    const [maestrosElegibles, setMaestrosElegibles] = useState([]);
  const [refrescando, setRefrescando] = useState(false);

  const cargarRol = async () => {
      const hoy = fechaISO(new Date());
      let consulta = supabase.from('programa_servicios').select('*').gte('fecha', hoy).order('fecha', { ascending: true });
      if (rolUsuarioActivoGlobal !== 'administrador') {
        consulta = consulta.ilike('nombre_usuario', usuarioActivoGlobal);
      }
            const { data } = await consulta;
      const ordenado = (data || []).sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return parsearHorarioMinutos(a.horario) - parsearHorarioMinutos(b.horario);
      });
      setFechas(ordenado);

            if (rolUsuarioActivoGlobal === 'administrador') {
        const { data: maestros } = await supabase.from('maestros').select('nombre_usuario, nombre_completo');
        const mapa = {};
        (maestros || []).forEach((m) => { mapa[m.nombre_usuario.toLowerCase()] = m.nombre_completo; });
        setMapaNombres(mapa);
      }

      const { data: elegibles } = await supabase.rpc('nombres_publicos');
      setMaestrosElegibles((elegibles || []).filter((m) => m.elegible_predicaciones));
  };

    useFocusEffect(
    React.useCallback(() => {
      cargarRol().then(() => setCargando(false));
    }, [])
  );

    const onRefresh = React.useCallback(async () => {
    setRefrescando(true);
    await cargarRol();
    setRefrescando(false);
  }, []);

  const confirmarAsistencia = async (item) => {
    await supabase.from('programa_servicios').update({ estado_confirmacion: 'confirmado' }).eq('id', item.id);
    setFechas((prev) => prev.map((f) => f.id === item.id ? { ...f, estado_confirmacion: 'confirmado' } : f));
  };

    const formatearFecha = (fechaTexto) => {
    const fecha = new Date(fechaTexto + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

        const enviarSolicitudApoyo = async (item, opciones = {}) => {
    const { destino = null, tipo = null, fechaIntercambioId = null } = opciones;
    const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('programa_servicio_id', item.id).eq('estado', 'Pendiente');
    if (existente && existente.length > 0) {
      setAlerta({ visible: true, titulo: "Ya existe", mensaje: "Ya hay una solicitud de apoyo pendiente para esta fecha.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#2C4A73' });
      return;
    }
    const tipoCalc = calcularTipo(item.fecha, item.horario);
        const { error } = await supabase.from('solicitudes_sustitucion').insert([{
            mes_anio: formatearFecha(item.fecha),
      titulo_tema: `${tipoCalc} • ${item.horario}`,
            grupo_clase: 'Predicaciones',
      maestro_solicitante: item.nombre_usuario,
      programa_servicio_id: item.id,
      fecha_referencia: item.fecha,
      maestro_destino: destino,
      tipo_intercambio: tipo,
      programa_servicio_id_intercambio: fechaIntercambioId,
    }]);
    if (error) {
      setAlerta({ visible: true, titulo: "Error", mensaje: error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: "Listo", mensaje: destino ? "Tu solicitud se envió directamente a esa persona." : "Tu solicitud ya aparece en el tablón de apoyo.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#2C4A73' });
    }
  };

  return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView ref={scrollRolRef} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colors.textSub} />}>
                <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
                    <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>{rolUsuarioActivoGlobal === 'administrador' ? 'Rol de predicaciones' : 'Mi rol'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>{rolUsuarioActivoGlobal === 'administrador' ? 'Todas las fechas asignadas' : 'Tus próximas fechas'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
                </View>

        <TouchableOpacity style={[styles.tablonButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '95%', maxWidth: 850, marginBottom: 15 }]} onPress={() => navigation.navigate('Tablon', { soloGrupo: 'Predicaciones' })}>
          <Feather name="clipboard" size={20} color={colors.textSub} />
          <Text style={[styles.tablonButtonText, { color: colors.textSub }]}>Solicitudes de Apoyo</Text>
        </TouchableOpacity>

                <View style={{ width: '95%', maxWidth: 850 }} onLayout={(e) => { listaRolY.current = e.nativeEvent.layout.y; }}>
          {cargando && <ActivityIndicator style={{ marginTop: 20 }} color={colors.textSub} />}
                    {!cargando && fechas.length === 0 && (
            <Text style={{ color: colors.textSub, textAlign: 'center', marginTop: 20 }}>{rolUsuarioActivoGlobal === 'administrador' ? 'No hay fechas programadas.' : 'No tienes fechas próximas.'}</Text>
          )}
                    {Object.entries(
            fechas.reduce((acc, item) => {
              (acc[item.fecha] = acc[item.fecha] || []).push(item);
              return acc;
            }, {})
          ).map(([fecha, items]) => (
                        <View key={fecha} onLayout={(e) => { if (servicioId && !yaDesplazadoRol.current && items.some(esObjetivo) && scrollRolRef.current) { yaDesplazadoRol.current = true; const y = listaRolY.current + e.nativeEvent.layout.y - 10; setTimeout(() => { if (scrollRolRef.current) scrollRolRef.current.scrollTo({ y: Math.max(0, y), animated: true }); }, 150); } }} style={{ flexDirection: 'row', marginBottom: 14 }}>
                                      <View style={{ width: 56, alignItems: 'center', paddingTop: 14 }}>
                <Text style={{ fontSize: 21, fontWeight: '700', color: colors.textMain }}>{['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(fecha + 'T00:00:00').getDay()]}</Text>
                <Text style={{ fontSize: 13, color: colors.textSub }}>{new Date(fecha + 'T00:00:00').getDate()} {new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.cardBg, borderRadius: 28, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 16 }}>
                {items.map((item, idx) => {
                  const tipoCalculado = calcularTipo(item.fecha, item.horario);
                  const esClase = tipoCalculado === 'Clase';
                  const tintBg = esClase ? '#EDF2FA' : '#FBEAE0';
                  const tintText = esClase ? '#3A5A8A' : '#A65A2E';
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, ...(esObjetivo(item) ? { backgroundColor: isDark ? 'rgba(126, 160, 216, 0.18)' : '#EDF2FA', borderRadius: 18, marginHorizontal: -8, paddingHorizontal: 8 } : {}) }}>
                      <View style={{ width: 36, height: 36, borderRadius: 14, backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name={esClase ? "calendar" : "mic"} size={16} color={tintText} />
                      </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, color: colors.textMain }}>{item.horario}{rolUsuarioActivoGlobal === 'administrador' ? ` • ${mapaNombres[item.nombre_usuario.toLowerCase()] || item.nombre_usuario}` : ''}</Text>
                        {esObjetivo(item) && item.estado_confirmacion !== 'confirmado' && item.nombre_usuario.toLowerCase() === usuarioActivoGlobal.toLowerCase() && (
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9FBCE8' : '#2C4A73', marginTop: 3 }}>Confirma aquí tu asistencia 👉</Text>
                        )}
                      </View>
                                            {item.usuario_original && (
                        <Text style={{ fontSize: 11, color: colors.textSub, textDecorationLine: 'line-through', marginRight: 2 }}>{mapaNombres[item.usuario_original.toLowerCase()] || item.usuario_original}</Text>
                      )}
                                                                  {item.nombre_usuario.toLowerCase() === usuarioActivoGlobal.toLowerCase() ? (
                        item.estado_confirmacion !== 'confirmado' && (
                          <TouchableOpacity onPress={() => confirmarAsistencia(item)} style={{ padding: 6 }}>
                            <Animated.View style={{ transform: [{ scale: esObjetivo(item) ? pulso : 1 }] }}><Feather name="thumbs-up" size={18} color={esObjetivo(item) ? (isDark ? '#9FBCE8' : '#2C4A73') : colors.textSub} /></Animated.View>
                          </TouchableOpacity>
                        )
                      ) : (
                        rolUsuarioActivoGlobal === 'administrador' && item.estado_confirmacion !== 'confirmado' && (
                          <Feather name="clock" size={16} color="#C9A227" />
                        )
                      )}
                                            {(item.nombre_usuario.toLowerCase() === usuarioActivoGlobal.toLowerCase() || rolUsuarioActivoGlobal === 'administrador') && (
                        <TouchableOpacity onPress={() => { setItemApoyo(item); setMostrarModalApoyo(true); }} style={{ padding: 6, marginLeft: 2 }}>
                          <Feather name="repeat" size={18} color={colors.textSub} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
                </View>
            </ScrollView>
      <AlertaPersonalizada {...alerta} />
      <ModalSolicitarApoyo
        visible={mostrarModalApoyo}
        maestrosElegibles={maestrosElegibles}
        usuarioPropio={usuarioActivoGlobal}
        isDark={isDark}
        onCancelar={() => setMostrarModalApoyo(false)}
        item={itemApoyo}
        onConfirmar={async (opciones) => { setMostrarModalApoyo(false); await enviarSolicitudApoyo(itemApoyo, opciones); }}
      />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA 1b: GRUPOS (clases de niños)
// ==========================================
function GruposScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const columnas = useColumnas();
  const anchoMax = columnas >= 2 ? 1100 : 850;
    const esAdmin = rolUsuarioActivoGlobal === 'administrador';
  const [asignaciones, setAsignaciones] = useState([]);
    const [cargandoAsig, setCargandoAsig] = useState(true);
    const [coordinadoresAdmin, setCoordinadoresAdmin] = useState([]);
  const [mapaNombres, setMapaNombres] = useState({});
  useEffect(() => { cargarMapaNombres().then(setMapaNombres); }, []);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);
  useFocusEffect(
    React.useCallback(() => {
                          if (esAdmin) {
        (async () => {
          const hoy = new Date();
          const { data } = await supabase.from('clases_asignadas').select('mes_anio, coordinador, fecha').gte('fecha', fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1))).order('fecha', { ascending: true }).range(0, 4999);
          const lista = [];
          (data || []).forEach((r) => { if (r.coordinador && !lista.some((x) => x.mes_anio === r.mes_anio && x.coordinador === r.coordinador)) lista.push({ mes_anio: r.mes_anio, coordinador: r.coordinador }); });
          setCoordinadoresAdmin(lista);
          setCargandoAsig(false);
        })();
        return;
      }
      (async () => {
        const { data } = await supabase.from('clases_asignadas').select('fecha, grupo, mes_anio, coordinador').ilike('nombre_usuario', usuarioActivoGlobal).gte('fecha', fechaISO(new Date())).in('grupo', ORDEN_GRUPOS).order('fecha', { ascending: true });
        setAsignaciones(data || []);
        setCargandoAsig(false);
      })();
    }, [])
  );
    const [filasVista, setFilasVista] = useState([]);
  const [soyCoordinador, setSoyCoordinador] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const hoy = new Date();
        const yo = (usuarioActivoGlobal || '').toLowerCase();
        let consulta = supabase.from('clases_asignadas').select('fecha, grupo, mes_anio, coordinador, nombre_usuario, usuario_original').gte('fecha', fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1))).order('fecha', { ascending: true }).range(0, 4999);
        if (!esAdmin) consulta = consulta.or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`);
        const { data } = await consulta;
        const filas = data || [];
        const coordina = filas.filter((r) => (r.coordinador || '').toLowerCase() === yo);
        setSoyCoordinador(coordina.length > 0);
        setFilasVista(esAdmin ? filas : coordina);
      })();
    }, [])
  );
  const vistaCompleta = esAdmin || soyCoordinador;
  const mesRef = filasVista.length > 0 ? filasVista[0].mes_anio : null;
  const coordinadorMes = (filasVista.find((r) => r.mes_anio === mesRef && r.coordinador) || {}).coordinador || null;
  const asignadosA = (g) => {
    const nombres = [];
    filasVista.filter((r) => r.mes_anio === mesRef && r.grupo === g).forEach((r) => { const n = nombreDe(r.usuario_original || r.nombre_usuario); if (!nombres.includes(n)) nombres.push(n); });
    return nombres.length > 0 ? `Asignado a: ${nombres.join(', ')}` : 'Sin asignar';
  };
    const abrirGrupo = (g) => { const destino = destinoDeGrupo(g); navigation.navigate(destino.pantalla, destino.params); };
  const gruposAsignados = [];
  asignaciones.forEach((a) => {
    const clave = `${a.mes_anio}|${a.grupo}`;
    if (gruposAsignados.some((g) => g.clave === clave)) return;
        gruposAsignados.push({ clave, icono: (GRUPOS_INFO[a.grupo] || {}).icono || 'smile', titulo: a.grupo, subtitulo: a.mes_anio, categoria: a.grupo, onPress: () => abrirGrupo(a.grupo) });
  });
  const coordinador = asignaciones.length > 0 ? asignaciones[0].coordinador : null;
    const gruposAdmin = ORDEN_GRUPOS.map((g) => ({ icono: GRUPOS_INFO[g].icono, titulo: g, subtitulo: `${GRUPOS_INFO[g].turno} • ${GRUPOS_INFO[g].edades}`, categoria: g, onPress: () => abrirGrupo(g) }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: anchoMax, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Clases de niños</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Selecciona el grupo a impartir</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

                                <TouchableOpacity style={[styles.tablonButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '95%', maxWidth: anchoMax, marginBottom: 15 }]} onPress={() => navigation.navigate('Tablon', { excluirGrupo: 'Predicaciones' })}>
          <Feather name="clipboard" size={20} color={colors.textSub} />
          <Text style={[styles.tablonButtonText, { color: colors.textSub }]}>Solicitudes de Apoyo</Text>
        </TouchableOpacity>

                                {vistaCompleta && coordinadorMes ? (
          <View style={[styles.tablonButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '95%', maxWidth: anchoMax, marginBottom: 15 }]}>
            <Feather name="user" size={20} color={colors.textSub} />
            <Text style={[styles.tablonButtonText, { color: colors.textSub }]}>Coordinador de {mesRef}: {nombreDe(coordinadorMes)}</Text>
          </View>
        ) : null}
        {!vistaCompleta && coordinador ? (
          <View style={[styles.tablonButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '95%', maxWidth: anchoMax, marginBottom: 15 }]}>
            <Feather name="user" size={20} color={colors.textSub} />
            <Text style={[styles.tablonButtonText, { color: colors.textSub }]}>Mi coordinador: {nombreDe(coordinador)}</Text>
          </View>
        ) : null}
        {!vistaCompleta && !cargandoAsig && gruposAsignados.length === 0 ? (
          <Text style={{ color: colors.textSub, fontSize: 14, marginTop: 20, textAlign: 'center' }}>No tienes clases asignadas por ahora.</Text>
        ) : null}
        <View style={[styles.gruposContainer, { width: '95%', maxWidth: anchoMax }, columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          {(vistaCompleta ? gruposAdmin.map((g) => ({ ...g, detalle: asignadosA(g.titulo) })) : gruposAsignados).map((g, i, arr) => (
            <TarjetaMenu key={g.clave || g.titulo} {...g} isDark={isDark} columnas={columnas} esUltima={i === arr.length - 1} total={arr.length} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: NOTIFICACIONES
// ==========================================
function NotificacionesScreen({ navigation }) {
  const [vistasPrevias, setVistasPrevias] = useState([]);
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const [solicitudes, setSolicitudes] = useState([]);
  const [mapaNombres, setMapaNombres] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
            const { items, vistas } = await obtenerNotificaciones();
      setVistasPrevias(vistas);
      await marcarNotificacionesVistas(items);
      const nuevas = items.filter((n) => n.accion || n.abierta || !vistas.includes(n.clave));
      const yaVistas = items.filter((n) => !n.accion && !n.abierta && vistas.includes(n.clave));
      setSolicitudes([...nuevas, ...yaVistas]);
      const { data: nombres } = await supabase.rpc('nombres_publicos');
      const mapa = {};
      (nombres || []).forEach((m) => { mapa[m.nombre_usuario.toLowerCase()] = m.nombre_completo; });
      setMapaNombres(mapa);
      setCargando(false);
    })();
  }, []);

  const nombreBonito = (usuario) => mapaNombres[(usuario || '').toLowerCase()] || usuario;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Notificaciones</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        <View style={{ width: '95%', maxWidth: 850, paddingTop: 20 }}>
          {cargando ? (
            <ActivityIndicator color={colors.textSub} style={{ marginTop: 40 }} />
          ) : solicitudes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Feather name="bell-off" size={40} color={colors.textSub} />
              <Text style={{ color: colors.textSub, fontSize: 14, marginTop: 15, textAlign: 'center' }}>Aún no tienes notificaciones para revisar aquí.</Text>
            </View>
          ) : (
            <>
              <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 15 }}>Tus avisos y recordatorios:</Text>
              {solicitudes.map((s) => (
                                <TouchableOpacity key={s.clave} activeOpacity={0.8} onPress={() => navigation.navigate(s.destino ? s.destino.pantalla : 'Tablon', s.destino ? s.destino.params : {})} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 12, opacity: (!s.accion && !s.abierta && vistasPrevias.includes(s.clave)) ? 0.5 : 1 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 15 }}>{s.mensaje}</Text>
                    <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 2 }}>{s.detalle}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textSub} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: TODOS LOS USUARIOS
// ==========================================
function TodosUsuariosScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const [maestros, setMaestros] = useState([]);
  const [cargando, setCargando] = useState(true);

    useEffect(() => {
    (async () => {
      const { data } = await supabase.from('maestros').select('*').order('nombre_usuario', { ascending: true });
      setMaestros(data || []);
      setCargando(false);
    })();
  }, []);

  const descargarCSV = () => {
    const encabezados = ['Usuario', 'Nombre completo', 'PIN', 'Celular', 'Rol', 'Elegible Clases de niños', 'Elegible Predicaciones y Clases'];
    const filas = maestros.map((m) => [
      m.nombre_usuario,
      m.nombre_completo || '',
      m.pin_acceso,
      m.telefono || '',
      m.rol,
      m.elegible_clases_ninos ? 'Sí' : 'No',
      m.elegible_predicaciones ? 'Sí' : 'No',
    ]);
    const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const csv = [encabezados, ...filas].map((fila) => fila.map(escapar).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `usuarios_indus_${fechaISO(new Date())}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Todos los usuarios</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>{maestros.length} en total</Text>
          </View>
                    <TouchableOpacity onPress={descargarCSV} style={{ padding: 8 }}>
            <Feather name="download" size={20} color={colors.textSub} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        <View style={{ width: '95%', maxWidth: 850 }}>
          {cargando && <ActivityIndicator style={{ marginTop: 20 }} color={colors.textSub} />}
                    {!cargando && maestros.map((maestro) => (
            <TouchableOpacity key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => navigation.navigate('DetalleUsuario', { maestro })}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userTextName, { color: colors.textMain }]}>{maestro.nombre_completo || maestro.nombre_usuario}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: DETALLE DE USUARIO
// ==========================================
function DetalleUsuarioScreen({ route, navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const [maestro, setMaestro] = useState(route.params.maestro);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });

  const compartirWhatsApp = () => {
    const numeroLimpio = (maestro.telefono || '').replace(/\D/g, '');
    if (!numeroLimpio) {
      return setAlerta({ visible: true, titulo: "Sin número", mensaje: "Esta persona no tiene un número celular guardado.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#EFBC68' });
    }
    const mensaje = `¡Hola! Aquí tienes tus accesos.\n\n👤 Usuario: ${maestro.nombre_usuario}\n🔑 PIN: ${maestro.pin_acceso}`;
    Linking.openURL(`https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`);
  };

  const copiarInfo = async () => {
    await Clipboard.setStringAsync(`Usuario: ${maestro.nombre_usuario}\nPIN: ${maestro.pin_acceso}`);
    setAlerta({ visible: true, titulo: "Copiado", mensaje: "La información se copió al portapapeles.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#7EA0D8' });
  };

  const recargar = async () => {
    const { data } = await supabase.from('maestros').select('*').eq('id', maestro.id).single();
    if (data) setMaestro(data);
  };

  const guardarEdicion = async (datos) => {
    setMostrarModal(false);
    await supabase.from('maestros').update({
            telefono: datos.telefono,
      nombre_completo: datos.nombre_completo,
      elegible_clases_ninos: datos.elegible_clases_ninos,
      elegible_predicaciones: datos.elegible_predicaciones,
    }).eq('id', maestro.id);
    recargar();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>{maestro.nombre_completo || maestro.nombre_usuario}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        <View style={{ width: '95%', maxWidth: 850 }}>
          <Text style={[styles.label, { color: colors.textSub }]}>Nombre completo</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 12 }}>{maestro.nombre_completo || '(sin definir)'}</Text>

          <Text style={[styles.label, { color: colors.textSub }]}>Celular</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 12 }}>{maestro.telefono || '(sin definir)'}</Text>

          <Text style={[styles.label, { color: colors.textSub }]}>Usuario de acceso</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 12 }}>{maestro.nombre_usuario}</Text>

          <Text style={[styles.label, { color: colors.textSub }]}>PIN</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 12 }}>{maestro.pin_acceso}</Text>

          <Text style={[styles.label, { color: colors.textSub }]}>Elegible para</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 4 }}>{maestro.elegible_clases_ninos ? '✓' : '✗'} Clases de niños</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 20 }}>{maestro.elegible_predicaciones ? '✓' : '✗'} Predicaciones y Clases</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 0 }]} onPress={compartirWhatsApp}>
              <Feather name="share-2" size={16} color={colors.textMain} />
              <Text style={[styles.primaryButtonText, { color: colors.textMain, marginLeft: 8 }]}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 0 }]} onPress={copiarInfo}>
              <Feather name="copy" size={16} color={colors.textMain} />
              <Text style={[styles.primaryButtonText, { color: colors.textMain, marginLeft: 8 }]}>Copiar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setMostrarModal(true)}>
            <Text style={styles.primaryButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ModalEdicion visible={mostrarModal} maestro={maestro} onCancelar={() => setMostrarModal(false)} onGuardar={guardarEdicion} isDark={isDark} />
      <AlertaPersonalizada {...alerta} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA 2: TEMAS MENSUALES
// ==========================================
function TemasScreen({ route, navigation }) {
  const { grupo } = route.params;
  const { isDark } = useContext(ThemeContext);
  const [temas, setTemas] = useState([]);
  const [cargando, setCargando] = useState(true);
        const [verFuturo, setVerFuturo] = useState(!!route?.params?.verFuturo);
  const columnas = useColumnas();
  const theme = getThemeColors(grupo, isDark);
  const colors = getColors(isDark);

  useEffect(() => {
    async function obtenerTemas() {
      let { data, error } = await supabase.from('temas_mensuales').select('*').order('orden', { ascending: true });
      if (!error) setTemas(data);
      setCargando(false);
    }
    obtenerTemas();
  }, []);

  const ordenActual = (() => {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    if (añoActual < 2027) return 1; 
    return (añoActual - 2027) * 12 + hoy.getMonth() + 1;
  })();

  const temasFiltrados = temas.filter((tema) => verFuturo ? tema.orden >= ordenActual : tema.orden === ordenActual);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
                <View style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, flex: 1, paddingBottom: 20 }}>
                    <View style={styles.headerRowSpaceBetween}>
            <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
              <Feather name="arrow-left" size={22} color={colors.textSub} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titleMini, { color: colors.textMain }]}>TEMARIO</Text>
              <Text style={[styles.subtitle, { color: theme.textDark }]}>Grupo: {grupo}</Text>
            </View>
                                    <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')} style={{ marginLeft: 10 }}>
              <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 40, height: 29, resizeMode: 'contain' }} />
            </TouchableOpacity>
          </View>
          
          {cargando ? (
            <View style={styles.center}><ActivityIndicator size="large" color={theme.main} /></View>
          ) : (
                        <View style={[styles.listContainer, columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
              {temasFiltrados.map((tema) => (
                <TarjetaLista key={tema.id} icono="calendar" titulo={tema.titulo_tema} subtitulo={tema.mes_anio} categoria={grupo} isDark={isDark} ancho={columnas >= 2 ? '48.5%' : '100%'} onPress={() => navigation.navigate('Clases', { tema: tema, grupo: grupo })} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA 3: INDICE DE CLASES DEL MES
// ==========================================
function ClasesScreen({ route, navigation }) {
  const { tema, grupo } = route.params;
  const { isDark } = useContext(ThemeContext);
    const [clasesReales, setClasesReales] = useState([]);
  const [fechasPermitidas, setFechasPermitidas] = useState(null);
  const fechaDeClase = (c) => { const mes = parsearMesAnio(tema.mes_anio); return mes ? (domingosDelMes(mes.getFullYear(), mes.getMonth())[c.numero_clase - 1] || null) : null; };
        // Los maestros solo ven sus clases que aún no pasan; coordinadores y administradores ven todas
    const hoyClases = fechaISO(new Date());
    const yaPaso = (c) => { const f = fechaDeClase(c); return !!f && f < hoyClases; };
    const clasesVisibles = fechasPermitidas ? clasesReales.filter((c) => fechasPermitidas.includes(fechaDeClase(c)) && !yaPaso(c)) : clasesReales;
    const [filasMes, setFilasMes] = useState([]);
  const [pendientesIds, setPendientesIds] = useState([]);
  const enfocada = useIsFocused();
    const fechaBonitaDeClase = (c) => {
    const f = fechaDeClase(c);
    if (!f) return `Clase ${c.numero_clase}`;
    const t = new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const apoyoPendiente = (c) => { const fecha = fechaDeClase(c); return filasMes.some((r) => r.fecha === fecha && pendientesIds.includes(r.id)); };
  const [mapaNombres, setMapaNombres] = useState({});
  useEffect(() => { cargarMapaNombres().then(setMapaNombres); }, []);
  useEffect(() => {
    (async () => {
      const mes = parsearMesAnio(tema.mes_anio);
      if (!mes) return;
      const etiqueta = `${NOMBRES_MESES[mes.getMonth()]} ${mes.getFullYear()}`;
      const { data } = await supabase.from('clases_asignadas').select('id, fecha, nombre_usuario, usuario_original').eq('grupo', grupo).eq('mes_anio', etiqueta);
            setFilasMes(data || []);
      const ids = (data || []).map((r) => r.id);
      if (ids.length > 0) {
        const { data: pend } = await supabase.from('solicitudes_sustitucion').select('clase_asignada_id').in('clase_asignada_id', ids).eq('estado', 'Pendiente');
        setPendientesIds((pend || []).map((p) => p.clase_asignada_id));
      } else {
        setPendientesIds([]);
      }
    })();
  }, [tema.id, grupo, enfocada]);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);
  const verTodos = rolUsuarioActivoGlobal === 'administrador' || fechasPermitidas === null;
  // Texto de cada domingo: quién tiene la clase y, si alguien la cubre, quién la cubre y a quién
  const textoAsignado = (c) => {
    const fecha = fechaDeClase(c);
    const filas = filasMes.filter((r) => r.fecha === fecha);
    const cubiertas = filas.filter((r) => r.usuario_original && r.usuario_original.toLowerCase() !== (r.nombre_usuario || '').toLowerCase());
    const titulares = filas.filter((r) => !cubiertas.includes(r));
    const lineas = [];
    if (verTodos && titulares.length > 0) lineas.push(`Asignado a: ${[...new Set(titulares.map((r) => nombreDe(r.nombre_usuario)))].join(', ')}`);
    cubiertas.forEach((r) => lineas.push(`Cubre: ${nombreDe(r.nombre_usuario)} (en lugar de ${nombreDe(r.usuario_original)})`));
    return lineas.length > 0 ? lineas.join('\n') : null;
  };
  const columnas = useColumnas();
  const [cargando, setCargando] = useState(true);
  const theme = getThemeColors(grupo, isDark);
  const colors = getColors(isDark);

  useEffect(() => {
    async function obtenerClases() {
      const { data, error } = await supabase.from('clases_detalle').select('*').eq('tema_id', tema.id).eq('rango_edad', grupo).order('numero_clase', { ascending: true });
      if (!error && data) {
        let permitidas = null;
        const mesTema = parsearMesAnio(tema.mes_anio);
        if (rolUsuarioActivoGlobal !== 'administrador' && mesTema) {
          const etiquetaMes = `${NOMBRES_MESES[mesTema.getMonth()]} ${mesTema.getFullYear()}`;
          const { data: filas } = await supabase.from('clases_asignadas').select('fecha, nombre_usuario, coordinador').eq('grupo', grupo).eq('mes_anio', etiquetaMes).or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`);
          const yo = (usuarioActivoGlobal || '').toLowerCase();
          const lista = filas || [];
          if (!lista.some((r) => (r.coordinador || '').toLowerCase() === yo)) {
            permitidas = lista.filter((r) => (r.nombre_usuario || '').toLowerCase() === yo).map((r) => r.fecha);
          }
        }
        setFechasPermitidas(permitidas);
        setClasesReales(data);
      }
      setCargando(false);
    }
    obtenerClases();
  }, [tema.id, grupo]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
            <View style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, flex: 1 }}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={[styles.headerSoloText, { flex: 1 }]}>
            <Text style={[styles.titleMini, { color: colors.textMain }]}>{tema.titulo_tema.toUpperCase()}</Text>
            <Text style={[styles.subtitle, { color: theme.textDark }]}>{tema.mes_anio} • {grupo}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        {cargando ? (
          <View style={styles.center}><ActivityIndicator size="large" color={theme.main} /></View>
        ) : (
          <ScrollView style={styles.listContainer}>
            {clasesVisibles.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Feather name="book" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin lecciones</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Las clases para este mes aún no han sido cargadas.</Text>
              </View>
            ) : (
                            <View style={columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {clasesVisibles.map((clase) => (
                  <TarjetaLista key={clase.id} icono="book-open" titulo={clase.titulo_clase} subtitulo={fechaBonitaDeClase(clase)} detalle={clase.texto_base ? `Base: ${clase.texto_base}` : null} asignado={textoAsignado(clase)} etiqueta={yaPaso(clase) ? 'Ya pasó' : apoyoPendiente(clase) ? 'Apoyo pendiente' : null} categoria={grupo} isDark={isDark} ancho={columnas >= 2 ? '48.5%' : '100%'} onPress={() => navigation.navigate('ClaseDetalle', { clase, tema, grupo })} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA 4: LECTURA DE CLASE COMPLETA
// ==========================================
function ClaseDetalleScreen({ route, navigation }) {
  const { clase, tema, grupo } = route.params;
  const { isDark } = useContext(ThemeContext);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const theme = getThemeColors(grupo, isDark);
  const colors = getColors(isDark);

  function cerrarAlerta() { setAlerta({ ...alerta, visible: false }); }

        const [mostrarLista, setMostrarLista] = useState(false);
  const [asignacion, setAsignacion] = useState(null);
  const [mostrarApoyo, setMostrarApoyo] = useState(false);
  const [maestrosElegibles, setMaestrosElegibles] = useState([]);
  const paletaGrupo = PALETA_MENU[isDark ? 'oscuro' : 'claro'][grupo] || PALETA_MENU[isDark ? 'oscuro' : 'claro']['Niños'];
  // La fecha de la clase es el domingo número N del mes del tema
  const fechaClase = (() => {
    const mes = parsearMesAnio(tema.mes_anio);
    if (!mes) return null;
    return domingosDelMes(mes.getFullYear(), mes.getMonth())[clase.numero_clase - 1] || null;
  })();

    const cargarAsignacion = async () => {
    if (!fechaClase) return;
    const { data } = await supabase.from('clases_asignadas').select('*').eq('fecha', fechaClase).eq('grupo', grupo).limit(1);
    setAsignacion(data && data.length > 0 ? data[0] : null);
  };

  useEffect(() => {
    cargarAsignacion();
    (async () => {
      const { data } = await supabase.rpc('nombres_publicos');
      setMaestrosElegibles((data || []).filter((m) => m.elegible_clases_ninos));
    })();
  }, []);

  function abrirApoyo() {
    const aviso = (mensaje) => setAlerta({ visible: true, titulo: "Aviso", mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    if (!fechaClase) return aviso("No se pudo determinar la fecha de esta clase.");
    if (!asignacion) return aviso("Esta clase todavía no tiene a nadie asignado, así que no se puede pedir apoyo.");
    if (rolUsuarioActivoGlobal !== 'administrador' && asignacion.nombre_usuario.toLowerCase() !== usuarioActivoGlobal.toLowerCase()) return aviso("Solo la persona asignada a esta clase puede pedir apoyo.");
    setMostrarApoyo(true);
  }

  const enviarSolicitudClase = async (opciones = {}) => {
    const { destino = null, tipo = null, fechaIntercambioId = null } = opciones;
    setMostrarApoyo(false);
    const mostrar = (titulo, mensaje) => setTimeout(() => setAlerta({ visible: true, titulo, mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
    const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('clase_asignada_id', asignacion.id).eq('estado', 'Pendiente');
    if (existente && existente.length > 0) return mostrar("Ya existe", "Ya hay una solicitud de apoyo pendiente para esta clase.");
    const fechaBonita = new Date(fechaClase + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const { error } = await supabase.from('solicitudes_sustitucion').insert([{
      mes_anio: asignacion.mes_anio,
      titulo_tema: fechaBonita,
      grupo_clase: grupo,
      maestro_solicitante: asignacion.nombre_usuario,
      clase_asignada_id: asignacion.id,
      fecha_referencia: fechaClase,
      maestro_destino: destino,
      tipo_intercambio: tipo,
      clase_asignada_id_intercambio: fechaIntercambioId,
    }]);
    if (error) mostrar("Error", error.message);
    else mostrar("Enviado", destino ? "Tu solicitud se envió directamente a esa persona." : "Tu solicitud ya aparece en las Solicitudes de Apoyo.");
  };

  function abrirLista() {
    if (!fechaClase) return setAlerta({ visible: true, titulo: "Aviso", mensaje: "No se pudo determinar la fecha de esta clase.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    setMostrarLista(true);
  }

  function solicitarCobertura() {
    setAlerta({
      visible: true, 
      titulo: "Solicitar Apoyo", 
      mensaje: `¿Pedir apoyo para la Clase ${clase.numero_clase}: ${clase.titulo_clase}?`,
      textoConfirmar: "Sí, solicitar", 
      onCancelar: cerrarAlerta, 
      isDark: isDark,
      themeColor: theme.main,
            onConfirmar: async () => {
        cerrarAlerta();
                try {
          const tituloCompleto = `${tema.titulo_tema} - ${clase.titulo_clase}`;
          const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('tema_id', tema.id).eq('titulo_tema', tituloCompleto).eq('estado', 'Pendiente');
          if (existente && existente.length > 0) {
            setTimeout(() => setAlerta({ visible: true, titulo: "Ya existe", mensaje: "Ya hay una solicitud de apoyo pendiente para esta clase.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
            return;
          }
          const mesTema = parsearMesAnio(tema.mes_anio);
          const fechaRef = mesTema ? new Date(mesTema.getFullYear(), mesTema.getMonth() + 1, 1).toISOString().split('T')[0] : null;
          await supabase.from('solicitudes_sustitucion').insert([{ tema_id: tema.id, mes_anio: tema.mes_anio, titulo_tema: tituloCompleto, grupo_clase: grupo, maestro_solicitante: usuarioActivoGlobal, fecha_referencia: fechaRef }]);
          setTimeout(() => setAlerta({ visible: true, titulo: "Enviado", mensaje: "Tu solicitud está en las Solicitudes de Apoyo.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
        } catch (error) { setTimeout(() => setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo enviar.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500); }
      }
    });
  }

  function descargarPDF() {
    if (!clase.url_pdf) return setAlerta({ visible: true, titulo: "Aviso", mensaje: "Esta clase aún no tiene un PDF asignado.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    Linking.openURL(clase.url_pdf).catch(err => setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo abrir el enlace.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }));
  }

  const RenderSeccion = ({ titulo, texto }) => {
    if (!texto) return null;
    return (
      <View style={styles.seccionDetalle}>
        <Text style={[styles.seccionTitulo, { color: theme.textDark }]}>{titulo}</Text>
        <Text style={[styles.seccionTexto, { color: colors.textMain }]}>{texto}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: 30, width: '95%', maxWidth: 850, alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.detalleTitleMain, { color: colors.textMain }]}>{clase.titulo_clase}</Text>
        <Text style={[styles.detalleSubtitle, { color: theme.main }]}>Clase {clase.numero_clase} • {grupo}</Text>
                <Text style={[styles.detalleBase, { color: colors.textSub }]}>Base bíblica: {clase.texto_base}</Text>
        <TouchableOpacity onPress={abrirLista} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: paletaGrupo.fondo }}>
          <Feather name="check-circle" size={18} color={paletaGrupo.texto} />
          <Text style={{ color: paletaGrupo.texto, fontWeight: '700', fontSize: 14 }}>Tomar lista</Text>
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        <RenderSeccion titulo="Objetivo del Maestro" texto={clase.objetivo} />
        <RenderSeccion titulo="Puntos Clave" texto={clase.puntos_clave} />
        <RenderSeccion titulo="Bienvenida y Rompehielos (15 min)" texto={clase.rompehielos} />
        <RenderSeccion titulo="Introducción (10 min)" texto={clase.introduccion} />
        <RenderSeccion titulo="Historia Bíblica (25 min)" texto={clase.historia} />
        <RenderSeccion titulo="Puntos a Resaltar (15 min)" texto={clase.puntos_resaltar} />
        <RenderSeccion titulo="Versículo a Memorizar (15 min)" texto={clase.versiculo_memoria} />
                <RenderSeccion titulo="Actividad Sugerida (25 min)" texto={clase.actividad_sugerida} />
        {GRUPOS_CORITOS.includes(grupo) ? <SeccionCoritos idsClases={[clase.id]} grupo={grupo} isDark={isDark} puedeElegir={rolUsuarioActivoGlobal === 'administrador'} /> : null}

        <View style={{ flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <TouchableOpacity onPress={abrirApoyo} style={[styles.solicitarBtnClaro, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <Feather name="life-buoy" size={16} color={colors.textSub} />
            <Text style={[styles.solicitarBtnClaroText, { color: colors.textSub }]}>Solicitar apoyo para esta clase</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={descargarPDF} style={[styles.primaryButton, { backgroundColor: theme.main }]}>
            <Feather name="download" size={16} color="#FFFFFF" />
            <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Descargar PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
            <AlertaPersonalizada {...alerta} />
      <ModalSolicitarApoyo visible={mostrarApoyo} tipoItem="clase" item={asignacion} maestrosElegibles={maestrosElegibles} usuarioPropio={usuarioActivoGlobal} isDark={isDark} onCancelar={() => setMostrarApoyo(false)} onConfirmar={enviarSolicitudClase} />
      <ModalAsistencia visible={mostrarLista} onCerrar={() => setMostrarLista(false)} fecha={fechaClase} grupo={grupo} isDark={isDark} usuario={usuarioActivoGlobal} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: DOMINGOS DE UN GRUPO SIN TEMARIO PROPIO (cuneros y grupos de la tarde)
// ==========================================
function DomingosScreen({ route, navigation }) {
  const grupo = route?.params?.grupo;
  const info = GRUPOS_INFO[grupo] || {};
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const theme = getThemeColors(grupo, isDark);
  const columnas = useColumnas();
  const esAdmin = rolUsuarioActivoGlobal === 'administrador';
  const yo = (usuarioActivoGlobal || '').toLowerCase();
  const hoy = fechaISO(new Date());
  const [filas, setFilas] = useState([]);
  const [verTodo, setVerTodo] = useState(false);
  const [repasos, setRepasos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mapaNombres, setMapaNombres] = useState({});
  useEffect(() => { cargarMapaNombres().then(setMapaNombres); }, []);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const d = new Date();
        const inicio = fechaISO(new Date(d.getFullYear(), d.getMonth(), 1));
        const { data } = await supabase.from('clases_asignadas').select('id, fecha, nombre_usuario, usuario_original, coordinador').eq('grupo', grupo).gte('fecha', inicio).order('fecha', { ascending: true }).range(0, 999);
        const todas = data || [];
        const soyCoordinador = todas.some((r) => (r.coordinador || '').toLowerCase() === yo);
        setVerTodo(esAdmin || soyCoordinador);
        // Los maestros solo ven sus domingos que aún no pasan; coordinadores y administradores ven todos
        const visibles = (esAdmin || soyCoordinador) ? todas : todas.filter((r) => (r.nombre_usuario || '').toLowerCase() === yo && r.fecha >= hoy);
        setFilas(visibles);
        setCargando(false);
        if (info.repasoDe) {
          const fechas = [...new Set(visibles.map((r) => r.fecha))].slice(0, 12);
          const mapa = {};
          for (const f of fechas) mapa[f] = await clasesDeRepaso(info.repasoDe, f);
          setRepasos(mapa);
        }
      })();
    }, [grupo])
  );

  const fechas = [...new Set(filas.map((r) => r.fecha))];
  const fechaBonita = (f) => { const t = new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const textoAsignado = (f) => {
    const delDia = filas.filter((r) => r.fecha === f);
    const lineas = [];
    const titulares = delDia.filter((r) => !r.usuario_original || r.usuario_original.toLowerCase() === (r.nombre_usuario || '').toLowerCase());
    if (verTodo && titulares.length > 0) lineas.push(`Asignado a: ${[...new Set(titulares.map((r) => nombreDe(r.nombre_usuario)))].join(', ')}`);
    delDia.filter((r) => !titulares.includes(r)).forEach((r) => lineas.push(`Cubre: ${nombreDe(r.nombre_usuario)} (en lugar de ${nombreDe(r.usuario_original)})`));
    return lineas.length > 0 ? lineas.join('\n') : null;
  };
  const textoRepaso = (f) => {
    const r = repasos[f];
    if (!r) return null;
    const titulos = [r.anterior, r.actual].filter(Boolean).map((x) => `«${x.clase.titulo_clase}»`);
    return titulos.length > 0 ? `Repaso: ${titulos.join(' y ')}` : 'Las clases de la mañana aún no están cargadas';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={[styles.headerSoloText, { flex: 1 }]}>
            <Text style={[styles.titleMini, { color: colors.textMain }]}>{(grupo || '').toUpperCase()}</Text>
            <Text style={[styles.subtitle, { color: theme.textDark }]}>{info.turno} • {info.edades}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        {cargando ? (
          <View style={styles.center}><ActivityIndicator size="large" color={theme.main} /></View>
        ) : (
          <ScrollView style={styles.listContainer}>
            {fechas.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Feather name={info.icono || 'calendar'} size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin domingos asignados</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Aquí aparecerán los domingos de este grupo cuando se programen.</Text>
              </View>
            ) : (
              <View style={columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {fechas.map((f) => (
                  <TarjetaLista key={f} icono={info.icono || 'calendar'} titulo={fechaBonita(f)} subtitulo={info.repasoDe ? 'Repaso de la mañana' : 'Cuidado de bebés'} etiqueta={f < hoy ? 'Ya pasó' : null} detalle={info.repasoDe ? textoRepaso(f) : null} asignado={textoAsignado(f)} categoria={grupo} isDark={isDark} ancho={columnas >= 2 ? '48.5%' : '100%'} onPress={() => navigation.navigate('DomingoDetalle', { grupo, fecha: f })} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: DETALLE DE UN DOMINGO (cuneros y grupos de la tarde)
// ==========================================
function DomingoDetalleScreen({ route, navigation }) {
  const { grupo, fecha } = route.params;
  const info = GRUPOS_INFO[grupo] || {};
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const theme = getThemeColors(grupo, isDark);
  const paletaGrupo = PALETA_MENU[isDark ? 'oscuro' : 'claro'][grupo] || PALETA_MENU[isDark ? 'oscuro' : 'claro']['Niños'];
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });
  const [filasDia, setFilasDia] = useState([]);
  const [asignacion, setAsignacion] = useState(null);
  const [repaso, setRepaso] = useState(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [mostrarApoyo, setMostrarApoyo] = useState(false);
  const [maestrosElegibles, setMaestrosElegibles] = useState([]);
  const [mapaNombres, setMapaNombres] = useState({});
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);
  const fechaBonita = (() => { const t = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); })();

  useEffect(() => {
    cargarMapaNombres().then(setMapaNombres);
    (async () => {
      const { data } = await supabase.from('clases_asignadas').select('*').eq('fecha', fecha).eq('grupo', grupo);
      const filas = data || [];
      setFilasDia(filas);
      const yo = (usuarioActivoGlobal || '').toLowerCase();
      setAsignacion(filas.find((r) => (r.nombre_usuario || '').toLowerCase() === yo) || filas[0] || null);
      const { data: lista } = await supabase.rpc('nombres_publicos');
      setMaestrosElegibles((lista || []).filter((m) => m.elegible_clases_ninos));
      if (info.repasoDe) setRepaso(await clasesDeRepaso(info.repasoDe, fecha));
    })();
  }, [grupo, fecha]);

  function abrirApoyo() {
    const aviso = (mensaje) => setAlerta({ visible: true, titulo: "Aviso", mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    if (!asignacion) return aviso("Este domingo todavía no tiene a nadie asignado, así que no se puede pedir apoyo.");
    if (rolUsuarioActivoGlobal !== 'administrador' && asignacion.nombre_usuario.toLowerCase() !== usuarioActivoGlobal.toLowerCase()) return aviso("Solo la persona asignada a este domingo puede pedir apoyo.");
    setMostrarApoyo(true);
  }

  const enviarSolicitud = async (opciones = {}) => {
    const { destino = null, tipo = null, fechaIntercambioId = null } = opciones;
    setMostrarApoyo(false);
    const mostrar = (titulo, mensaje) => setTimeout(() => setAlerta({ visible: true, titulo, mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
    const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('clase_asignada_id', asignacion.id).eq('estado', 'Pendiente');
    if (existente && existente.length > 0) return mostrar("Ya existe", "Ya hay una solicitud de apoyo pendiente para este domingo.");
    const { error } = await supabase.from('solicitudes_sustitucion').insert([{
      mes_anio: asignacion.mes_anio,
      titulo_tema: new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      grupo_clase: grupo,
      maestro_solicitante: asignacion.nombre_usuario,
      clase_asignada_id: asignacion.id,
      fecha_referencia: fecha,
      maestro_destino: destino,
      tipo_intercambio: tipo,
      clase_asignada_id_intercambio: fechaIntercambioId,
    }]);
    if (error) mostrar("Error", error.message);
    else mostrar("Enviado", destino ? "Tu solicitud se envió directamente a esa persona." : "Tu solicitud ya aparece en las Solicitudes de Apoyo.");
  };

  const Seccion = ({ titulo, texto }) => {
    if (!texto) return null;
    return (
      <View style={styles.seccionDetalle}>
        <Text style={[styles.seccionTitulo, { color: theme.textDark }]}>{titulo}</Text>
        <Text style={[styles.seccionTexto, { color: colors.textMain }]}>{texto}</Text>
      </View>
    );
  };
  const BloqueClase = ({ etiqueta, dato }) => (
    <View style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 28, padding: 20, marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, color: theme.textDark, marginBottom: 6 }}>{etiqueta.toUpperCase()}</Text>
      {dato ? (
        <>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textMain }}>{dato.clase.titulo_clase}</Text>
          {dato.clase.texto_base ? <Text style={[styles.detalleBase, { color: colors.textSub, marginBottom: 12 }]}>Base bíblica: {dato.clase.texto_base}</Text> : null}
          <Seccion titulo="Objetivo" texto={dato.clase.objetivo} />
          <Seccion titulo="Puntos clave" texto={dato.clase.puntos_clave} />
          <Seccion titulo="Versículo a memorizar" texto={dato.clase.versiculo_memoria} />
        </>
      ) : (
        <Text style={{ fontSize: 14, color: colors.textSub }}>Esta clase de la mañana aún no está cargada.</Text>
      )}
    </View>
  );
  const nombresDia = [...new Set(filasDia.map((r) => nombreDe(r.nombre_usuario)))];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: 30, width: '95%', maxWidth: 850, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.detalleTitleMain, { color: colors.textMain }]}>{fechaBonita}</Text>
        <Text style={[styles.detalleSubtitle, { color: theme.textDark }]}>{grupo} • {info.turno} • {info.edades}</Text>
        {nombresDia.length > 0 ? <Text style={[styles.detalleBase, { color: colors.textSub }]}>Asignado a: {nombresDia.join(', ')}</Text> : null}
        <TouchableOpacity onPress={() => setMostrarLista(true)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: paletaGrupo.fondo }}>
          <Feather name="check-circle" size={18} color={paletaGrupo.texto} />
          <Text style={{ color: paletaGrupo.texto, fontWeight: '700', fontSize: 14 }}>Tomar lista</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        {info.cuidado ? (
          <View style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 28, padding: 20, marginBottom: 14 }}>
            <Feather name="heart" size={22} color={theme.textDark} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain, marginTop: 8 }}>Este domingo te toca cubrir cuneros</Text>
            <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4, lineHeight: 20 }}>En este grupo no se da clase: se cuida a los bebés. Recuerda tomar lista de los que asistan.</Text>
          </View>
        ) : null}
        {info.repasoDe ? (
          <>
            <Text style={{ fontSize: 14, color: colors.textSub, marginBottom: 12, lineHeight: 20 }}>En la tarde se repasan las dos últimas clases de {info.repasoDe} de la mañana. Prepara tu propio material.</Text>
            <BloqueClase etiqueta="Clase del domingo anterior" dato={repaso && repaso.anterior} />
                        <BloqueClase etiqueta="Clase de este domingo" dato={repaso && repaso.actual} />
            {grupo === 'Tarde 4 a 8' ? <SeccionCoritos idsClases={[repaso && repaso.anterior && repaso.anterior.clase.id, repaso && repaso.actual && repaso.actual.clase.id]} grupo={grupo} isDark={isDark} puedeElegir={false} /> : null}
          </>
        ) : null}

        <TouchableOpacity onPress={abrirApoyo} style={[styles.solicitarBtnClaro, { backgroundColor: colors.background, borderColor: colors.cardBorder, marginTop: 10 }]}>
          <Feather name="life-buoy" size={16} color={colors.textSub} />
          <Text style={[styles.solicitarBtnClaroText, { color: colors.textSub }]}>Solicitar apoyo para este domingo</Text>
        </TouchableOpacity>
      </ScrollView>
      <AlertaPersonalizada {...alerta} />
      <ModalSolicitarApoyo visible={mostrarApoyo} tipoItem="clase" item={asignacion} maestrosElegibles={maestrosElegibles} usuarioPropio={usuarioActivoGlobal} isDark={isDark} onCancelar={() => setMostrarApoyo(false)} onConfirmar={enviarSolicitud} />
      <ModalAsistencia visible={mostrarLista} onCerrar={() => setMostrarLista(false)} fecha={fecha} grupo={grupo} isDark={isDark} usuario={usuarioActivoGlobal} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: CORITOS (biblioteca con buscador, filtro por grupo y mini reproductor)
// ==========================================
function CoritosScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const columnas = useColumnas();
  const esAdmin = rolUsuarioActivoGlobal === 'administrador';
  const rep = useReproductor();
  const [coritos, setCoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [letra, setLetra] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });

  const cargar = async () => {
    const { data } = await supabase.from('coritos').select('*').order('titulo', { ascending: true });
    setCoritos(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const visibles = coritos.filter((c) => (filtro === 'Todos' || gruposDeCoritos(filtro).some((g) => (c.grupos || []).includes(g))) && sinAcentos(c.titulo).includes(sinAcentos(busqueda)));

  const borrar = (c) => setAlerta({
    visible: true, titulo: 'Borrar corito', mensaje: `¿Borrar "${c.titulo}"? También se quitará de las clases donde esté.`, textoConfirmar: 'Sí, borrar', onCancelar: cerrarAlerta, isDark,
    onConfirmar: async () => {
      cerrarAlerta();
      rep.quitarSiEs(c);
      const { error } = await supabase.from('coritos').delete().eq('id', c.id);
      if (!error) await supabase.storage.from('coritos').remove([c.archivo]);
      cargar();
    },
  });

  const anchoFila = columnas === 3 ? '32.5%' : columnas === 2 ? '49.3%' : '100%';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, flex: 1 }}>
        <View style={[styles.headerRowSpaceBetween, { alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Coritos</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Escúchalos y apréndelos</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 10 }]} placeholder="Buscar corito" placeholderTextColor={colors.textSub} value={busqueda} onChangeText={setBusqueda} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {FILTROS_CORITOS.map((g) => (
            <TouchableOpacity key={g} onPress={() => setFiltro(g)} style={{ paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1, borderColor: filtro === g ? paleta.texto : colors.cardBorder, backgroundColor: filtro === g ? paleta.fondo : colors.cardBg }}>
              <Text style={{ color: filtro === g ? paleta.texto : colors.textMain, fontWeight: '600', fontSize: 13 }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {esAdmin ? (
          <TouchableOpacity onPress={() => setAgregando(true)} style={[styles.solicitarBtnClaro, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 10 }]}>
            <Feather name="plus" size={16} color={colors.textSub} />
            <Text style={[styles.solicitarBtnClaroText, { color: colors.textSub }]}>Agregar corito</Text>
          </TouchableOpacity>
        ) : null}

        {cargando ? (
          <View style={styles.center}><ActivityIndicator size="large" color={paleta.texto} /></View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 10 }}>
            {visibles.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Feather name="music" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>{coritos.length === 0 ? 'Aún no hay coritos' : 'Sin resultados'}</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>{coritos.length === 0 ? 'Aquí aparecerán los coritos cuando se suban.' : 'Prueba con otra palabra o con otro grupo.'}</Text>
              </View>
            ) : (
              <View style={columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {visibles.map((c) => <FilaCorito key={c.id} corito={c} rep={rep} lista={visibles} onLetra={setLetra} onBorrar={esAdmin ? borrar : null} isDark={isDark} ancho={anchoFila} />)}
              </View>
            )}
          </ScrollView>
        )}
        <BarraReproductor rep={rep} isDark={isDark} />
      </View>
      <ModalLetra corito={letra} onCerrar={() => setLetra(null)} isDark={isDark} />
      <ModalNuevoCorito visible={agregando} onCerrar={() => setAgregando(false)} onGuardado={() => { setAgregando(false); cargar(); }} isDark={isDark} />
      <AlertaPersonalizada {...alerta} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: SOLICITUDES DE APOYO (TABLÓN)
// ==========================================
function TablonScreen({ navigation, route }) {
  const { isDark } = useContext(ThemeContext);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mapaNombres, setMapaNombres] = useState({});
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const colors = getColors(isDark);
    const soloGrupo = route?.params?.soloGrupo;
    const excluirGrupo = route?.params?.excluirGrupo;
  const solicitudId = route?.params?.solicitudId;
  const scrollRef = useRef(null);
    const yaDesplazado = useRef(false);
  const [miPerfil, setMiPerfil] = useState({});

    const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      obtenerSolicitudes();
      (async () => {
              const { data } = await supabase.rpc('nombres_publicos');
        const mapa = {};
        (data || []).forEach((m) => { mapa[m.nombre_usuario.toLowerCase()] = m.nombre_completo; });
                setMapaNombres(mapa);
        setMiPerfil((data || []).find((m) => (m.nombre_usuario || '').toLowerCase() === (usuarioActivoGlobal || '').toLowerCase()) || {});
      })();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefrescando(true);
    await obtenerSolicitudes();
    setRefrescando(false);
  }, []);

  const nombreBonito = (usuario) => mapaNombres[(usuario || '').toLowerCase()] || usuario;

  function cerrarAlerta() { setAlerta({ ...alerta, visible: false }); }

  async function obtenerSolicitudes() {
        const hoy = fechaISO(new Date());
    let consulta = supabase.from('solicitudes_sustitucion').select('*').order('creado_en', { ascending: false });
    if (soloGrupo) { consulta = consulta.eq('grupo_clase', soloGrupo); }
    if (excluirGrupo) { consulta = consulta.neq('grupo_clase', excluirGrupo); }
        consulta = consulta.or(`fecha_referencia.is.null,fecha_referencia.gte.${hoy}`);
    let { data } = await consulta;
    if (rolUsuarioActivoGlobal !== 'administrador') {
            const yo = (usuarioActivoGlobal || '').toLowerCase();
      const { data: lista } = await supabase.rpc('nombres_publicos');
      const yoInfo = (lista || []).find((m) => (m.nombre_usuario || '').toLowerCase() === yo) || {};
            const { data: misClases } = await supabase.from('clases_asignadas').select('id').ilike('coordinador', usuarioActivoGlobal);
      const idsCoord = (misClases || []).map((c) => c.id);
      data = (data || []).filter((s) => {
        if ((s.maestro_solicitante || '').toLowerCase() === yo || (s.maestro_suplente || '').toLowerCase() === yo) return true;
        if (s.clase_asignada_id && idsCoord.includes(s.clase_asignada_id)) return true;
        if (s.maestro_destino) return s.maestro_destino.toLowerCase() === yo;
        return s.grupo_clase === 'Predicaciones' ? !!yoInfo.elegible_predicaciones : !!yoInfo.elegible_clases_ninos;
      });
    }
    setSolicitudes(data || []);
    setCargando(false);
  }

    // Solo ve el botón Aceptar quien realmente puede cubrir: no es su propia solicitud y es el destinatario o es elegible
  const puedeAceptar = (sol) => {
    const yo = (usuarioActivoGlobal || '').toLowerCase();
    if ((sol.maestro_solicitante || '').toLowerCase() === yo) return false;
    if (sol.maestro_destino) return sol.maestro_destino.toLowerCase() === yo;
    return sol.grupo_clase === 'Predicaciones' ? !!miPerfil.elegible_predicaciones : !!miPerfil.elegible_clases_ninos;
  };

  function cancelarSolicitud(solicitudId, grupoClase) {
    const theme = getThemeColors(grupoClase, isDark);
    setAlerta({
      visible: true, titulo: "Cancelar", mensaje: "¿Ya no necesitas el apoyo?", isDark: isDark, themeColor: theme.main,
      textoConfirmar: "Sí, cancelar", onCancelar: cerrarAlerta,
      onConfirmar: async () => { cerrarAlerta(); await supabase.from('solicitudes_sustitucion').delete().eq('id', solicitudId); obtenerSolicitudes(); }
    });
  }

    // Si la clase ya había sido cubierta antes, el titular original no cambia: se conserva el primero
  async function titularOriginal(tabla, id, respaldo) {
    const { data } = await supabase.from(tabla).select('usuario_original').eq('id', id).single();
    return (data && data.usuario_original) || respaldo;
  }

  function aceptarSustitucion(solicitud) {
    const theme = getThemeColors(solicitud.grupo_clase, isDark);
    setAlerta({
      visible: true, titulo: "Confirmar", mensaje: `¿Aceptas apoyar con "${solicitud.titulo_tema}"?`, isDark: isDark, themeColor: theme.main,
      textoConfirmar: "Aceptar", onCancelar: cerrarAlerta,
                        onConfirmar: async () => {
        cerrarAlerta();
        if ((solicitud.maestro_solicitante || '').toLowerCase() === usuarioActivoGlobal.toLowerCase()) {
          setTimeout(() => setAlerta({ visible: true, titulo: "Aviso", mensaje: "No puedes aceptar tu propia solicitud.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
          return;
        }
                if (!solicitud.maestro_destino) {
          const { data: lista } = await supabase.rpc('nombres_publicos');
          const yo = (lista || []).find((m) => (m.nombre_usuario || '').toLowerCase() === usuarioActivoGlobal.toLowerCase()) || {};
          const esPred = solicitud.grupo_clase === 'Predicaciones';
          if (!(esPred ? yo.elegible_predicaciones : yo.elegible_clases_ninos)) {
            setTimeout(() => setAlerta({ visible: true, titulo: "No se puede aceptar", mensaje: esPred ? "Esta solicitud es solo para personas habilitadas para predicaciones." : "Esta solicitud es solo para personas habilitadas para clases de niños.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
            return;
          }
        }
        if (solicitud.programa_servicio_id || solicitud.clase_asignada_id) {
          const esClase = !!solicitud.clase_asignada_id;
          const esIntercambio = solicitud.tipo_intercambio === 'intercambio';
          const idOtro = esClase ? solicitud.clase_asignada_id_intercambio : solicitud.programa_servicio_id_intercambio;
          let fechaOtra = null;
          if (esIntercambio && idOtro) {
            const { data: otro } = await supabase.from(esClase ? 'clases_asignadas' : 'programa_servicios').select('fecha').eq('id', idOtro).single();
            fechaOtra = otro ? otro.fecha : null;
          }
          const ignAceptante = esIntercambio && idOtro ? (esClase ? { claseId: idOtro } : { rolId: idOtro }) : {};
          const c1 = await buscarConflictoDia(usuarioActivoGlobal, solicitud.fecha_referencia, ignAceptante);
          if (c1) {
            setTimeout(() => setAlerta({ visible: true, titulo: "No se puede aceptar", mensaje: `Ya tienes ${c1}.`, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
            return;
          }
          if (fechaOtra) {
            const ignSolicitante = esClase ? { claseId: solicitud.clase_asignada_id } : { rolId: solicitud.programa_servicio_id };
            const c2 = await buscarConflictoDia(solicitud.maestro_solicitante, fechaOtra, ignSolicitante);
            if (c2) {
              setTimeout(() => setAlerta({ visible: true, titulo: "No se puede aceptar", mensaje: `${nombreBonito(solicitud.maestro_solicitante)} ya tiene ${c2} en la fecha que tomaría con el intercambio.`, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
              return;
            }
          }
        }
        const { data: tomada, error: error1 } = await supabase.from('solicitudes_sustitucion').update({ estado: 'Cubierta', maestro_suplente: usuarioActivoGlobal }).eq('id', solicitud.id).eq('estado', 'Pendiente').select('id');
        if (!error1 && (!tomada || tomada.length === 0)) {
          setTimeout(() => setAlerta({ visible: true, titulo: "Ya no está disponible", mensaje: "Alguien más ya aceptó esta solicitud.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
          obtenerSolicitudes();
          return;
        }
        let error2 = null, error3 = null;
                                                                if (solicitud.programa_servicio_id) {
          const r = await supabase.from('programa_servicios').update({
            nombre_usuario: usuarioActivoGlobal,
                        usuario_original: await titularOriginal('programa_servicios', solicitud.programa_servicio_id, solicitud.maestro_solicitante),
            sustituido_en: new Date().toISOString(),
            estado_confirmacion: 'pendiente',
          }).eq('id', solicitud.programa_servicio_id);
          error2 = r.error;
        }
        if (solicitud.tipo_intercambio === 'intercambio' && solicitud.programa_servicio_id_intercambio) {
          const r = await supabase.from('programa_servicios').update({
            nombre_usuario: solicitud.maestro_solicitante,
                        usuario_original: await titularOriginal('programa_servicios', solicitud.programa_servicio_id_intercambio, usuarioActivoGlobal),
            sustituido_en: new Date().toISOString(),
            estado_confirmacion: 'pendiente',
          }).eq('id', solicitud.programa_servicio_id_intercambio);
          error3 = r.error;
        }
        if (solicitud.clase_asignada_id) {
          const r = await supabase.from('clases_asignadas').update({ nombre_usuario: usuarioActivoGlobal, usuario_original: await titularOriginal('clases_asignadas', solicitud.clase_asignada_id, solicitud.maestro_solicitante), sustituido_en: new Date().toISOString() }).eq('id', solicitud.clase_asignada_id);
          error2 = error2 || r.error;
        }
        if (solicitud.tipo_intercambio === 'intercambio' && solicitud.clase_asignada_id_intercambio) {
          const r = await supabase.from('clases_asignadas').update({ nombre_usuario: solicitud.maestro_solicitante, usuario_original: await titularOriginal('clases_asignadas', solicitud.clase_asignada_id_intercambio, usuarioActivoGlobal), sustituido_en: new Date().toISOString() }).eq('id', solicitud.clase_asignada_id_intercambio);
          error3 = error3 || r.error;
        }
        const errorReal = error1 || error2 || error3;
        if (errorReal) {
          setTimeout(() => setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo completar: " + errorReal.message, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
        } else {
          setTimeout(() => setAlerta({ visible: true, titulo: "¡Gracias!", mensaje: "Has sido asignado a esta clase.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
        }
        obtenerSolicitudes(); 
      }
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: 850, flex: 1, paddingBottom: 20 }}>
                         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal')} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
                    <View style={[styles.headerSoloText, { flex: 1 }]}>
            <Text style={[styles.titleMini, { color: colors.textMain }]}>SOLICITUDES DE APOYO</Text>
                                                <Text style={[styles.subtitle, { color: colors.textSub }]}>Maestros que necesitan cobertura</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
                {cargando ? <ActivityIndicator size="large" color={colors.textSub} style={{marginTop: 50}} /> : (
          <ScrollView ref={scrollRef} style={styles.listContainer} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colors.textSub} />}>
            {solicitudes.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Feather name="check-circle" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Todo cubierto</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>No hay maestros solicitando apoyo en este momento.</Text>
              </View>
            ) : (
              solicitudes.map((solicitud) => {
                const theme = getThemeColors(solicitud.grupo_clase, isDark);
                return (
                  <View key={solicitud.id} onLayout={(e) => { if (solicitudId && solicitud.id === solicitudId && !yaDesplazado.current && scrollRef.current) { yaDesplazado.current = true; scrollRef.current.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 10), animated: true }); } }} style={[styles.card, styles.cardLight, { backgroundColor: theme.bgLight, borderColor: solicitud.id === solicitudId ? theme.textDark : 'transparent', borderWidth: solicitud.id === solicitudId ? 2 : 1, opacity: solicitud.estado === 'Cubierta' ? 0.6 : 1 }]}>
                    <View style={styles.textContainer}>
                      <Text style={[styles.topicTitle, { color: colors.textMain }]}>{nombreBonito(solicitud.maestro_solicitante)} pide apoyo</Text>
                      <Text style={[styles.topicSubtitle, { color: theme.textDark, fontWeight: 'bold' }]}>Grupo: {solicitud.grupo_clase}</Text>
                      <Text style={[styles.topicSubtitle, { color: colors.textSub }]}>{solicitud.mes_anio}</Text>
                                            <Text style={[styles.topicSubtitle, { color: colors.textMain }]}>{solicitud.titulo_tema}</Text>
                      {solicitud.maestro_destino && (
                        <Text style={[styles.topicSubtitle, { color: colors.textSub, fontStyle: 'italic' }]}>Para: {nombreBonito(solicitud.maestro_destino)}{solicitud.tipo_intercambio === 'intercambio' ? ' • Intercambio de fechas' : ''}</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                      {solicitud.maestro_solicitante === usuarioActivoGlobal && solicitud.estado === 'Pendiente' && (
                         <TouchableOpacity style={[styles.cancelarButton, { borderColor: colors.cardBorder }]} onPress={() => cancelarSolicitud(solicitud.id, solicitud.grupo_clase)}><Text style={[styles.cancelarButtonText, { color: colors.textSub }]}>Cancelar</Text></TouchableOpacity>
                      )}
                      {solicitud.estado === 'Pendiente' ? (
                         (puedeAceptar(solicitud) ? <TouchableOpacity style={[styles.aceptarDiscreto, { backgroundColor: theme.main }]} onPress={() => aceptarSustitucion(solicitud)}><Text style={styles.aceptarDiscretoText}>Aceptar Apoyo</Text></TouchableOpacity> : <Text style={{ color: colors.textSub, fontStyle: 'italic', padding: 8 }}>Esperando apoyo</Text>)
                      ) : (                         <Text style={{ color: theme.textDark, fontStyle: 'italic', padding: 8, fontWeight: 'bold' }}>Cubierta por {nombreBonito(solicitud.maestro_suplente)}</Text>

                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
      <AlertaPersonalizada {...alerta} />
    </SafeAreaView>
  );
}

// ==========================================
// ==========================================
// PANTALLA: ADMIN 
// ==========================================
function AdminScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuarioGenerado, setUsuarioGenerado] = useState('');
  const [pinGenerado, setPinGenerado] = useState('');
  const [numeroEquipoAsignado, setNumeroEquipoAsignado] = useState('');
    const [esAdmin, setEsAdmin] = useState(false);
  const [elegibleClases, setElegibleClases] = useState(false);
  const [elegiblePredicaciones, setElegiblePredicaciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [maestros, setMaestros] = useState([]);
  const [equipoSeleccionadoAdmin, setEquipoSeleccionadoAdmin] = useState(null);
  const [maestroEditando, setMaestroEditando] = useState(null);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar', isDark: isDark });
  const colors = getColors(isDark);
  const [telefono, setTelefono] = useState('');
    const [busquedaUsuario, setBusquedaUsuario] = useState('');
     const [previaRol, setPreviaRol] = useState([]);
  const [subiendoRol, setSubiendoRol] = useState(false);
  const [mesBuscarRol, setMesBuscarRol] = useState('');
  const [anioBuscarRol, setAnioBuscarRol] = useState('');
  const [resultadosRol, setResultadosRol] = useState([]);
  const [seleccionadosRol, setSeleccionadosRol] = useState([]);
  const [buscandoRol, setBuscandoRol] = useState(false);
    const [eliminandoRol, setEliminandoRol] = useState(false);
  const [previaClases, setPreviaClases] = useState(null);
  const [subiendoClases, setSubiendoClases] = useState(false);
    const [mesBorrarClases, setMesBorrarClases] = useState('');
  const [mesBuscarClases, setMesBuscarClases] = useState('');
  const [anioBuscarClases, setAnioBuscarClases] = useState('');
  const [resultadosClases, setResultadosClases] = useState([]);
  const [seleccionadasClases, setSeleccionadasClases] = useState([]);
  const [buscandoClases, setBuscandoClases] = useState(false);
  const [eliminandoClases, setEliminandoClases] = useState(false);
  const [grupoAsistencia, setGrupoAsistencia] = useState('Todos');
  const [mesAsistencia, setMesAsistencia] = useState('');
  const [descargandoAsistencia, setDescargandoAsistencia] = useState(false);
  useEffect(() => { obtenerMaestros(); }, []);
  
  function cerrarAlerta() { setAlerta({ ...alerta, visible: false }); }

    const procesarNombre = (texto) => {
    setNombreCompleto(texto);
    // Preserva la ñ/Ñ (se descompone en "n" + tilde con NFD) y solo quita acentos del resto de letras
    const usuarioLimpio = texto.normalize("NFD").replace(/[̀-ͯ]/g, (m) => (m === '\u0303' ? m : '')).normalize("NFC").replace(/\s+/g, '');
    setUsuarioGenerado(usuarioLimpio);
    if (!pinGenerado && texto.length > 0) setPinGenerado(Math.floor(1000 + Math.random() * 9000).toString());
    if (texto.length === 0) setPinGenerado('');
  };

  const generarNuevoPin = () => setPinGenerado(Math.floor(1000 + Math.random() * 9000).toString());

  async function obtenerMaestros() {
    const { data } = await supabase.from('maestros').select('*').order('creado_en', { ascending: false });
    setMaestros(data || []);
  }

  async function registrarMaestro() {
    if (!usuarioGenerado || !pinGenerado) return setAlerta({ visible: true, titulo: "Aviso", mensaje: "Escribe el nombre del usuario.", onConfirmar: cerrarAlerta, isDark: isDark });
    setGuardando(true);
        const rolFinal = esAdmin ? 'administrador' : 'maestro';
    const equipoFinal = esAdmin ? 'Administradores' : 'Sin equipo';

        const { data: resultado, error } = await supabase.functions.invoke('registrar-maestro', {
      body: { nombre_usuario: usuarioGenerado, pin_acceso: pinGenerado, rol: rolFinal, equipo: equipoFinal, telefono: telefono, nombre_completo: nombreCompleto, elegible_clases_ninos: elegibleClases, elegible_predicaciones: elegiblePredicaciones }
    });

        if (error || resultado?.error) {
      let detalle = resultado?.error || error?.message || "Error desconocido.";
      if (error && error.context && typeof error.context.json === 'function') {
        try { const cuerpo = await error.context.json(); detalle = cuerpo.error || cuerpo.message || JSON.stringify(cuerpo); } catch (e) {}
      }
      if (/already been registered|already registered/i.test(detalle)) detalle = "Ya existe un usuario con ese nombre. Prueba con otro nombre o agrega un apellido.";
      setAlerta({ visible: true, titulo: "Error", mensaje: detalle, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: "¡Éxito!", mensaje: "Usuario registrado.", onConfirmar: cerrarAlerta, isDark: isDark });
      setNombreCompleto(''); setUsuarioGenerado(''); setPinGenerado(''); setNumeroEquipoAsignado(''); setTelefono(''); setEsAdmin(false); setElegibleClases(false); setElegiblePredicaciones(false); obtenerMaestros();
    }
    setGuardando(false);
  }

    async function guardarEdicion(datos) {
    setMaestroEditando(null);
    setEquipoSeleccionadoAdmin(null);
                await supabase.from('maestros').update({ telefono: datos.telefono, nombre_completo: datos.nombre_completo, elegible_clases_ninos: datos.elegible_clases_ninos, elegible_predicaciones: datos.elegible_predicaciones }).eq('id', maestroEditando.id);
    obtenerMaestros();
  }

  async function confirmarEliminacion(maestro) {
    if (maestro.nombre_usuario === usuarioActivoGlobal) { return setAlerta({ visible: true, titulo: "Acción Denegada", mensaje: "No puedes dar de baja tu propia cuenta.", textoConfirmar: "Entendido", onConfirmar: cerrarAlerta, isDark: isDark }); }
    const { data } = await supabase.from('maestros').select('id').eq('equipo', maestro.equipo);
    const cantidadEnEquipo = data ? data.length : 0;
    let mensajeAlerta = `¿Estás seguro de eliminar a ${maestro.nombre_usuario}?`;
    if (maestro.equipo !== 'Sin equipo' && maestro.rol !== 'administrador') { mensajeAlerta += `\n\n⚠️ El ${maestro.equipo} tiene ${cantidadEnEquipo} miembro(s).`; }

        setAlerta({ visible: true, titulo: "Dar de baja", mensaje: mensajeAlerta, textoConfirmar: "Eliminar", onCancelar: cerrarAlerta, isDark: isDark, onConfirmar: async () => {
      cerrarAlerta();
      setEquipoSeleccionadoAdmin(null);
      const { data: resultado, error } = await supabase.functions.invoke('eliminar-maestro', { body: { maestro_id: maestro.id } });
      if (error || resultado?.error) {
        setAlerta({ visible: true, titulo: "Error", mensaje: resultado?.error || error?.message || "No se pudo eliminar.", onConfirmar: cerrarAlerta, isDark: isDark });
      }
      obtenerMaestros();
    } });
  }

            const compartirWhatsApp = (usuario, pin, equipo, telefono) => {
    const numeroLimpio = (telefono || '').replace(/\D/g, '');
    if (!numeroLimpio) {
      setAlerta({ visible: true, titulo: "Sin número", mensaje: "Esta persona no tiene un número celular guardado.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#EFBC68' });
      return;
    }
    const mensaje = `¡Hola! Aquí tienes tus accesos.\n\n👤 Usuario: ${usuario}\n🔑 PIN: ${pin}`;
    Linking.openURL(`https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`);
  };

  const copiarInfo = async (usuario, pin, equipo) => {
    await Clipboard.setStringAsync(`Usuario: ${usuario}\nPIN: ${pin}`);
    setAlerta({ visible: true, titulo: "Copiado", mensaje: "La información se copió al portapapeles.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#7EA0D8' });
  };

  // Lee el texto del CSV y lo convierte en una lista de filas
   const parsearCSV = (texto) => {
    const lineas = texto.trim().split('\n');
    const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase());
    return lineas.slice(1).filter(l => l.trim() !== '').map(linea => {
      const valores = linea.split(',').map(v => v.trim());
      const fila = {};
      encabezados.forEach((encabezado, i) => { fila[encabezado] = valores[i]; });
      return fila;
    }).filter(fila => fila.fecha && fila.fecha.trim() !== '');
  };

  // Se activa cuando el admin selecciona el archivo CSV
  const manejarArchivoCSV = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (e) => {
      try {
        setPreviaRol(parsearCSV(e.target.result));
      } catch (error) {
        setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo leer el archivo. Revisa que sea un CSV válido.", onConfirmar: cerrarAlerta, isDark: isDark });
      }
    };
    lector.readAsText(archivo);
  };

  // Sube a Supabase las filas que se previsualizaron
  const confirmarCargaRol = async () => {
    setSubiendoRol(true);
        const { data: subidas, error } = await supabase.from('programa_servicios').insert(previaRol).select('id');
    setSubiendoRol(false);
    if (error) {
            setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo subir el rol: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
            // Avisa a cada persona programada que ya está disponible su rol nuevo
      supabase.functions.invoke('recordatorios', { body: { accion: 'rol-nuevo', ids: (subidas || []).map((r) => r.id) } }).catch((e) => console.error('No se pudo avisar del rol nuevo:', e));
         setAlerta({ visible: true, titulo: "¡Éxito!", mensaje: `Se subieron ${previaRol.length} fechas correctamente.`, onConfirmar: cerrarAlerta, isDark: isDark });
      setPreviaRol([]);
    }
  };

    // ---- Clases de niños: carga por CSV ----
  const parsearCSVClases = (texto) => {
    const lineas = texto.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
    if (lineas.length < 2) return [];
    const separador = (lineas[0].match(/;/g) || []).length > (lineas[0].match(/,/g) || []).length ? ';' : ',';
    const partir = (linea) => {
      const celdas = [];
      let actual = '';
      let entreComillas = false;
      for (const c of linea) {
        if (c === '"') entreComillas = !entreComillas;
        else if (c === separador && !entreComillas) { celdas.push(actual.trim()); actual = ''; }
        else actual += c;
      }
      celdas.push(actual.trim());
      return celdas;
    };
    const encabezados = partir(lineas[0]).map(normalizarEncabezado);
    return lineas.slice(1).map((linea) => {
      const valores = partir(linea);
      const fila = {};
      encabezados.forEach((h, i) => { fila[h] = valores[i] || ''; });
      return fila;
    });
  };

  const prepararCargaClases = async (texto) => {
    const filasCSV = parsearCSVClases(texto);
    const errores = [];
    const avisos = [];
    const filas = [];
    if (filasCSV.length === 0) return { filas, errores: ['El archivo está vacío o no tiene el formato esperado.'], avisos, meses: [], personas: 0 };

    const porUsuario = {};
    maestros.forEach((m) => { porUsuario[normalizarUsuario(m.nombre_usuario)] = m; });
    const buscarMaestro = (t) => porUsuario[normalizarUsuario(t)];
    const gruposPorPersonaMes = {};

    filasCSV.forEach((fila, idx) => {
      const numero = idx + 2;
      const fechaMes = parsearMesAnio(fila.mes);
      if (!fechaMes) { errores.push(`Fila ${numero}: el mes "${fila.mes || ''}" no se entiende (usa por ejemplo "Octubre 2026").`); return; }
      const mesAnio = `${NOMBRES_MESES[fechaMes.getMonth()]} ${fechaMes.getFullYear()}`;
      const domingos = domingosDelMes(fechaMes.getFullYear(), fechaMes.getMonth());
      let coordinador = null;
      if (fila.coordinador) {
        const c = buscarMaestro(fila.coordinador);
        if (!c) errores.push(`Fila ${numero}: el coordinador "${fila.coordinador}" no existe como usuario.`);
        else coordinador = c.nombre_usuario;
      }
      GRUPOS_CLASES.forEach((g) => {
        (fila[g.columna] || '').split(/[\/;|]/).map((n) => n.trim()).filter(Boolean).forEach((nombre) => {
          const m = buscarMaestro(nombre);
          if (!m) { errores.push(`Fila ${numero}: "${nombre}" (${g.grupo}) no existe como usuario.`); return; }
          if (!m.elegible_clases_ninos) avisos.push(`${m.nombre_usuario} no está marcado como elegible para Clases de niños.`);
          const clave = `${mesAnio}|${m.nombre_usuario}`;
          (gruposPorPersonaMes[clave] = gruposPorPersonaMes[clave] || []).push(g.grupo);
          domingos.forEach((d) => filas.push({ fecha: d, grupo: g.grupo, horario: g.horario, nombre_usuario: m.nombre_usuario, coordinador, equipo: fila.equipo || null, mes_anio: mesAnio }));
        });
      });
    });

    Object.entries(gruposPorPersonaMes).forEach(([clave, grupos]) => {
      if (grupos.length > 1) avisos.push(`${clave.split('|')[1]} aparece en ${grupos.length} grupos en ${clave.split('|')[0]}: ${grupos.join(', ')}.`);
    });
    if (filas.length === 0 && errores.length === 0) errores.push('No se encontró ninguna persona asignada en el archivo.');

    const meses = [...new Set(filas.map((f) => f.mes_anio))];
    if (meses.length > 0) {
      const { data: existentes } = await supabase.from('clases_asignadas').select('mes_anio').in('mes_anio', meses);
      [...new Set((existentes || []).map((x) => x.mes_anio))].forEach((mes) => errores.push(`Ya hay clases cargadas para ${mes}. Bórralas primero con "Borrar clases de un mes".`));
    }
    return { filas, errores: [...new Set(errores)], avisos: [...new Set(avisos)], meses, personas: new Set(filas.map((f) => f.nombre_usuario)).size };
  };

  const manejarArchivoClases = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = async (e) => {
      try {
        setPreviaClases(await prepararCargaClases(e.target.result));
      } catch (error) {
        setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo leer el archivo. Revisa que sea un CSV válido.", onConfirmar: cerrarAlerta, isDark: isDark });
      }
    };
    lector.readAsText(archivo);
  };

  const confirmarCargaClases = async () => {
    if (!previaClases || previaClases.errores.length > 0 || previaClases.filas.length === 0) return;
    setSubiendoClases(true);
    const { error } = await supabase.from('clases_asignadas').insert(previaClases.filas);
    setSubiendoClases(false);
    if (error) {
      setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudieron subir las clases: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: "¡Éxito!", mensaje: `Se guardaron ${previaClases.filas.length} clases de ${previaClases.personas} maestros.`, onConfirmar: cerrarAlerta, isDark: isDark });
      setPreviaClases(null);
    }
  };

    const buscarClases = async () => {
    const mesNum = parseInt(mesBuscarClases);
    const anioNum = parseInt(anioBuscarClases);
    if (!mesNum || mesNum < 1 || mesNum > 12 || !anioNum) {
      return setAlerta({ visible: true, titulo: "Aviso", mensaje: "Escribe un mes (1-12) y un año válidos.", onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setBuscandoClases(true);
    const desde = fechaISO(new Date(anioNum, mesNum - 1, 1));
    const hasta = fechaISO(new Date(anioNum, mesNum, 0));
    const { data, error } = await supabase.from('clases_asignadas').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: true }).order('grupo', { ascending: true }).range(0, 999);
    setBuscandoClases(false);
    if (error) { return setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo buscar: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark }); }
    setResultadosClases(data || []);
    setSeleccionadasClases([]);
  };

  const toggleSeleccionClase = (id) => {
    setSeleccionadasClases((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const seleccionarTodoClases = () => {
    setSeleccionadasClases(seleccionadasClases.length === resultadosClases.length ? [] : resultadosClases.map((r) => r.id));
  };

  const confirmarEliminarSeleccionadasClases = () => {
    if (seleccionadasClases.length === 0) return;
    setAlerta({
      visible: true, titulo: "Eliminar clases", mensaje: `¿Eliminar ${seleccionadasClases.length} clase(s)? Esta acción no se puede deshacer.`,
      textoConfirmar: "Eliminar", onCancelar: cerrarAlerta, isDark: isDark, themeColor: '#C97A7A',
      onConfirmar: async () => {
        cerrarAlerta();
        setEliminandoClases(true);
        const { data, error } = await supabase.from('clases_asignadas').delete().in('id', seleccionadasClases).select('id');
        setEliminandoClases(false);
        if (error) { setTimeout(() => setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo eliminar: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark }), 500); return; }
        const idsBorrados = (data || []).map((r) => r.id);
        setResultadosClases((prev) => prev.filter((r) => !idsBorrados.includes(r.id)));
        setSeleccionadasClases([]);
        if (idsBorrados.length < seleccionadasClases.length) {
          setTimeout(() => setAlerta({ visible: true, titulo: "No se borraron todas", mensaje: `Se eliminaron ${idsBorrados.length} de ${seleccionadasClases.length}. Las demás probablemente están bloqueadas por una regla de seguridad (RLS) en Supabase.`, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
        }
      }
    });
  };

  const descargarAsistenciaCSV = async () => {
    let desde = null;
    let hasta = null;
    if (mesAsistencia.trim()) {
      const fechaMes = parsearMesAnio(mesAsistencia);
      if (!fechaMes) {
        return setAlerta({ visible: true, titulo: "Aviso", mensaje: 'Escribe el mes así: "Enero 2027", o déjalo vacío para descargar todo.', onConfirmar: cerrarAlerta, isDark: isDark });
      }
      desde = fechaISO(fechaMes);
      hasta = fechaISO(new Date(fechaMes.getFullYear(), fechaMes.getMonth() + 1, 0));
    }
    setDescargandoAsistencia(true);
    const filas = [];
    for (let inicio = 0; ; inicio += 1000) {
      let consulta = supabase.from('asistencia_clases').select('fecha, grupo, registrado_por, ninos(nombre_completo)').order('fecha', { ascending: true }).order('grupo', { ascending: true }).order('id', { ascending: true });
      if (grupoAsistencia !== 'Todos') consulta = consulta.eq('grupo', grupoAsistencia);
      if (desde) consulta = consulta.gte('fecha', desde).lte('fecha', hasta);
      const { data, error } = await consulta.range(inicio, inicio + 999);
      if (error) {
        setDescargandoAsistencia(false);
        return setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo descargar: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
      }
      filas.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    setDescargandoAsistencia(false);
    if (filas.length === 0) {
      return setAlerta({ visible: true, titulo: "Sin datos", mensaje: "No hay asistencia registrada con ese filtro.", onConfirmar: cerrarAlerta, isDark: isDark });
    }
    const escapar = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = ['fecha,grupo,niño,registrado_por', ...filas.map((f) => [f.fecha, f.grupo, f.ninos ? f.ninos.nombre_completo : '', f.registrado_por].map(escapar).join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `asistencia_${grupoAsistencia.replace(/\s+/g, '-').toLowerCase()}_${fechaISO(new Date())}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const confirmarBorrarClasesMes = () => {
    const fechaMes = parsearMesAnio(mesBorrarClases);
    if (!fechaMes) {
      return setAlerta({ visible: true, titulo: "Aviso", mensaje: 'Escribe el mes así: "Octubre 2026".', onConfirmar: cerrarAlerta, isDark: isDark });
    }
    const mesAnio = `${NOMBRES_MESES[fechaMes.getMonth()]} ${fechaMes.getFullYear()}`;
    setAlerta({
      visible: true, titulo: "Borrar clases", mensaje: `¿Borrar todas las clases asignadas de ${mesAnio}? Esta acción no se puede deshacer.`,
      textoConfirmar: "Borrar", onCancelar: cerrarAlerta, isDark: isDark, themeColor: '#C97A7A',
      onConfirmar: async () => {
        cerrarAlerta();
        const { data, error } = await supabase.from('clases_asignadas').delete().eq('mes_anio', mesAnio).select('id');
        const mensaje = error ? "No se pudo borrar: " + error.message : (data && data.length > 0 ? `Se borraron ${data.length} clases de ${mesAnio}.` : `No se encontró nada para borrar en ${mesAnio}.`);
        setTimeout(() => setAlerta({ visible: true, titulo: error ? "Error" : "Listo", mensaje, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
      }
    });
  };

    async function buscarRol() {
    const mesNum = parseInt(mesBuscarRol);
    const anioNum = parseInt(anioBuscarRol);
    if (!mesNum || mesNum < 1 || mesNum > 12 || !anioNum) {
      return setAlerta({ visible: true, titulo: "Aviso", mensaje: "Escribe un mes (1-12) y un año válidos.", onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setBuscandoRol(true);
    const desde = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
    const hasta = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    const { data, error } = await supabase.from('programa_servicios').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: true });
    setBuscandoRol(false);
    if (error) { return setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo buscar: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark }); }
    setResultadosRol(data || []);
    setSeleccionadosRol([]);
  }

  function toggleSeleccionRol(id) {
    setSeleccionadosRol((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function seleccionarTodoRol() {
    setSeleccionadosRol(seleccionadosRol.length === resultadosRol.length ? [] : resultadosRol.map((r) => r.id));
  }

  function confirmarEliminarSeleccionadosRol() {
    if (seleccionadosRol.length === 0) return;
    setAlerta({
      visible: true, titulo: "Eliminar fechas", mensaje: `¿Eliminar ${seleccionadosRol.length} fecha(s) del rol? Esta acción no se puede deshacer.`,
      textoConfirmar: "Eliminar", onCancelar: cerrarAlerta, isDark: isDark, themeColor: '#C97A7A',
            onConfirmar: async () => {
        cerrarAlerta();
        setEliminandoRol(true);
        const { data, error } = await supabase.from('programa_servicios').delete().in('id', seleccionadosRol).select('id');
        setEliminandoRol(false);
        if (error) { setTimeout(() => setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo eliminar: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark }), 500); return; }
        const idsBorrados = (data || []).map((r) => r.id);
        setResultadosRol((prev) => prev.filter((r) => !idsBorrados.includes(r.id)));
        setSeleccionadosRol([]);
        if (idsBorrados.length < seleccionadosRol.length) {
          setTimeout(() => setAlerta({ visible: true, titulo: "No se borraron todas", mensaje: `Se eliminaron ${idsBorrados.length} de ${seleccionadosRol.length}. Las demás probablemente están bloqueadas por una regla de seguridad (RLS) en Supabase — parece limitarse a fechas pasadas.`, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
        }
      }
    });
  }

  const maestrosPorEquipo = maestros.reduce((acc, maestro) => {
    let equipo = maestro.equipo || 'Sin equipo';
    if (maestro.rol === 'administrador') equipo = 'Administradores';
    if (!acc[equipo]) acc[equipo] = [];
    acc[equipo].push(maestro); return acc;
  }, {});
  
    const listaEquipos = Object.keys(maestrosPorEquipo).filter((e) => e === 'Administradores').sort((a, b) => {
    if (a === 'Administradores') return -1; if (b === 'Administradores') return 1; return a.localeCompare(b);
  });

        return (
               <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, width: '100%', maxWidth: 850, alignSelf: 'center', paddingBottom: 30 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 15, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
              <Feather name="arrow-left" size={22} color={colors.textSub} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textMain, marginLeft: 4 }]}>Panel de Control</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
                <BloqueAdmin categoria="Calendario" isDark={isDark}>
        <Text style={[styles.topicTitle, { color: colors.textMain }]}>Registrar Usuario</Text>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSub }]}>Nombre y Apellido</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Ej. Juan Pérez" placeholderTextColor={colors.textSub} value={nombreCompleto} onChangeText={procesarNombre} />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSub }]}>Número Celular</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Ej. 8123456789" placeholderTextColor={colors.textSub} value={telefono} onChangeText={setTelefono} keyboardType="numeric" />
        </View>

                <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[styles.label, { color: colors.textSub }]}>Es Administrador</Text>
          <Switch trackColor={{ false: colors.cardBorder, true: "#EFBC68" }} thumbColor={"#FFFFFF"} onValueChange={setEsAdmin} value={esAdmin} />
        </View>

        <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Clases de niños</Text>
          <Switch trackColor={{ false: colors.cardBorder, true: "#5FA8A0" }} thumbColor={"#FFFFFF"} onValueChange={setElegibleClases} value={elegibleClases} />
        </View>

        <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Predicaciones y Clases</Text>
          <Switch trackColor={{ false: colors.cardBorder, true: "#7EA0D8" }} thumbColor={"#FFFFFF"} onValueChange={setElegiblePredicaciones} value={elegiblePredicaciones} />
        </View>
        
        {usuarioGenerado !== '' && (
          <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Accesos que se crearán:</Text>
            <View style={styles.autoGenRow}><Text style={[styles.autoGenLabel, { color: colors.textSub }]}>Usuario:</Text><TextInput style={[styles.autoGenInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} value={usuarioGenerado} onChangeText={setUsuarioGenerado} /></View>
            <View style={styles.autoGenRow}><Text style={[styles.autoGenLabel, { color: colors.textSub }]}>PIN (4 dígitos):</Text><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><TextInput style={[styles.autoGenInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, flex: 1 }]} value={pinGenerado} onChangeText={setPinGenerado} keyboardType="numeric" maxLength={4} /><TouchableOpacity onPress={generarNuevoPin} style={{ padding: 10 }}><Feather name="refresh-cw" size={18} color={colors.textSub} /></TouchableOpacity></View></View>
          </View>
        )}
        
        <TouchableOpacity style={styles.primaryButton} onPress={registrarMaestro}>{guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar</Text>}</TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
               <Text style={[styles.topicTitle, { color: colors.textMain }]}>Usuarios</Text>

                <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 15 }]}
          placeholder="Buscar usuario por nombre..."
          placeholderTextColor={colors.textSub}
          value={busquedaUsuario}
          onChangeText={setBusquedaUsuario}
        />

                {busquedaUsuario.trim() === '' && (
          <TouchableOpacity style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 15 }]} onPress={() => navigation.navigate('TodosUsuarios')}>
            <Feather name="users" size={24} color={colors.textSub} />
            <View style={{ marginLeft: 15, flex: 1 }}><Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>Todos los usuarios</Text><Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestros.length} en total</Text></View>
            <Feather name="chevron-right" size={20} color={colors.textSub} />
          </TouchableOpacity>
        )}

        {busquedaUsuario.trim() !== '' ? (
          <View>
            {maestros.filter(m => m.nombre_usuario.toLowerCase().includes(busquedaUsuario.trim().toLowerCase())).map((maestro) => (
              <View key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('DetalleUsuario', { maestro })}><Text style={[styles.userTextName, { color: colors.textMain }]}>{maestro.nombre_usuario} {maestro.nombre_usuario === usuarioActivoGlobal && "(Tú)"}</Text><Text style={[styles.userTextPin, { color: colors.textSub }]}>PIN: {maestro.pin_acceso}</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirWhatsApp(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo, maestro.telefono)}><Feather name="share-2" size={18} color={colors.textSub} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnGray} onPress={() => copiarInfo(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo)}><Feather name="copy" size={18} color={colors.textSub} /></TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}><Feather name="edit-2" size={18} color={colors.textSub} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}><Feather name="trash-2" size={18} color="#FFB7A1" /></TouchableOpacity>
                            </View>
            ))}
            <TouchableOpacity style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 5, marginBottom: 15 }]} onPress={() => navigation.navigate('TodosUsuarios')}>
              <Feather name="users" size={24} color={colors.textSub} />
              <View style={{ marginLeft: 15, flex: 1 }}><Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>Todos los usuarios</Text><Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestros.length} en total</Text></View>
              <Feather name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </View>
        ) : !equipoSeleccionadoAdmin ? (
          <View>
            <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Toca la tarjeta para ver a los administradores.</Text>
            {listaEquipos.map((equipo, index) => (
              <TouchableOpacity key={index} style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => setEquipoSeleccionadoAdmin(equipo)}>
                                {equipo === 'Administradores' ? <Feather name="shield" size={24} color={colors.textSub} /> : <IconoGrupoGrande size={24} color={colors.textSub} />}
                <View style={{ marginLeft: 15, flex: 1 }}><Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>{equipo}</Text><Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestrosPorEquipo[equipo].length} miembro(s)</Text></View>
                <Feather name="chevron-right" size={20} color={colors.textSub} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.backToEquiposBtn} onPress={() => setEquipoSeleccionadoAdmin(null)}><Feather name="arrow-left" size={18} color={colors.textSub} /><Text style={[styles.backToEquiposText, { color: colors.textSub }]}>Volver</Text></TouchableOpacity>
            <Text style={[styles.topicTitle, { color: '#EFBC68', marginTop: 10 }]}>{equipoSeleccionadoAdmin}</Text>
            {(maestrosPorEquipo[equipoSeleccionadoAdmin] || []).map((maestro) => (
              <View key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
              <Text style={[styles.userTextName, { color: colors.textMain }]}>{maestro.nombre_completo || maestro.nombre_usuario} {maestro.nombre_usuario === usuarioActivoGlobal && "(Tú)"}</Text>
              <Text style={[styles.userTextPin, { color: colors.textSub }]}>PIN: {maestro.pin_acceso}</Text></View>
                                                                <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirWhatsApp(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo, maestro.telefono)}><Feather name="share-2" size={18} color={colors.textSub} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnGray} onPress={() => copiarInfo(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo)}><Feather name="copy" size={18} color={colors.textSub} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}><Feather name="edit-2" size={18} color={colors.textSub} /></TouchableOpacity>                <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}><Feather name="trash-2" size={18} color="#FFB7A1" /></TouchableOpacity>
              </View>
            ))}
                 </View>
        )}

                </BloqueAdmin>
        <BloqueAdmin categoria="Predicaciones" isDark={isDark}>
        <Text style={[styles.topicTitle, { color: colors.textMain }]}>Cargar Rol (Clases y Predicaciones)</Text>
        <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Sube el archivo CSV con las fechas del periodo.</Text>

        {Platform.OS === 'web' && (
                    <SelectorArchivo isDark={isDark} onArchivo={manejarArchivoCSV} etiqueta="Elegir CSV del Rol" />
        )}

        {previaRol.length > 0 && (
          <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Se van a subir {previaRol.length} fechas:</Text>
            {previaRol.slice(0, 5).map((fila, index) => (
                            <Text key={index} style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>{fila.fecha} • {fila.horario} • {calcularTipo(fila.fecha, fila.horario)} • {fila.nombre_usuario}</Text>
            ))}
                        {previaRol.length > 5 && <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>...y {previaRol.length - 5} más</Text>}
            <TouchableOpacity style={[styles.primaryButton, { marginTop: 15 }]} onPress={confirmarCargaRol}>{subiendoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Confirmar y subir</Text>}</TouchableOpacity>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.topicTitle, { color: colors.textMain }]}>Buscar y eliminar Rol</Text>
        <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Si un rol se subió con errores, búscalo por mes y elimina lo que sobre.</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Mes (1-12)" placeholderTextColor={colors.textSub} value={mesBuscarRol} onChangeText={(t) => setMesBuscarRol(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={2} />
          <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Año (ej. 2026)" placeholderTextColor={colors.textSub} value={anioBuscarRol} onChangeText={(t) => setAnioBuscarRol(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} />
        </View>
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={buscarRol}>{buscandoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Buscar</Text>}</TouchableOpacity>

        {resultadosRol.length > 0 && (
          <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>{resultadosRol.length} fecha(s) encontradas</Text>
              <TouchableOpacity onPress={seleccionarTodoRol}><Text style={{ color: '#7EA0D8', fontSize: 12, fontWeight: '600' }}>{seleccionadosRol.length === resultadosRol.length ? 'Quitar selección' : 'Seleccionar todo'}</Text></TouchableOpacity>
            </View>
            {resultadosRol.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => toggleSeleccionRol(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                <Feather name={seleccionadosRol.includes(item.id) ? "check-square" : "square"} size={18} color={seleccionadosRol.includes(item.id) ? '#7EA0D8' : colors.textSub} />
                <Text style={{ color: colors.textMain, fontSize: 13, marginLeft: 10, flex: 1 }}>{item.fecha} • {item.horario} • {item.nombre_usuario}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.primaryButton, { marginTop: 15, backgroundColor: '#C97A7A' }]} onPress={confirmarEliminarSeleccionadosRol} disabled={seleccionadosRol.length === 0}>
              {eliminandoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Eliminar seleccionados ({seleccionadosRol.length})</Text>}
            </TouchableOpacity>
                    </View>
        )}

                </BloqueAdmin>
        <BloqueAdmin categoria="Clases de niños" isDark={isDark}>
        <Text style={[styles.topicTitle, { color: colors.textMain }]}>Cargar Clases de niños</Text>
        <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Sube el CSV con equipo, mes, coordinador y grupos. Se crea una clase por cada domingo del mes.</Text>

        {Platform.OS === 'web' && (
                    <SelectorArchivo isDark={isDark} onArchivo={manejarArchivoClases} etiqueta="Elegir CSV de clases" />
        )}

        {previaClases && (
          <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {previaClases.errores.length > 0 ? (
              <>
                <Text style={[styles.autoGenTitle, { color: '#C97A7A' }]}>Corrige esto antes de subir:</Text>
                {previaClases.errores.map((t, i) => <Text key={i} style={{ color: '#C97A7A', fontSize: 12, marginTop: 4 }}>• {t}</Text>)}
              </>
            ) : (
              <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Se van a crear {previaClases.filas.length} clases para {previaClases.personas} maestros en {previaClases.meses.join(', ')}:</Text>
            )}
            {previaClases.avisos.length > 0 && (
              <>
                <Text style={[styles.autoGenTitle, { color: '#C9A227', marginTop: 10 }]}>Avisos (no impiden subir):</Text>
                {previaClases.avisos.map((t, i) => <Text key={i} style={{ color: '#C9A227', fontSize: 12, marginTop: 4 }}>• {t}</Text>)}
              </>
            )}
            {previaClases.errores.length === 0 && previaClases.filas.slice(0, 5).map((f, i) => (
              <Text key={i} style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>{f.fecha} • {f.grupo} • {f.nombre_usuario}</Text>
            ))}
            {previaClases.errores.length === 0 && previaClases.filas.length > 5 && <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>...y {previaClases.filas.length - 5} más</Text>}
            {previaClases.errores.length === 0 && (
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 15 }]} onPress={confirmarCargaClases}>{subiendoClases ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Confirmar y subir</Text>}</TouchableOpacity>
            )}
          </View>
        )}

                <Text style={[styles.topicSubtitle, { color: colors.textSub, marginTop: 20, marginBottom: 10 }]}>Buscar y eliminar clases: búscalas por mes y elimina las que sobren.</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Mes (1-12)" placeholderTextColor={colors.textSub} value={mesBuscarClases} onChangeText={(t) => setMesBuscarClases(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={2} />
          <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Año (ej. 2027)" placeholderTextColor={colors.textSub} value={anioBuscarClases} onChangeText={(t) => setAnioBuscarClases(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} />
        </View>
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={buscarClases}>{buscandoClases ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Buscar</Text>}</TouchableOpacity>

        {resultadosClases.length > 0 && (
          <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>{resultadosClases.length} clase(s) encontradas</Text>
              <TouchableOpacity onPress={seleccionarTodoClases}><Text style={{ color: '#7EA0D8', fontSize: 12, fontWeight: '600' }}>{seleccionadasClases.length === resultadosClases.length ? 'Quitar selección' : 'Seleccionar todo'}</Text></TouchableOpacity>
            </View>
            {resultadosClases.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => toggleSeleccionClase(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                <Feather name={seleccionadasClases.includes(item.id) ? "check-square" : "square"} size={18} color={seleccionadasClases.includes(item.id) ? '#7EA0D8' : colors.textSub} />
                <Text style={{ color: colors.textMain, fontSize: 13, marginLeft: 10, flex: 1 }}>{item.fecha} • {item.grupo} • {item.nombre_usuario}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.primaryButton, { marginTop: 15, backgroundColor: '#C97A7A' }]} onPress={confirmarEliminarSeleccionadasClases} disabled={seleccionadasClases.length === 0}>
              {eliminandoClases ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Eliminar seleccionadas ({seleccionadasClases.length})</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.topicSubtitle, { color: colors.textSub, marginTop: 20, marginBottom: 10 }]}>Borrar clases de un mes (por si el archivo se subió con errores)</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Mes (ej. Octubre 2026)" placeholderTextColor={colors.textSub} value={mesBorrarClases} onChangeText={setMesBorrarClases} />
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 12, backgroundColor: '#C97A7A' }]} onPress={confirmarBorrarClasesMes}>
                    <Text style={styles.primaryButtonText}>Borrar clases del mes</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.topicTitle, { color: colors.textMain }]}>Asistencia de Clases de niños</Text>
        <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Descarga la asistencia en CSV: de un grupo o de todos juntos.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {['Todos', ...ORDEN_GRUPOS].map((g) => (
            <TouchableOpacity key={g} onPress={() => setGrupoAsistencia(g)} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: grupoAsistencia === g ? colors.textMain : colors.cardBorder, backgroundColor: grupoAsistencia === g ? colors.textMain : colors.cardBg }}>
              <Text style={{ color: grupoAsistencia === g ? colors.background : colors.textMain, fontWeight: '600', fontSize: 13 }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Mes (opcional, ej. Enero 2027)" placeholderTextColor={colors.textSub} value={mesAsistencia} onChangeText={setMesAsistencia} />
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={descargarAsistenciaCSV}>
          {descargandoAsistencia ? <ActivityIndicator color="#FFFFFF" /> : (<><Feather name="download" size={16} color="#FFFFFF" /><Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Descargar CSV</Text></>)}
        </TouchableOpacity>
              </BloqueAdmin>
      </ScrollView>
      <ModalEdicion visible={!!maestroEditando} maestro={maestroEditando} onCancelar={() => setMaestroEditando(null)} onGuardar={guardarEdicion} isDark={isDark} />
      <AlertaPersonalizada {...alerta} />
    </SafeAreaView>
  );
}

// ==========================================
// NAVEGADOR PRINCIPAL Y PROVIDER
// ==========================================
export default function App() {
    // El modo oscuro se guarda en el dispositivo para que se respete al volver a abrir la app
  const [isDark, setIsDark] = useState(() => {
    try { return Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage.getItem('modo_oscuro') === '1'; } catch (e) { return false; }
  });
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [rutaInicial, setRutaInicial] = useState('Login');

  // Sincroniza la barra de estado del navegador/PWA con el modo oscuro o claro.
  // app.json trae un themeColor fijo que solo aplica al abrir la app por primera vez;
  // esto lo actualiza en vivo cada vez que cambia isDark.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
            meta.setAttribute('content', getColors(isDark).background);
      document.documentElement.style.backgroundColor = getColors(isDark).background;
      document.body.style.backgroundColor = getColors(isDark).background;
    }
  }, [isDark]);

   // Inicializa OneSignal por su cuenta, sin bloquear el resto de la app si falla
  useEffect(() => {
        iniciarOneSignal();
  }, []);

    // Revisa si ya hay una sesión real de Supabase guardada, sin esperar a OneSignal
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase.from('maestros').select('*').eq('user_id', session.user.id).single();
          if (data) {
                        usuarioActivoGlobal = data.nombre_usuario;
            rolUsuarioActivoGlobal = data.rol;
            equipoActivoGlobal = data.equipo;
                        vincularOneSignal(data.nombre_usuario);
            setRutaInicial('MenuPrincipal');
          }
        }
      } catch (e) {
        console.error('Error leyendo sesión:', e);
      } finally {
        setCargandoSesion(false);
      }
    })();
  }, []);

if (cargandoSesion) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }
  
    const toggleTheme = () => {
    const nuevo = !isDark;
    setIsDark(nuevo);
    AsyncStorage.setItem('modo_oscuro', nuevo ? '1' : '0').catch(() => {});
  };
  const colors = getColors(isDark);

  // Tema global para React Navigation, elimina el flasheo blanco vinculando el Root al fondo actual
  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.background,
      text: colors.textMain,
      border: colors.background,
    },
  };
  
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
                <NavigationContainer theme={MyTheme} linking={linking}>
          <Stack.Navigator 
            initialRouteName={rutaInicial}
            screenOptions={{
              headerShadowVisible: false, 
              headerTitleStyle: { fontFamily: 'serif', fontWeight: 'bold' },
              contentStyle: { backgroundColor: colors.background }
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="MenuPrincipal" component={MenuPrincipalScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Grupos" component={GruposScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MiRol" component={MiRolScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Temas" component={TemasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Clases" component={ClasesScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ClaseDetalle" component={ClaseDetalleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Domingos" component={DomingosScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="DomingoDetalle" component={DomingoDetalleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Coritos" component={CoritosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Tablon" component={TablonScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="TodosUsuarios" component={TodosUsuariosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DetalleUsuario" component={DetalleUsuarioScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </ThemeContext.Provider>
  );
}

// ==========================================
// ESTILOS Optimizados para Tablets y Modo Horizontal
// ==========================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    // Ajuste universal de márgenes para cámara (Notch)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : (Platform.OS === 'ios' ? 40 : 0)
  }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSoloText: { paddingBottom: 10, paddingTop: 5 },
  headerRowSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 5, paddingBottom: 10 },
    title: { fontSize: 22, letterSpacing: 1, fontWeight: 'bold', marginRight: 10 },
  titleMini: { fontSize: 18, letterSpacing: 1.5, fontFamily: 'serif' },
  subtitle: { fontSize: 14, marginTop: 5 },
  toggleContainer: { alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 10, marginBottom: 2, textTransform: 'uppercase', fontWeight: 'bold' },
  
  loginBox: { width: '100%', maxWidth: 450, backgroundColor: '#FFFFFF', padding: 25, borderRadius: 16, borderWidth: 1, borderColor: '#C8CFD6' },
  
  gruposContainer: { paddingVertical: 10, gap: 16 },
  grupoIcon: { marginBottom: 10 },
  grupoTitleBlanco: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  grupoEdadBlanco: { fontSize: 14, color: '#FFFFFF', marginTop: 4, opacity: 0.95, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  
  listContainer: { width: '100%' },
    card: { borderRadius: 30, padding: 22 },
  cardLight: { borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  textContainer: { flex: 1, paddingRight: 10 },
  topicTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  topicSubtitle: { fontSize: 14, flex: 1, marginBottom: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 12 },
  iconText: { flexDirection: 'row', alignItems: 'center' },
  monthText: { fontSize: 14, fontWeight: '500', marginLeft: 6 },
  teacherText: { fontSize: 14, marginLeft: 6 },
  
  detalleTitleMain: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  detalleSubtitle: { fontSize: 15, fontWeight: '600' },
  detalleBase: { fontSize: 14, fontStyle: 'italic', marginTop: 6 },
  seccionDetalle: { marginBottom: 20 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' }, 
  seccionTexto: { fontSize: 18, fontWeight: '500', lineHeight: 28 },
  
  adminButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 'auto' },
  adminButtonText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  
  adminContainer: { paddingHorizontal: 24, paddingTop: 10 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 18, padding: 15, fontSize: 16 },
  primaryButton: { backgroundColor: '#4A5568', padding: 17, borderRadius: 999, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  solicitarBtnClaro: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 15, borderRadius: 999, justifyContent: 'center' },
  solicitarBtnClaroText: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  tablonButton: { marginTop: 10, borderWidth: 1, padding: 16, borderRadius: 999, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  tablonButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  aceptarDiscreto: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, marginLeft: 10 },
  aceptarDiscretoText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  cancelarButton: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 },
  cancelarButtonText: { fontWeight: 'bold', fontSize: 13 },
  emptyState: { padding: 30, alignItems: 'center', borderWidth: 1, borderRadius: 28, marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxWidth: 400, borderRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'center' },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, marginRight: 10, borderWidth: 1 },
  modalCancelText: { fontWeight: 'bold', fontSize: 15 },
  modalConfirmBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999 },
  modalConfirmText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  divider: { height: 1, marginVertical: 25 },
  
  equipoFolder: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 18, borderRadius: 28, marginBottom: 12 },
  equipoFolderTitle: { fontSize: 16, fontWeight: 'bold' },
  equipoFolderSub: { fontSize: 13, marginTop: 2 },
  backToEquiposBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
  backToEquiposText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, paddingVertical: 15, paddingHorizontal: 22, borderRadius: 32, marginBottom: 10 },
  userTextName: { fontSize: 16, fontWeight: 'bold' },
  userTextPin: { fontSize: 13, marginTop: 2 },
  actionBtnBlue: { padding: 10, backgroundColor: 'rgba(74, 85, 104, 0.2)', borderRadius: 14, marginLeft: 6 },
  actionBtnGray: { padding: 10, backgroundColor: 'rgba(74, 85, 104, 0.2)', borderRadius: 14, marginLeft: 6 },
  actionBtnRed: { padding: 10, backgroundColor: 'rgba(255, 183, 161, 0.2)', borderRadius: 14, marginLeft: 6 },
  
  autoGenBox: { borderWidth: 1, padding: 15, borderRadius: 20, marginBottom: 20 },
  autoGenTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 },
  autoGenRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  autoGenLabel: { width: 100, fontSize: 14, fontWeight: '500' },
  autoGenInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 8, fontSize: 14 }
});
