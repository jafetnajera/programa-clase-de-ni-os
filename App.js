import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Text, View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Switch, Modal, Linking, Platform, StatusBar, KeyboardAvoidingView, Image, Animated, RefreshControl, useWindowDimensions } from 'react-native';
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
  },
});

let usuarioActivoGlobal = null;
let rolUsuarioActivoGlobal = null;

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
    'Usuarios': { fondo: '#F3D9A8', texto: '#6B4A12' },
    'Cena': { fondo: '#CFA7A7', texto: '#5A2626' },
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
    'Usuarios': { fondo: '#DFC18C', texto: '#4A3208' },
    'Cena': { fondo: '#B98E8E', texto: '#3E1717' },
  },
};

// Función para obtener el color dinámico del grupo
const getThemeColors = (grupo, isDark) => {
  switch (grupo) {
    case 'Niños':
      return { main: '#FFB7A1', textDark: isDark ? '#FFB7A1' : '#D96E53', bgLight: isDark ? 'rgba(255, 183, 161, 0.1)' : '#FFF0EC' };
    case 'Pre adolescentes':
      return { main: '#EFBC68', textDark: isDark ? '#EFBC68' : '#C48B29', bgLight: isDark ? 'rgba(239, 188, 104, 0.1)' : '#FDF6EB' };
    case 'Adolescentes':
      return { main: '#919F89', textDark: isDark ? '#919F89' : '#6A7A61', bgLight: isDark ? 'rgba(145, 159, 137, 0.1)' : '#EEF1ED' };
    case 'Cuneros':
      return { main: '#7E9CC2', textDark: isDark ? '#9FB5CF' : '#3E5F87', bgLight: isDark ? 'rgba(126, 156, 194, 0.15)' : '#EEF3F9' };
    case 'Cuneros tarde':
      return { main: '#B8977A', textDark: isDark ? '#D5BFA8' : '#7A5634', bgLight: isDark ? 'rgba(184, 151, 122, 0.15)' : '#F8F1EA' };
    case 'Tarde 4 a 8':
      return { main: '#D08F6E', textDark: isDark ? '#E3B59B' : '#9A5432', bgLight: isDark ? 'rgba(208, 143, 110, 0.15)' : '#FBF0EA' };
    case 'Tarde 9 a 12':
      return { main: '#8FA57E', textDark: isDark ? '#B7C9A8' : '#55703F', bgLight: isDark ? 'rgba(143, 165, 126, 0.15)' : '#F0F5EC' };
    case 'Coritos':
      return { main: '#B98BA3', textDark: isDark ? '#D9B8C9' : '#7A4766', bgLight: isDark ? 'rgba(185, 139, 163, 0.15)' : '#F8EFF4' };
    case 'Clases de niños':
      return { main: '#5FA8A0', textDark: isDark ? '#5FA8A0' : '#2F6E5E', bgLight: isDark ? 'rgba(95, 168, 160, 0.15)' : '#EAF3F0' };
    case 'Predicaciones':
      return { main: '#7EA0D8', textDark: isDark ? '#9FBCE8' : '#2C4A73', bgLight: isDark ? 'rgba(126, 160, 216, 0.18)' : '#EDF2FA' };
    case 'Anuncios':
      return { main: '#E0935A', textDark: isDark ? '#E0935A' : '#8A4F1E', bgLight: isDark ? 'rgba(224, 147, 90, 0.15)' : '#FBEEDD' };
    case 'Petición':
      return { main: '#9B8AC4', textDark: isDark ? '#9B8AC4' : '#5B4A8A', bgLight: isDark ? 'rgba(155, 138, 196, 0.15)' : '#F1EDFA' };
    case 'Calendario':
      return { main: '#C97A7A', textDark: isDark ? '#C97A7A' : '#A34A4A', bgLight: isDark ? 'rgba(201, 122, 122, 0.15)' : '#FDEFEF' };
    default:
      return { main: '#4A5568', textDark: isDark ? '#A0AEC0' : '#4A5568', bgLight: isDark ? '#3B424D' : '#FFFFFF' };
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
  { columna: 'grupo_4_6', alias: 'grupo_3_6', grupo: 'Niños', horario: 'mañana' },
  { columna: 'grupo_7_9', grupo: 'Pre adolescentes', horario: 'mañana' },
  { columna: 'grupo_10_12', alias: 'grupo_10_13', grupo: 'Adolescentes', horario: 'mañana' },
  { columna: 'grupo_cuneros_tarde', grupo: 'Cuneros tarde', horario: 'tarde' },
  { columna: 'grupo_4_8', grupo: 'Tarde 4 a 8', horario: 'tarde' },
  { columna: 'grupo_9_12', grupo: 'Tarde 9 a 12', horario: 'tarde' },
];
// Cómo funciona cada grupo: con temario propio, solo cuidado (cuneros) o repaso de un grupo de la mañana
const GRUPOS_INFO = {
  'Cuneros': { turno: 'Mañana', edades: '0 a 3 años', icono: 'heart', cuidado: true },
  'Niños': { turno: 'Mañana', edades: '4 a 6 años', icono: 'smile', temario: true },
  'Pre adolescentes': { turno: 'Mañana', edades: '7 a 9 años', icono: 'users', temario: true },
  'Adolescentes': { turno: 'Mañana', edades: '10 a 12 años', icono: 'book', temario: true },
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
// Usuario para entrar a la app: sin acentos, la ñ se vuelve n, sin espacios y en minúsculas.
// Supabase no acepta ñ ni acentos en el correo interno (usuario@indus.app).
const usuarioSeguro = (texto) =>
  (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
// Al volver a subir un rol: compara lo cargado con lo nuevo para saber qué se agrega, qué se quita y qué cambia.
// Lo que no cambia se queda igual (conserva confirmaciones y quién cubre a quién).
const titularDe = (r) => (r.usuario_original || r.nombre_usuario || '').toLowerCase();
// Hora para comparar: "18:00", "6:00 pm" y "6:00:00 p. m." cuentan como la misma
const horaClave = (h) => {
  const m = (h || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:([ap])\.?\s*m\.?)?$/);
  if (!m) return (h || '').toLowerCase().trim();
  let hora = parseInt(m[1], 10) % 12;
  if (m[3] === 'p' || (!m[3] && parseInt(m[1], 10) >= 12)) hora += 12;
  return `${String(hora).padStart(2, '0')}:${m[2]}`;
};
const compararRol = (actuales, nuevas, claveDe, campos) => {
  const porClave = new Map(actuales.map((r) => [claveDe(r), r]));
  const vistas = new Set();
  const agregar = [];
  const actualizar = [];
  nuevas.forEach((n) => {
    const k = claveDe(n);
    if (vistas.has(k)) return;
    vistas.add(k);
    const a = porClave.get(k);
    if (!a) return agregar.push(n);
    const cambios = {};
    campos.forEach((c) => {
      if ((a[c] || null) !== (n[c] || null)) cambios[c] = n[c] || null;
    });
    if (Object.keys(cambios).length > 0) actualizar.push({ id: a.id, cambios, antes: a, despues: n });
  });
  return { agregar, quitar: actuales.filter((a) => !vistas.has(claveDe(a))), actualizar };
};
// Trae todas las filas de una consulta, de 1000 en 1000 (Supabase no regresa más de 1000 por vez)
const traerTodo = async (armarConsulta) => {
  const filas = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await armarConsulta().range(i, i + 999);
    if (error) throw error;
    filas.push(...(data || []));
    if (!data || data.length < 1000) return filas;
  }
};
// Avisa por notificación a quienes les cambió algo del rol (clases o predicaciones)
const avisarRolActualizado = (usuarios, tipo) => {
  const lista = [...new Set((usuarios || []).filter(Boolean).map((u) => u.toLowerCase()))];
  if (lista.length === 0) return;
  supabase.functions.invoke('recordatorios', { body: { accion: 'rol-actualizado', tipo, usuarios: lista } }).catch((e) => console.error('No se pudo avisar del cambio de rol:', e));
};
// Borra por partes (para no mandar listas enormes de una vez)
const borrarPorIds = async (tabla, ids) => {
  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await supabase
      .from(tabla)
      .delete()
      .in('id', ids.slice(i, i + 200));
    if (error) throw error;
  }
};
const normalizarUsuario = usuarioSeguro;

const normalizarEncabezado = (texto) =>
  (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

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
      VistaAdmin: 'vista-admin',
      MiRol: 'mi-rol',
      Roles: 'roles',
      Cena: 'cena',
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
                <Text style={[styles.modalCancelText, { color: colors.textSub }]}>{textoCancelar || 'Cancelar'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: btnColor }]} onPress={onConfirmar}>
              <Text style={styles.modalConfirmText}>{textoConfirmar || 'Aceptar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ModalEdicion = ({ visible, maestro, onGuardar, onCancelar, isDark }) => {
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoNombreCompleto, setNuevoNombreCompleto] = useState('');
  const [nuevoElegibleClases, setNuevoElegibleClases] = useState(false);
  const [nuevoElegiblePredicaciones, setNuevoElegiblePredicaciones] = useState(false);
  const [nuevoPresidir, setNuevoPresidir] = useState(false);
  const [nuevoMesa, setNuevoMesa] = useState(false);
  const [nuevoEsAdmin, setNuevoEsAdmin] = useState(false);
  const esYoMismo = !!maestro && maestro.nombre_usuario === usuarioActivoGlobal;
  const colors = getColors(isDark);

  useEffect(() => {
    if (maestro) {
      setNuevoTelefono(maestro.telefono || '');
      setNuevoNombreCompleto(maestro.nombre_completo || '');
      setNuevoElegibleClases(!!maestro.elegible_clases_ninos);
      setNuevoElegiblePredicaciones(!!maestro.elegible_predicaciones);
      setNuevoPresidir(!!maestro.elegible_presidir);
      setNuevoMesa(!!maestro.elegible_mesa);
      setNuevoEsAdmin(maestro.rol === 'administrador');
    }
  }, [maestro]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.textMain }]}>Editar Maestro</Text>
          <Text style={[styles.modalMessage, { color: colors.textSub }]}>{maestro?.nombre_usuario}</Text>

          <Text style={[styles.label, { color: colors.textSub, marginTop: 12 }]}>Nombre para mostrar</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} value={nuevoNombreCompleto} onChangeText={setNuevoNombreCompleto} placeholder="Ej. Jafet Najera" placeholderTextColor={colors.textSub} />

          <Text style={[styles.label, { color: colors.textSub, marginTop: 12 }]}>Número celular</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} value={nuevoTelefono} onChangeText={(texto) => setNuevoTelefono(texto.replace(/[^0-9]/g, ''))} placeholder="Ej. 8123456789" placeholderTextColor={colors.textSub} keyboardType="numeric" />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSub }]}>Es administrador</Text>
              {esYoMismo ? <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>No puedes quitarte a ti mismo</Text> : null}
            </View>
            <Switch trackColor={{ false: colors.cardBorder, true: '#EFBC68' }} thumbColor={'#FFFFFF'} onValueChange={setNuevoEsAdmin} value={nuevoEsAdmin} disabled={esYoMismo} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Clases de niños</Text>
            <Switch trackColor={{ false: colors.cardBorder, true: '#5FA8A0' }} thumbColor={'#FFFFFF'} onValueChange={setNuevoElegibleClases} value={nuevoElegibleClases} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Predicaciones y Clases</Text>
            <Switch trackColor={{ false: colors.cardBorder, true: '#7EA0D8' }} thumbColor={'#FFFFFF'} onValueChange={setNuevoElegiblePredicaciones} value={nuevoElegiblePredicaciones} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSub }]}>Cena del Señor: presidir</Text>
            <Switch trackColor={{ false: colors.cardBorder, true: '#B98E8E' }} thumbColor={'#FFFFFF'} onValueChange={setNuevoPresidir} value={nuevoPresidir} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSub }]}>Cena del Señor: servir la mesa</Text>
            <Switch trackColor={{ false: colors.cardBorder, true: '#B98E8E' }} thumbColor={'#FFFFFF'} onValueChange={setNuevoMesa} value={nuevoMesa} />
          </View>

          <View style={[styles.modalButtons, { marginTop: 20 }]}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]} onPress={onCancelar}>
              <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: '#EFBC68' }]}
              onPress={() => {
                onGuardar({ telefono: nuevoTelefono, nombre_completo: nuevoNombreCompleto, elegible_clases_ninos: nuevoElegibleClases, elegible_predicaciones: nuevoElegiblePredicaciones, elegible_presidir: nuevoPresidir, elegible_mesa: nuevoMesa, rol: nuevoEsAdmin ? 'administrador' : 'maestro', equipo: nuevoEsAdmin ? 'Administradores' : maestro.equipo === 'Administradores' ? 'Sin equipo' : maestro.equipo });
              }}
            >
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
    promesaOneSignal = OneSignal.init({ appId: 'a598b3d5-0064-4124-bf93-2543c79a9922' }).catch((e) => {
      console.error('OneSignal no se pudo inicializar:', e);
    });
  }
  return promesaOneSignal;
};
const vincularOneSignal = (usuario) => {
  if (!usuario) return colaOneSignal;
  colaOneSignal = colaOneSignal.then(async () => {
    try {
      await iniciarOneSignal();
      await OneSignal.login(usuario);
    } catch (e) {
      console.error('OneSignal.login falló:', e);
    }
  });
  return colaOneSignal;
};
const cerrarOneSignal = () => {
  colaOneSignal = colaOneSignal.then(async () => {
    try {
      await iniciarOneSignal();
      await OneSignal.logout();
    } catch (e) {
      console.error('OneSignal.logout falló:', e);
    }
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
      try {
        suscrito = OneSignal.User.PushSubscription.optedIn === true;
      } catch (e) {}
      return suscrito ? 'activo' : 'pendiente';
    }
    return 'pendiente';
  } catch (e) {
    return 'no-soportado';
  }
};

// Pide el permiso (debe llamarse desde un toque de la persona) y vincula este dispositivo con su usuario
const activarAvisos = async () => {
  try {
    await iniciarOneSignal();
    await OneSignal.Notifications.requestPermission();
    if (OneSignal.User.PushSubscription.optedIn !== true) await OneSignal.User.PushSubscription.optIn();
    if (usuarioActivoGlobal) await vincularOneSignal(usuarioActivoGlobal);
  } catch (e) {
    console.error('No se pudieron activar los avisos:', e);
  }
  return estadoAvisos();
};

// Panel de Ajustes: se desliza desde la izquierda y cubre solo una parte de la pantalla
const PanelAjustes = ({ visible, onCerrar, isDark, toggleTheme, onCerrarSesion, onAdmin, onAyuda }) => {
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
      cargarMapaNombres().then((mapa) => {
        const n = mapa[usuarioActivoGlobal.toLowerCase()];
        if (n) setNombreVisible(ponerMayusculas(n));
      });
      return;
    }
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('maestros').select('nombre_usuario').eq('user_id', session.user.id).single();
        if (data) {
          usuarioActivoGlobal = data.nombre_usuario;
          setNombreVisible(data.nombre_usuario);
        }
      } catch (e) {
        console.error('No se pudo leer el usuario:', e);
      }
    })();
  }, [visible]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] });
  const overlayOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, overflow: 'hidden' }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableOpacity activeOpacity={1} onPress={onCerrar} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: overlayOpacity }]} />
      </TouchableOpacity>
      <Animated.View style={{ position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 48, left: 0, width: '72%', maxWidth: 300, backgroundColor: colors.background, borderTopRightRadius: 36, borderBottomRightRadius: 36, overflow: 'hidden', transform: [{ translateX }], paddingTop: 26, paddingBottom: 12, paddingHorizontal: 20 }}>
        <Text style={{ color: colors.textMain, fontSize: 20, fontWeight: '700', marginBottom: 18 }}>Hola, {nombreVisible}</Text>
        <Text style={[styles.titleMini, { color: colors.textSub, marginBottom: 14 }]}>Ajustes</Text>
        <TouchableOpacity
          onPress={() => {
            onCerrar();
            toggleTheme();
          }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
        >
          <Feather name={isDark ? 'sun' : 'moon'} size={20} color={colors.textSub} />
          <Text style={{ marginLeft: 14, fontSize: 15, color: colors.textMain }}>{isDark ? 'Modo claro' : 'Modo oscuro'}</Text>
        </TouchableOpacity>
        {avisos !== 'no-soportado' && (
          <TouchableOpacity
            activeOpacity={avisos === 'pendiente' ? 0.6 : 1}
            onPress={async () => {
              if (avisos === 'pendiente') setAvisos(await activarAvisos());
            }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
          >
            <Feather name={avisos === 'activo' ? 'bell' : 'bell-off'} size={20} color={avisos === 'pendiente' ? colors.textMain : colors.textSub} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textMain }}>{avisos === 'activo' ? 'Avisos activados' : avisos === 'pendiente' ? 'Activar avisos' : avisos === 'bloqueado' ? 'Avisos bloqueados' : 'Instala la app para recibir avisos'}</Text>
              {avisos === 'bloqueado' && <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>Actívalos en los ajustes de tu teléfono o navegador</Text>}
              {avisos === 'instalar' && <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>Agrégala a tu pantalla de inicio</Text>}
            </View>
          </TouchableOpacity>
        )}
        {onAyuda && (
          <TouchableOpacity
            onPress={() => {
              onCerrar();
              onAyuda();
            }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
          >
            <Feather name="help-circle" size={20} color={colors.textSub} />
            <Text style={{ marginLeft: 14, fontSize: 15, color: colors.textMain }}>Ayuda</Text>
          </TouchableOpacity>
        )}
        {rolUsuarioActivoGlobal === 'administrador' && onAdmin && (
          <TouchableOpacity
            onPress={() => {
              onCerrar();
              onAdmin();
            }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
          >
            <Feather name="settings" size={20} color={colors.textSub} />
            <Text style={{ marginLeft: 14, fontSize: 15, color: colors.textMain }}>Administración</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 6 }} />
        <TouchableOpacity
          onPress={() => {
            onCerrar();
            onCerrarSesion();
          }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
        >
          <Feather name="log-out" size={20} color={colors.textSub} />
          <Text style={{ marginLeft: 14, fontSize: 15, color: colors.textMain }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Panel de avisos: sale por la derecha, igual que el de ajustes, y mide lo que su contenido (con límite)
const PanelNotificaciones = ({ visible, onCerrar, onNavegar, onRevisadas, isDark }) => {
  const colors = getColors(isDark);
  const anim = useRef(new Animated.Value(0)).current;
  const [avisos, setAvisos] = useState([]);
  const [vistasPrevias, setVistasPrevias] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: false }).start();
    if (!visible) return;
    (async () => {
      setCargando(true);
      const { items, vistas } = await obtenerNotificaciones();
      setVistasPrevias(vistas);
      await marcarNotificacionesVistas(items);
      const nuevas = items.filter((n) => n.accion || n.abierta || !vistas.includes(n.clave));
      const yaVistas = items.filter((n) => !n.accion && !n.abierta && vistas.includes(n.clave));
      setAvisos([...nuevas, ...yaVistas]);
      setCargando(false);
      if (onRevisadas) onRevisadas(items.some((n) => n.accion));
    })();
  }, [visible]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const overlayOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, overflow: 'hidden' }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableOpacity activeOpacity={1} onPress={onCerrar} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: overlayOpacity }]} />
      </TouchableOpacity>
      <Animated.View style={{ position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 48, right: 0, width: '88%', maxWidth: 380, maxHeight: '80%', backgroundColor: colors.background, borderTopLeftRadius: 36, borderBottomLeftRadius: 36, overflow: 'hidden', transform: [{ translateX }], paddingTop: 22, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ flex: 1, color: colors.textMain, fontSize: 20, fontWeight: '700' }}>Avisos</Text>
          <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }} accessibilityLabel="Cerrar avisos">
            <Feather name="x" size={22} color={colors.textSub} />
          </TouchableOpacity>
        </View>
        {cargando ? (
          <ActivityIndicator color={colors.textSub} style={{ marginVertical: 24 }} />
        ) : avisos.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
            <Feather name="bell-off" size={34} color={colors.textSub} />
            <Text style={{ color: colors.textSub, fontSize: 14, marginTop: 12, textAlign: 'center' }}>No tienes avisos por ahora.</Text>
          </View>
        ) : (
          <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6 }}>
            {avisos.map((s) => (
              <TouchableOpacity
                key={s.clave}
                activeOpacity={0.8}
                onPress={() => {
                  onCerrar();
                  onNavegar(s.destino ? s.destino.pantalla : 'Tablon', s.destino ? s.destino.params : {});
                }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 22, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 10, opacity: !s.accion && !s.abierta && vistasPrevias.includes(s.clave) ? 0.5 : 1 }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{s.mensaje}</Text>
                  <Text style={{ color: colors.textSub, fontSize: 12.5, marginTop: 2 }}>{s.detalle}</Text>
                  {s.cenaTurno ? (
                    <AccionesCena
                      turno={s.cenaTurno}
                      isDark={isDark}
                      onHecho={(r) => {
                        if (r === 'confirmar') {
                          onCerrar();
                          onNavegar('Cena', {});
                        } else setAvisos((prev) => prev.filter((x) => x.clave !== s.clave));
                      }}
                    />
                  ) : null}
                </View>
                <Feather name="chevron-right" size={18} color={colors.textSub} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

// ---- AYUDA: preguntas frecuentes (gratis, sin inteligencia artificial) ----
// Para agregar o corregir una duda, edita esta lista. "claves" son palabras extra para que el buscador la encuentre.
const PREGUNTAS_AYUDA = [
  {
    id: 'avisos',
    pregunta: 'No me llegan los avisos',
    respuesta: 'Abre los ajustes (el engrane de arriba a la izquierda) y revisa que diga «Avisos activados».\n\n• Si dice «Activar avisos», tócalo y acepta el permiso.\n• Si dice «Avisos bloqueados», actívalos en los ajustes de tu teléfono o navegador.\n• En iPhone los avisos solo llegan si la app está instalada en tu pantalla de inicio.',
    claves: 'notificaciones alertas mensajes push suena llega celular permiso',
  },
  {
    id: 'instalar',
    pregunta: '¿Cómo instalo la app en mi celular?',
    respuesta: '• iPhone: abre la página en Safari, toca el botón Compartir (el cuadrito con flecha hacia arriba) y elige «Agregar a inicio».\n• Android: abre la página en Chrome, toca los tres puntos ⋮ y elige «Instalar app» o «Agregar a la pantalla principal».\n\nDespués ábrela siempre desde el ícono que se creó.',
    claves: 'descargar icono pantalla inicio iphone android safari chrome agregar instalar',
  },
  {
    id: 'spam',
    pregunta: 'Me sale «Posible spam» en un aviso',
    respuesta: 'Es una revisión automática de Chrome en Android, no un problema de la app. Para que no vuelva a salir:\n\n• Toca el aviso y elige «Ver notificación».\n• Luego toca «Permitir siempre» (o «Informar que no es spam»).\n\nSolo se hace una vez en cada celular.',
    claves: 'spam posible sospechoso chrome android aviso notificacion bloqueado advertencia',
  },
  {
    id: 'cena',
    pregunta: '¿Cómo funciona la Cena del Señor?',
    respuesta: 'Cada martes la app invita a 7 hermanos para el domingo: 1 preside y 6 sirven la mesa.\n\n• Te llega el aviso «Confirma tu apoyo para la Cena del Señor». Respóndelo desde los avisos con «Confirmar» o «No puedo».\n• Si confirmas, en «Rol de predicaciones y Cena del Señor» → «Rol de la Cena del Señor» verás tu lugar y el recorrido que te toca.\n• Si no puedes, la app invita a otro hermano.',
    claves: 'cena senor santa cena mesa presidir servir charolas repartir confirmar',
    ir: { pantalla: 'Cena', texto: 'Ver la Cena del Señor' },
  },
  {
    id: 'cuando',
    pregunta: '¿Dónde veo cuándo me toca?',
    respuesta: '• Tus clases están en «Clases de niños», dentro de tu grupo.\n• Tus predicaciones están en «Rol de predicaciones».\n\nAdemás te llegan recordatorios, y todos aparecen en el botón de avisos de arriba a la derecha del inicio.',
    claves: 'fecha toca domingo turno calendario recordatorio clase predicacion',
    ir: { pantalla: 'Notificaciones', texto: 'Ver mis avisos' },
  },
  {
    id: 'apoyoClase',
    pregunta: 'No puedo dar mi clase, ¿cómo pido apoyo?',
    respuesta: 'Entra a «Clases de niños», abre tu grupo y tu clase, y toca «Solicitar apoyo para esta clase».\n\nPuedes pedírselo a alguien en específico o dejar que la tome cualquiera que pueda cubrirte. Cuando alguien acepte, te llegará un aviso.',
    claves: 'faltar falto cubrir sustituto cambio ayuda solicitar no puedo ir',
    ir: { pantalla: 'Grupos', texto: 'Ir a Clases de niños' },
  },
  {
    id: 'apoyoRol',
    pregunta: 'No puedo predicar en mi fecha, ¿qué hago?',
    respuesta: 'Entra a «Rol de predicaciones» y, en tu fecha, toca el botón de las dos flechas para pedir apoyo.\n\nPuedes pedir que solo te cubran o hacer un intercambio de fechas con alguien.',
    claves: 'predicacion cambio intercambio cubrir faltar rol fecha',
    ir: { pantalla: 'MiRol', texto: 'Ir al rol' },
  },
  {
    id: 'cubrir',
    pregunta: '¿Cómo cubro a alguien?',
    respuesta: 'Cuando alguien pide apoyo te llega un aviso. Abre «Solicitudes de apoyo» y toca «Aceptar» en la que puedas cubrir.\n\nSolo ves el botón «Aceptar» en las solicitudes que te corresponden.',
    claves: 'aceptar solicitud ayudar tablon apoyo sustituir',
    ir: { pantalla: 'Tablon', texto: 'Ver solicitudes de apoyo' },
  },
  {
    id: 'confirmar',
    pregunta: '¿Cómo confirmo mi predicación?',
    respuesta: 'Entra a «Rol de predicaciones» y toca la manita 👍 junto a tu fecha. Mientras no confirmes, te seguirán llegando recordatorios.',
    claves: 'confirmar asistencia manita pulgar rol predicacion',
    ir: { pantalla: 'MiRol', texto: 'Ir al rol' },
  },
  {
    id: 'lista',
    pregunta: '¿Cómo tomo lista?',
    respuesta: 'Abre tu clase (o tu domingo, si das Cuneros o un grupo de la tarde) y toca «Tomar lista».\n\nBusca a cada niño por su nombre. Si no aparece, agrégalo ahí mismo.',
    claves: 'asistencia ninos alumnos lista pasar registrar',
    ir: { pantalla: 'Grupos', texto: 'Ir a Clases de niños' },
  },
  {
    id: 'coritos',
    pregunta: '¿Cómo escucho los coritos?',
    respuesta: 'Entra a «Clases de niños» y toca el botón «Coritos». Toca el que quieras escuchar. Si tiene letra, toca «Letra» para verla.\n\nSolo suenan mientras tienes esa pantalla abierta.',
    claves: 'canciones musica cantos audio letra escuchar',
    ir: { pantalla: 'Coritos', texto: 'Ir a Coritos' },
  },
  {
    id: 'clasePasada',
    pregunta: 'No veo una clase que ya pasó',
    respuesta: 'Las clases que ya pasaron se ocultan para que solo veas lo que viene. Si necesitas consultar una anterior, pídesela a tu coordinador o a un administrador.',
    claves: 'desaparecio anterior pasada borrada no aparece clase',
  },
  {
    id: 'pin',
    pregunta: 'Olvidé mi usuario o mi PIN',
    respuesta: 'Pídeselo a un administrador. Él puede verlo y mandártelo por WhatsApp.',
    claves: 'contrasena clave entrar acceso olvide sesion login',
  },
  {
    id: 'tarde',
    pregunta: '¿Qué se hace en los grupos de la tarde?',
    respuesta: '• «Tarde 4 a 8» y «Tarde 9 a 12» repasan la clase de la mañana del domingo anterior y la de ese mismo domingo. No llevan material nuevo.\n• «Cuneros» y «Cuneros tarde» son para cuidar a los bebés.',
    claves: 'tarde repaso cuneros bebes grupo',
  },
  {
    id: 'oscuro',
    pregunta: '¿Cómo cambio a modo oscuro?',
    respuesta: 'Abre los ajustes (el engrane de arriba a la izquierda) y toca «Modo oscuro». Se queda guardado para la próxima vez.',
    claves: 'tema negro claro colores noche',
  },
  {
    id: 'altaUsuario',
    soloAdmin: true,
    pregunta: '¿Cómo doy de alta a un maestro?',
    respuesta: 'Ajustes → Administración → Usuarios → «Dar de alta a un usuario».\n\nDespués, en «Buscar usuarios», puedes compartirle su usuario y PIN por WhatsApp.',
    claves: 'nuevo usuario registrar maestro agregar persona alta',
    ir: { pantalla: 'Admin', params: { seccion: 'usuarios' }, texto: 'Ir a Usuarios' },
  },
  {
    id: 'subirArchivos',
    soloAdmin: true,
    pregunta: '¿Cómo subo el rol o las clases?',
    respuesta: 'Ajustes → Administración, y luego:\n• Predicaciones → «Subir o actualizar rol» (archivo CSV).\n• Clases de niños → «Subir o actualizar rol de clases» (archivo CSV).\n• Clases de niños → «Subir contenido de clases» (Word y PDF).\n\nSi corriges un rol, vuelve a subir el archivo: no hace falta borrar nada. La app solo aplica los cambios y avisa a quienes les cambió algo. El contenido de una clase también se reemplaza solo al subirla otra vez.',
    claves: 'csv archivo subir rol clases cargar excel',
    ir: { pantalla: 'Admin', texto: 'Ir a Administración' },
  },
  {
    id: 'coritoAdmin',
    soloAdmin: true,
    pregunta: '¿Cómo agrego un corito?',
    respuesta: 'Ajustes → Administración → Clases de niños → «Agregar corito». Ahí mismo, en «Editar o borrar coritos», puedes corregirlos.',
    claves: 'subir corito audio cancion mp3 agregar',
    ir: { pantalla: 'Admin', params: { seccion: 'clases' }, texto: 'Ir a Clases de niños' },
  },
];

// Palabras que no ayudan a encontrar una duda
const PALABRAS_VACIAS = ['como', 'que', 'donde', 'cuando', 'para', 'por', 'porque', 'los', 'las', 'una', 'uno', 'del', 'con', 'mis', 'tus', 'hago', 'puedo', 'quiero', 'esta', 'este', 'app', 'hay', 'sus', 'mas'];
const buscarAyuda = (texto, lista) => {
  const palabras = sinAcentos(texto)
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length >= 3 && !PALABRAS_VACIAS.includes(w));
  if (palabras.length === 0) return lista;
  return lista
    .map((p) => {
      const base = sinAcentos(`${p.pregunta} ${p.claves}`);
      return { p, puntos: palabras.filter((w) => base.includes(w)).length };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .map((x) => x.p);
};

// Ventana tipo chat: tocas una duda (o la escribes) y aparece la respuesta
const ModalAyuda = ({ visible, onCerrar, onNavegar, isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Calendario'];
  const scrollRef = useRef(null);
  const [busqueda, setBusqueda] = useState('');
  const [hechas, setHechas] = useState([]);
  const desplazar = useRef(false);
  useEffect(() => {
    if (!visible) {
      setHechas([]);
      setBusqueda('');
    }
  }, [visible]);
  const disponibles = PREGUNTAS_AYUDA.filter((p) => !p.soloAdmin || rolUsuarioActivoGlobal === 'administrador');
  const sugeridas = buscarAyuda(
    busqueda,
    disponibles.filter((p) => !hechas.includes(p.id)),
  );
  const preguntar = (p) => {
    setHechas((prev) => [...prev, p.id]);
    setBusqueda('');
    desplazar.current = true;
  };
  // Al aparecer una respuesta nueva, la ventana baja hasta esa pregunta para que se lea completa
  const alAcomodar = (id, e) => {
    if (!desplazar.current || id !== hechas[hechas.length - 1]) return;
    desplazar.current = false;
    const y = e.nativeEvent.layout.y;
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }, 30);
  };
  const burbujaBot = { alignSelf: 'flex-start', maxWidth: '88%', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 22, borderTopLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10 };
  const burbujaTu = { alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: paleta.fondo, borderRadius: 22, borderTopRightRadius: 6, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 10 };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
        <View style={{ width: '92%', maxWidth: 520, height: '82%', maxHeight: 680, backgroundColor: colors.background, borderRadius: 32, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: paleta.fondo, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="help-circle" size={20} color={paleta.texto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textMain }}>Ayuda</Text>
              <Text style={{ fontSize: 12, color: colors.textSub }}>Preguntas frecuentes</Text>
            </View>
            <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }} accessibilityLabel="Cerrar ayuda">
              <Feather name="x" size={22} color={colors.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={burbujaBot}>
              <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textMain }}>¡Hola! Toca tu duda o escríbela abajo.</Text>
            </View>
            {hechas.map((id) => {
              const p = PREGUNTAS_AYUDA.find((x) => x.id === id);
              if (!p) return null;
              return (
                <View key={id} onLayout={(e) => alAcomodar(id, e)}>
                  <View style={burbujaTu}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: paleta.texto }}>{p.pregunta}</Text>
                  </View>
                  <View style={burbujaBot}>
                    <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textMain }}>{p.respuesta}</Text>
                    {p.ir ? (
                      <TouchableOpacity
                        onPress={() => {
                          onCerrar();
                          onNavegar(p.ir.pantalla, p.ir.params);
                        }}
                        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: paleta.fondo }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: paleta.texto }}>{p.ir.texto}</Text>
                        <Feather name="arrow-right" size={14} color={paleta.texto} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
            {busqueda.trim() !== '' && sugeridas.length === 0 ? (
              <View style={burbujaBot}>
                <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textMain }}>No encontré esa duda. Prueba con otras palabras o pregúntale a un administrador.</Text>
              </View>
            ) : null}
            {sugeridas.length > 0 ? <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSub, marginTop: hechas.length ? 6 : 2, marginBottom: 8 }}>{busqueda.trim() ? 'Dudas que coinciden' : hechas.length ? 'Otras dudas' : 'Dudas frecuentes'}</Text> : null}
            {sugeridas.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => preguntar(p)} style={{ alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBg, marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.textMain }}>{p.pregunta}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
            <Feather name="search" size={18} color={colors.textSub} />
            <TextInput style={{ flex: 1, fontSize: 15, color: colors.inputText, paddingVertical: 8, outlineStyle: 'none' }} placeholder="Escribe tu duda" placeholderTextColor={colors.textSub} value={busqueda} onChangeText={setBusqueda} />
            {busqueda ? (
              <TouchableOpacity onPress={() => setBusqueda('')} style={{ padding: 4 }} accessibilityLabel="Borrar búsqueda">
                <Feather name="x-circle" size={18} color={colors.textSub} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
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
const ponerMayusculas = (t) =>
  (t || '')
    .split(' ')
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(' ');

// Devuelve un mapa { usuario en minúsculas: nombre completo } con la lista pública de usuarios
const cargarMapaNombres = async () => {
  const { data } = await supabase.rpc('nombres_publicos');
  const mapa = {};
  (data || []).forEach((m) => {
    mapa[(m.nombre_usuario || '').toLowerCase()] = m.nombre_completo || m.nombre_usuario;
  });
  return mapa;
};

// Revisa si una persona ya tiene predicación o clase de niños en una fecha.
// Devuelve un texto (por ejemplo "una clase con Niños ese día") o null si está libre.
// "ignorar" permite no contar la fecha que esa persona entregaría en un intercambio.
const buscarConflictoDia = async (usuario, fecha, ignorar = {}) => {
  if (!usuario || !fecha) return null;
  const [roles, clases] = await Promise.all([supabase.from('programa_servicios').select('id, horario').ilike('nombre_usuario', usuario).eq('fecha', fecha), supabase.from('clases_asignadas').select('id, grupo').ilike('nombre_usuario', usuario).eq('fecha', fecha)]);
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
  } catch (e) {
    console.error('No se pudieron guardar las notificaciones vistas:', e);
  }
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
    (lista || []).forEach((m) => {
      mapa[(m.nombre_usuario || '').toLowerCase()] = m.nombre_completo || m.nombre_usuario;
    });
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
      (cl || []).forEach((c) => {
        coordPorClase[c.id] = (c.coordinador || '').toLowerCase();
      });
    }
    const irTablon = (s) => ({ pantalla: 'Tablon', params: { solicitudId: s.id, ...(s.grupo_clase === 'Predicaciones' ? { soloGrupo: 'Predicaciones' } : { excluirGrupo: 'Predicaciones' }) } });
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
    // Del día 1 al 7 de cada mes se avisa lo del próximo mes (es cuando se habilita su vista)
    const avisoProximoMes = hoyD.getDate() <= 7;
    const [{ data: misClases }, { data: miRol }] = await Promise.all([supabase.from('clases_asignadas').select('id, fecha, grupo, nombre_usuario, coordinador').gte('fecha', hoy).lte('fecha', finSiguienteMes).or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`), supabase.from('programa_servicios').select('id, fecha, horario, estado_confirmacion').gte('fecha', hoy).ilike('nombre_usuario', usuarioActivoGlobal).order('fecha', { ascending: true })]);
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
    if (avisoProximoMes) {
      const claveMes = inicioSiguienteMes.slice(0, 7);
      const delMes = (misClases || []).filter((c) => c.fecha >= inicioSiguienteMes);
      const propia = delMes.find((c) => (c.nombre_usuario || '').toLowerCase() === yo);
      const deEquipo = delMes.find((c) => (c.coordinador || '').toLowerCase() === yo);
      if (propia) recordatorios.push({ clave: `rec-mes:${claveMes}:clases`, accion: false, destino: { pantalla: 'Grupos' }, mensaje: (GRUPOS_INFO[propia.grupo] || {}).cuidado ? 'Ya puedes consultar tus fechas de cuneros del próximo mes' : 'Ya puedes ir preparando tus clases del próximo mes', detalle: `Consulta los temas en la app • ${propia.grupo}` });
      if (deEquipo) recordatorios.push({ clave: `rec-mes:${claveMes}:equipo`, accion: false, destino: { pantalla: 'Grupos' }, mensaje: 'Ya puedes revisar los grupos que coordinas el próximo mes', detalle: 'Recordatorio • Coordinas' });
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
    // ---- CENA DEL SEÑOR: invitación por responder (con botones), asignación y lugares que faltan ----
    const { data: turnosCena } = await supabase.from('cena_turnos').select('id, fecha, posicion, nombre_usuario, estado, asignado_por').gte('fecha', hoy).in('estado', ['invitado', 'confirmado']);
    (turnosCena || [])
      .filter((t) => (t.nombre_usuario || '').toLowerCase() === yo)
      .forEach((t) => {
        if (t.estado === 'invitado') items.unshift({ clave: `cena-inv:${t.id}`, accion: true, cenaTurno: t.id, destino: { pantalla: 'Cena' }, mensaje: 'Confirma tu apoyo para la Cena del Señor', detalle: `${fechaLargaCena(t.fecha)} • ${t.posicion === 0 ? 'Presidir' : 'Servir la mesa'}` });
        else if (t.asignado_por) items.unshift({ clave: `cena-asig:${t.id}`, accion: false, destino: { pantalla: 'Cena' }, mensaje: 'Fuiste asignado para la Cena del Señor', detalle: `${fechaLargaCena(t.fecha)} • ${t.posicion === 0 ? 'Presides' : `Posición ${t.posicion}`}` });
      });
    const ahoraCena = new Date();
    if (rolUsuarioActivoGlobal === 'administrador' && ((ahoraCena.getDay() === 6 && ahoraCena.getHours() >= 12) || ahoraCena.getDay() === 0)) {
      const domingoCena = proximoDomingo();
      const faltan = 7 - new Set((turnosCena || []).filter((t) => t.fecha === domingoCena && t.estado === 'confirmado').map((t) => t.posicion)).size;
      if (faltan > 0) items.unshift({ clave: `cena-faltan:${domingoCena}:${faltan}`, accion: true, destino: { pantalla: 'Cena' }, mensaje: `Faltan ${faltan} lugar(es) para la Cena del Señor`, detalle: 'Toca para asignarlos' });
    }
  } catch (e) {
    console.error('Error leyendo notificaciones:', e);
  }
  let vistas = [];
  try {
    vistas = JSON.parse((await AsyncStorage.getItem(claveVistas())) || '[]');
  } catch (e) {}
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
    if (visible) {
      setPaso('inicio');
      setTexto('');
      setDestino(null);
      setFechasDestino([]);
      setAviso('');
    }
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

  const resultados = texto.length > 0 ? maestrosElegibles.filter((m) => m.nombre_usuario.toLowerCase() !== usuarioPropio.toLowerCase() && (m.nombre_completo || m.nombre_usuario).toLowerCase().includes(texto.toLowerCase())) : [];

  const elegirIntercambio = async () => {
    setCargandoFechas(true);
    setPaso('fecha');
    const hoy = fechaISO(new Date());
    const { data } = await supabase
      .from(tipoItem === 'clase' ? 'clases_asignadas' : 'programa_servicios')
      .select('*')
      .ilike('nombre_usuario', destino.nombre_usuario)
      .gte('fecha', hoy)
      .order('fecha', { ascending: true });
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
                  <TouchableOpacity
                    key={m.nombre_usuario}
                    onPress={() => {
                      setDestino(m);
                      setPaso('tipo');
                    }}
                    style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
                  >
                    <Text style={{ color: colors.textMain, fontSize: 14 }}>{m.nombre_completo || m.nombre_usuario}</Text>
                  </TouchableOpacity>
                ))}
                {texto.length > 0 && resultados.length === 0 && <Text style={{ color: colors.textSub, fontSize: 13, paddingVertical: 10 }}>Nadie elegible coincide con ese nombre.</Text>}
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
                      <Text style={{ color: colors.textMain, fontSize: 14 }}>
                        {formatearFechaCorta(f.fecha)} • {tipoItem === 'clase' ? f.grupo : f.horario}
                      </Text>
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
// Ícono de la Cena del Señor: pan y copa (dibujado, porque no existe en la librería de íconos)
const IconoCena = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 20.2C1.6 16.4 3.3 7.6 7.6 4.1C9.8 2.3 12 3 11.6 7C11.1 12 8.9 17.6 6.4 20.4C5.5 21.4 4.2 21.3 3.6 20.2Z" />
    <Path d="M5.3 9.6C6.6 8.9 8 8.7 9.6 8.9" />
    <Path d="M4.4 14.4C5.7 13.7 7 13.5 8.6 13.7" />
    <Path d="M13.6 3.2H21.4C22.1 6.6 21.6 10.4 17.5 11.6C13.4 10.4 12.9 6.6 13.6 3.2Z" />
    <Path d="M13.4 6.6H21.6" />
    <Path d="M17.5 11.6V20.4" />
    <Path d="M14.4 20.8H20.6" />
  </Svg>
);

// Palomita de trazo (como hecha a mano) para marcar a quien ya confirmó
const IconoCheck = ({ size = 22, color = '#6FA884' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M2.6 13.3C3.3 12.4 4.5 12.3 5.3 13.1L9.2 17.2C12.4 12.8 16.3 8.9 20.7 5.8C21.6 5.2 22.6 6.3 21.9 7.1C17.9 11.1 14.2 15.4 11 20C10.4 20.9 9.1 21 8.4 20.2L2.9 14.6C2.6 14.2 2.4 13.7 2.6 13.3Z" />
  </Svg>
);

// ---- VISOR DE PDF: muestra las páginas dentro de la app (igual en iPhone, Android y PC) ----
// Usa pdf.js, que se carga una sola vez desde internet la primera vez que se abre un PDF
const cargarPdfJs = (() => {
  let promesa = null;
  return () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.reject(new Error('Sin navegador'));
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!promesa) {
      promesa = new Promise((resolver, rechazar) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolver(window.pdfjsLib);
        };
        s.onerror = () => {
          promesa = null;
          rechazar(new Error('No se pudo cargar el visor'));
        };
        document.head.appendChild(s);
      });
    }
    return promesa;
  };
})();
// Enlace que fuerza la descarga del archivo (Supabase lo entiende con «download»)
const enlaceDescarga = (url) => `${url}${url.includes('?') ? '&' : '?'}download=`;

const VisorPDF = ({ url, titulo, onCerrar, isDark, categoria }) => {
  const colors = getColors(isDark);
  const marco = useRef(null);
  const contenedor = useRef(null);
  const documentoRef = useRef(null);
  const anchoBase = useRef(340);
  const zoomRef = useRef(1);
  const turnoDibujo = useRef(0);
  const espera = useRef(null);
  const aplicarZoomRef = useRef(null);
  const [estado, setEstado] = useState('cargando');
  const [zoom, setZoom] = useState(1);

  // Dibuja todas las páginas con la nitidez que pide el zoom actual
  const dibujar = async (alTerminarPrimera) => {
    const documento = documentoRef.current;
    const caja = contenedor.current;
    if (!documento || !caja) return;
    const turno = ++turnoDibujo.current;
    const z = zoomRef.current;
    const ratio = window.devicePixelRatio || 1;
    for (let n = 1; n <= documento.numPages; n++) {
      const pagina = await documento.getPage(n);
      if (turno !== turnoDibujo.current) return;
      const base = pagina.getViewport({ scale: 1 });
      const escalaCss = anchoBase.current / base.width;
      const alto = base.height * escalaCss;
      const nitidez = Math.min(ratio * z, 2400 / anchoBase.current);
      const vista = pagina.getViewport({ scale: escalaCss * nitidez });
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.floor(vista.width);
      lienzo.height = Math.floor(vista.height);
      lienzo.dataset.alto = String(alto);
      await pagina.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise;
      if (turno !== turnoDibujo.current) return;
      const zActual = zoomRef.current;
      Object.assign(lienzo.style, { width: `${anchoBase.current * zActual}px`, height: `${alto * zActual}px`, display: 'block', margin: '0 auto 12px', borderRadius: '10px', background: '#FFFFFF', flexShrink: '0' });
      const anterior = caja.children[n - 1];
      if (anterior) caja.replaceChild(lienzo, anterior);
      else caja.appendChild(lienzo);
      if (n === 1 && alTerminarPrimera) alTerminarPrimera();
    }
  };

  // Cambia el zoom (entre 100% y 400%) manteniendo en su lugar el punto que se está ampliando
  const aplicarZoom = (valor, cx, cy) => {
    const nuevo = Math.round(Math.min(4, Math.max(1, valor)) * 100) / 100;
    const anterior = zoomRef.current;
    const m = marco.current;
    const caja = contenedor.current;
    if (nuevo === anterior || !m || !caja) return;
    const x = cx === undefined ? m.clientWidth / 2 : cx;
    const y = cy === undefined ? m.clientHeight / 2 : cy;
    Array.from(caja.children).forEach((lienzo) => {
      lienzo.style.width = `${anchoBase.current * nuevo}px`;
      lienzo.style.height = `${Number(lienzo.dataset.alto) * nuevo}px`;
    });
    m.scrollLeft = ((m.scrollLeft + x) * nuevo) / anterior - x;
    m.scrollTop = ((m.scrollTop + y) * nuevo) / anterior - y;
    zoomRef.current = nuevo;
    setZoom(nuevo);
    clearTimeout(espera.current);
    espera.current = setTimeout(() => dibujar(), 300);
  };
  aplicarZoomRef.current = aplicarZoom;

  // Pellizcar con dos dedos (celular y tablet) o Ctrl + rueda del ratón / pellizco en el touchpad (PC)
  const conectarGestos = (el) => {
    let inicio = null;
    const distancia = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const centro = (t) => {
      const r = el.getBoundingClientRect();
      return [(t[0].clientX + t[1].clientX) / 2 - r.left, (t[0].clientY + t[1].clientY) / 2 - r.top];
    };
    el.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) inicio = { d: distancia(e.touches) || 1, z: zoomRef.current };
      },
      { passive: true },
    );
    el.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length !== 2 || !inicio) return;
        e.preventDefault();
        const [x, y] = centro(e.touches);
        aplicarZoomRef.current((inicio.z * distancia(e.touches)) / inicio.d, x, y);
      },
      { passive: false },
    );
    el.addEventListener(
      'touchend',
      (e) => {
        if (e.touches.length < 2) inicio = null;
      },
      { passive: true },
    );
    el.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        aplicarZoomRef.current(zoomRef.current * Math.exp(-e.deltaY / 200), e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false },
    );
  };
  const refMarco = (el) => {
    if (el && el !== marco.current) conectarGestos(el);
    marco.current = el;
  };

  useEffect(() => {
    if (!url) return undefined;
    let cancelado = false;
    setEstado('cargando');
    zoomRef.current = 1;
    setZoom(1);
    documentoRef.current = null;
    (async () => {
      try {
        const pdfjs = await cargarPdfJs();
        const documento = await pdfjs.getDocument(url).promise;
        // Espera a que la ventana termine de abrir
        for (let i = 0; i < 40 && !contenedor.current; i++) await new Promise((r) => setTimeout(r, 50));
        const caja = contenedor.current;
        if (cancelado || !caja) return;
        while (caja.firstChild) caja.removeChild(caja.firstChild);
        anchoBase.current = Math.min(caja.clientWidth || 340, 860);
        documentoRef.current = documento;
        await dibujar(() => {
          if (!cancelado) setEstado('listo');
        });
      } catch (e) {
        if (!cancelado) setEstado('error');
      }
    })();
    return () => {
      cancelado = true;
      turnoDibujo.current++;
      clearTimeout(espera.current);
    };
  }, [url]);

  const botonZoom = { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' };
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <View style={{ width: '100%', maxWidth: 900, height: '92%', backgroundColor: colors.background, borderRadius: 28, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.textMain }} numberOfLines={1}>
              {titulo}
            </Text>
            {url ? <BotonChico icono="download" texto="Descargar" categoria={categoria} isDark={isDark} onPress={() => Linking.openURL(enlaceDescarga(url))} /> : null}
            <TouchableOpacity onPress={onCerrar} accessibilityLabel="Cerrar" style={{ padding: 6 }}>
              <Feather name="x" size={24} color={colors.textSub} />
            </TouchableOpacity>
          </View>
          <View ref={refMarco} style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {estado === 'cargando' ? <ActivityIndicator color={colors.textSub} style={{ marginTop: 30 }} /> : null}
            {estado === 'error' ? <Text style={{ color: colors.textSub, textAlign: 'center', marginTop: 30, paddingHorizontal: 20 }}>No se pudo mostrar la vista previa. Puedes descargar el archivo con el botón de arriba.</Text> : null}
            <View ref={contenedor} style={{ width: '100%', flexShrink: 0 }} />
          </View>
          {estado === 'listo' ? (
            <View style={{ position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 999, padding: 4, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10 }}>
              <TouchableOpacity onPress={() => aplicarZoom(zoom / 1.25)} accessibilityLabel="Alejar" style={[botonZoom, { opacity: zoom <= 1 ? 0.35 : 1 }]}>
                <Feather name="minus" size={20} color={colors.textMain} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => aplicarZoom(1)} accessibilityLabel="Tamaño original" style={{ minWidth: 52, alignItems: 'center' }}>
                <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 13 }}>{Math.round(zoom * 100)}%</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => aplicarZoom(zoom * 1.25)} accessibilityLabel="Acercar" style={[botonZoom, { opacity: zoom >= 4 ? 0.35 : 1 }]}>
                <Feather name="plus" size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const TarjetaMenu = ({ icono, titulo, subtitulo, detalle, categoria, pronto, etiqueta, isDark, columnas, esUltima, total, onPress }) => {
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro'][categoria];
  const m = columnas === 3 ? { alto: 236, radio: 54, circulo: 54, icono: 26, texto: 25, vertical: 24, lateral: 30, pill: 12 } : columnas === 2 ? { alto: 260, radio: 58, circulo: 60, icono: 28, texto: 28, vertical: 26, lateral: 32, pill: 13 } : { alto: 120, radio: 46, circulo: 44, icono: 22, texto: 19, vertical: 16, lateral: 20, pill: 11 };

  // La última tarjeta ocupa el espacio que queda libre en su fila
  let ancho = columnas === 3 ? '31.9%' : columnas === 2 ? '48.5%' : '100%';
  const resto = total % columnas;
  if (esUltima && columnas >= 2 && resto !== 0) {
    ancho = columnas - resto + 1 === columnas ? '100%' : '65.9%';
  }

  const circuloClaro = isDark ? 'rgba(255,255,255,0.50)' : '#FFFFFF';
  const pastillaFondo = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.62)';

  return (
    <TouchableOpacity activeOpacity={0.85} accessibilityLabel={titulo} onPress={onPress} style={{ width: ancho, minHeight: m.alto, borderRadius: m.radio, backgroundColor: paleta.fondo, overflow: 'hidden', paddingVertical: m.vertical, paddingHorizontal: m.lateral, justifyContent: 'space-between' }}>
      <View style={{ pointerEvents: 'none', position: 'absolute', right: -m.alto * 0.275, top: -m.alto * 0.35, width: m.alto * 1.25, height: m.alto * 1.25, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.30)' }} />
      <View style={{ pointerEvents: 'none', position: 'absolute', right: m.alto * 0.55, bottom: -m.alto * 0.425, width: m.alto * 0.85, height: m.alto * 0.85, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)' }} />
      <View style={{ width: m.circulo, height: m.circulo, borderRadius: m.circulo / 2, backgroundColor: circuloClaro, alignItems: 'center', justifyContent: 'center' }}>{icono === 'cena' ? <IconoCena size={m.icono} color={paleta.texto} /> : <Feather name={icono} size={m.icono} color={paleta.texto} />}</View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: m.texto, fontWeight: '700', letterSpacing: -0.2, color: paleta.texto }}>{titulo}</Text>
          {subtitulo ? <Text style={{ fontSize: Math.round(m.texto * 0.68), fontWeight: '500', marginTop: 2, color: paleta.texto }}>{subtitulo}</Text> : null}
          {detalle ? <Text style={{ fontSize: Math.round(m.texto * 0.62), fontWeight: '600', marginTop: 5, color: paleta.texto }}>{detalle}</Text> : null}
        </View>
        {(pronto || etiqueta) && (
          <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: pastillaFondo }}>
            <Text style={{ fontSize: m.pill, fontWeight: '700', color: paleta.texto }}>{etiqueta || 'Pronto'}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Botón pequeño en forma de pastilla, con el mismo estilo que «Tomar lista».
// Sin onPress se muestra como etiqueta (por ejemplo, el nombre del coordinador).
const BotonChico = ({ icono, texto, onPress, categoria, isDark, neutro, peligro }) => {
  const colors = getColors(isDark);
  const tonos = PALETA_MENU[isDark ? 'oscuro' : 'claro'];
  const p = peligro ? (isDark ? { fondo: '#D9A3A3', texto: '#4A1515' } : { fondo: '#F2CFCF', texto: '#7A2E2E' }) : tonos[categoria] || tonos['Clases de niños'];
  const color = neutro ? colors.textSub : p.texto;
  const Contenedor = onPress ? TouchableOpacity : View;
  return (
    <Contenedor onPress={onPress} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: neutro ? colors.cardBg : p.fondo, borderWidth: neutro ? 1 : 0, borderColor: colors.cardBorder }}>
      <Feather name={icono} size={18} color={color} />
      <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{texto}</Text>
    </Contenedor>
  );
};

// Tarjeta para listas (temario y clases): mismo estilo redondeado que las del menú
const TarjetaLista = ({ icono, numero, titulo, subtitulo, detalle, asignado, etiqueta, categoria, isDark, ancho, onPress }) => {
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro'][categoria] || PALETA_MENU[isDark ? 'oscuro' : 'claro']['Niños'];
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ width: ancho || '100%', borderRadius: 38, backgroundColor: paleta.fondo, overflow: 'hidden', paddingVertical: 18, paddingHorizontal: 22, marginBottom: 14 }}>
      <View style={{ pointerEvents: 'none', position: 'absolute', right: -50, top: -60, width: 160, height: 160, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.30)' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: isDark ? 'rgba(255,255,255,0.50)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    {numero ? <Text style={{ fontSize: 20, fontWeight: '800', color: paleta.texto }}>{numero}</Text> : <Feather name={icono} size={22} color={paleta.texto} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.2, color: paleta.texto }}>{titulo}</Text>
                    {subtitulo || etiqueta ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 3 }}>
              {subtitulo ? <Text style={{ fontSize: 13, fontWeight: '500', color: paleta.texto }}>{subtitulo}</Text> : null}
              {etiqueta ? (
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.70)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: paleta.texto }}>{etiqueta}</Text>
                </View>
              ) : null}
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
// Categorías del panel de administración (cada una abre su propia pantalla)
const SECCIONES_ADMIN = {
  usuarios: { titulo: 'Usuarios', subtitulo: 'Altas, cambios y administradores', categoria: 'Usuarios', icono: 'users' },
  predicaciones: { titulo: 'Predicaciones', subtitulo: 'Subir y corregir el rol', categoria: 'Predicaciones', icono: 'calendar' },
  clases: { titulo: 'Clases de niños', subtitulo: 'Clases, asistencia y coritos', categoria: 'Clases de niños', icono: 'smile' },
};

// Opción plegable del panel de administración: se abre al tocarla y se cierra al tocarla otra vez
const OpcionAdmin = ({ id, titulo, subtitulo, icono, abierta, onAlternar, categoria, isDark, children }) => {
  const colors = getColors(isDark);
  const p = PALETA_MENU[isDark ? 'oscuro' : 'claro'][categoria];
  return (
    <View style={{ backgroundColor: abierta ? p.fondo + (isDark ? '26' : '40') : colors.cardBg, borderWidth: 1.5, borderColor: abierta ? p.fondo : colors.cardBorder, borderRadius: 28, marginBottom: 12, overflow: 'hidden' }}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onAlternar(id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: p.fondo, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icono} size={19} color={p.texto} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain }}>{titulo}</Text>
          {subtitulo ? <Text style={{ fontSize: 12.5, color: colors.textSub, marginTop: 2 }}>{subtitulo}</Text> : null}
        </View>
        <Feather name={abierta ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSub} />
      </TouchableOpacity>
      {abierta ? <View style={{ paddingHorizontal: 18, paddingBottom: 18, paddingTop: 4 }}>{children}</View> : null}
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
const urlCorito = (archivo) => supabase.storage.from('coritos').getPublicUrl(archivo).data.publicUrl;
const sinAcentos = (t) =>
  (t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const formatoTiempo = (s) => {
  const n = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
};

// Reproduce un corito a la vez y se detiene solo al salir de la pantalla
const useReproductor = () => {
  const audioRef = useRef(null);
  const listaRef = useRef([]);
  const actualRef = useRef(null);
  const [actual, setActual] = useState(null);
  const [sonando, setSonando] = useState(false);
  const [tiempo, setTiempo] = useState({ pos: 0, dur: 0 });
  const detener = () => {
    if (audioRef.current) audioRef.current.pause();
    setSonando(false);
  };
  useFocusEffect(React.useCallback(() => () => detener(), []));
  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    },
    [],
  );
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
      if (a.paused) a.play().catch(() => {});
      else a.pause();
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
    if (siguiente) tocar(siguiente);
    else detener();
  };
  const buscar = (proporcion) => {
    const a = audioRef.current;
    if (a && isFinite(a.duration)) a.currentTime = Math.min(Math.max(proporcion, 0), 1) * a.duration;
  };
  const quitarSiEs = (corito) => {
    if (actualRef.current && corito && actualRef.current.id === corito.id) {
      detener();
      actualRef.current = null;
      setActual(null);
    }
  };
  return { actual, sonando, tiempo, tocar, pasar, buscar, quitarSiEs };
};

// Un corito en la lista: tocar para escuchar y, si tiene, ver la letra
const FilaCorito = ({ corito, rep, lista, onLetra, isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const activo = rep.actual && rep.actual.id === corito.id;
  const resalte = isDark ? paleta.fondo : paleta.texto;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => rep.tocar(corito, lista)} accessibilityLabel={`Escuchar ${corito.titulo}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: activo ? paleta.fondo + (isDark ? '40' : '66') : colors.cardBg, borderWidth: 1, borderColor: activo ? paleta.fondo : colors.cardBorder, borderRadius: 20, paddingVertical: 10, paddingLeft: 10, paddingRight: 14, marginBottom: 8 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: paleta.fondo, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={activo && rep.sonando ? 'volume-2' : 'music'} size={18} color={paleta.texto} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.textMain }} numberOfLines={2}>
        {corito.titulo}
      </Text>
      {corito.letra ? (
        <TouchableOpacity onPress={() => onLetra(corito)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: activo ? resalte : colors.cardBorder }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: activo ? resalte : colors.textSub }}>Letra</Text>
        </TouchableOpacity>
      ) : null}
      <Feather name={activo && rep.sonando ? 'pause' : 'play'} size={18} color={activo ? resalte : colors.textSub} />
    </TouchableOpacity>
  );
};

// Reproductor de abajo: sin nada sonando muestra «Reproducir todo»; sonando, el mini reproductor
const BarraReproductor = ({ rep, isDark, lista, onLetra }) => {
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const [anchoBarra, setAnchoBarra] = useState(1);
  if (!rep.actual) {
    if (!lista || lista.length === 0) return null;
    return (
      <TouchableOpacity onPress={() => rep.tocar(lista[0], lista)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: paleta.fondo, borderRadius: 999, paddingVertical: 14 }}>
        <Feather name="play" size={18} color={paleta.texto} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: paleta.texto }}>Reproducir todo</Text>
      </TouchableOpacity>
    );
  }
  const avance = rep.tiempo.dur > 0 ? rep.tiempo.pos / rep.tiempo.dur : 0;
  return (
    <View style={{ backgroundColor: paleta.fondo, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Feather name="music" size={18} color={paleta.texto} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: paleta.texto }} numberOfLines={1}>
          {rep.actual.titulo}
        </Text>
        {rep.actual.letra && onLetra ? (
          <TouchableOpacity onPress={() => onLetra(rep.actual)} style={{ padding: 6 }} accessibilityLabel="Ver letra">
            <Feather name="file-text" size={18} color={paleta.texto} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => rep.pasar(-1)} style={{ padding: 6 }} accessibilityLabel="Anterior">
          <Feather name="skip-back" size={18} color={paleta.texto} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => rep.tocar(rep.actual)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={rep.sonando ? 'Pausa' : 'Reproducir'}>
          <Feather name={rep.sonando ? 'pause' : 'play'} size={18} color={paleta.texto} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => rep.pasar(1)} style={{ padding: 6 }} accessibilityLabel="Siguiente">
          <Feather name="skip-forward" size={18} color={paleta.texto} />
        </TouchableOpacity>
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
            <Text style={[styles.title, { color: colors.textMain, flex: 1 }]} numberOfLines={2}>
              {corito ? corito.titulo : ''}
            </Text>
            <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }}>
              <Feather name="x" size={22} color={colors.textSub} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textMain }}>{corito ? corito.letra : ''}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Formulario para agregar un corito nuevo o corregir uno que ya existe (solo administradores)
const FormCorito = ({ corito, onGuardado, isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const inputRef = useRef(null);
  const editando = !!corito;
  const [titulo, setTitulo] = useState(corito ? corito.titulo : '');
  const [letra, setLetra] = useState(corito ? corito.letra || '' : '');
  const [grupos, setGrupos] = useState(corito ? corito.grupos || [] : []);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const guardar = async () => {
    if (!titulo.trim()) return setMensaje('Escribe el título del corito.');
    if (!editando && !archivo) return setMensaje('Elige el archivo de audio.');
    if (archivo && archivo.size > 15 * 1024 * 1024) return setMensaje('El audio pesa más de 15 MB. Comprímelo antes de subirlo (MP3 a 64 o 96 kbps).');
    setGuardando(true);
    let ruta = editando ? corito.archivo : null;
    if (archivo) {
      setMensaje('Subiendo audio…');
      const extension = ((archivo.name || '').split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
      ruta = `${Date.now()}_${
        sinAcentos(titulo)
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 40) || 'corito'
      }.${extension}`;
      const { error: errorSubida } = await supabase.storage.from('coritos').upload(ruta, archivo, { contentType: archivo.type || 'audio/mpeg', upsert: false });
      if (errorSubida) {
        setGuardando(false);
        return setMensaje('No se pudo subir el audio: ' + errorSubida.message);
      }
    }
    const datos = { titulo: titulo.trim(), letra: letra.trim() || null, grupos, archivo: ruta };
    const { error } = editando ? await supabase.from('coritos').update(datos).eq('id', corito.id) : await supabase.from('coritos').insert([datos]);
    if (error) {
      if (archivo) await supabase.storage.from('coritos').remove([ruta]);
      setGuardando(false);
      return setMensaje('No se pudo guardar: ' + error.message);
    }
    // Si se cambió el audio, se borra el anterior para no ocupar espacio
    if (editando && archivo && corito.archivo) await supabase.storage.from('coritos').remove([corito.archivo]);
    setGuardando(false);
    setMensaje('');
    if (!editando) {
      setTitulo('');
      setLetra('');
      setGrupos([]);
      setArchivo(null);
    }
    if (onGuardado) onGuardado();
  };
  const estiloInput = { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 10 };
  return (
    <View>
      <TextInput style={[styles.input, estiloInput]} placeholder="Título del corito" placeholderTextColor={colors.textSub} value={titulo} onChangeText={setTitulo} />
      <TextInput style={[styles.input, estiloInput, { minHeight: 120, textAlignVertical: 'top' }]} placeholder="Letra (opcional)" placeholderTextColor={colors.textSub} value={letra} onChangeText={setLetra} multiline />
      {Platform.OS === 'web' ? (
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            setArchivo(e.target.files[0] || null);
            e.target.value = '';
          }}
        />
      ) : null}
      <TouchableOpacity onPress={() => inputRef.current && inputRef.current.click()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textSub, backgroundColor: colors.cardBg, marginBottom: 10 }}>
        <Feather name="music" size={20} color={colors.textSub} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{archivo ? archivo.name : editando ? 'Cambiar audio (opcional)' : 'Elegir audio'}</Text>
          <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 2 }}>{archivo ? `${(archivo.size / 1024 / 1024).toFixed(1)} MB • toca para cambiarlo` : editando ? 'Si no eliges otro, se queda el audio actual' : 'MP3 recomendado, de preferencia menos de 2 MB'}</Text>
        </View>
      </TouchableOpacity>
      {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 6 }}>{mensaje}</Text> : null}
      <TouchableOpacity onPress={guardar} disabled={guardando} style={[styles.primaryButton, { backgroundColor: isDark ? paleta.fondo : paleta.texto, opacity: guardando ? 0.6 : 1 }]}>
        {guardando ? <ActivityIndicator color={isDark ? paleta.texto : '#FFFFFF'} /> : <Text style={[styles.primaryButtonText, { color: isDark ? paleta.texto : '#FFFFFF' }]}>{editando ? 'Guardar cambios' : 'Guardar corito'}</Text>}
      </TouchableOpacity>
    </View>
  );
};

// Lista de coritos para el administrador: buscar, corregir o borrar
const ListaCoritosAdmin = ({ isDark }) => {
  const colors = getColors(isDark);
  const [coritos, setCoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });
  const cargar = async () => {
    const { data } = await supabase.from('coritos').select('*').order('titulo', { ascending: true });
    setCoritos(data || []);
    setCargando(false);
  };
  useEffect(() => {
    cargar();
  }, []);
  const visibles = coritos.filter((c) => sinAcentos(c.titulo).includes(sinAcentos(busqueda)));
  const borrar = (c) =>
    setAlerta({
      visible: true,
      titulo: 'Borrar corito',
      mensaje: `¿Borrar "${c.titulo}"? También se quitará de las clases donde esté.`,
      textoConfirmar: 'Sí, borrar',
      onCancelar: cerrarAlerta,
      isDark,
      onConfirmar: async () => {
        cerrarAlerta();
        const { error } = await supabase.from('coritos').delete().eq('id', c.id);
        if (!error) await supabase.storage.from('coritos').remove([c.archivo]);
        cargar();
      },
    });
  return (
    <View>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 12 }]} placeholder="Buscar corito" placeholderTextColor={colors.textSub} value={busqueda} onChangeText={setBusqueda} />
      {cargando ? (
        <ActivityIndicator color={colors.textSub} />
      ) : visibles.length === 0 ? (
        <Text style={{ color: colors.textSub, fontSize: 14 }}>{coritos.length === 0 ? 'Todavía no hay coritos.' : 'Sin resultados.'}</Text>
      ) : (
        visibles.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 20, paddingVertical: 10, paddingLeft: 16, paddingRight: 10, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textMain }} numberOfLines={2}>
                {c.titulo}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>{c.letra ? 'Con letra' : 'Sin letra'}</Text>
            </View>
            <TouchableOpacity style={styles.actionBtnGray} onPress={() => setEditando(c)} accessibilityLabel="Editar corito">
              <Feather name="edit-2" size={18} color={colors.textSub} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnRed} onPress={() => borrar(c)} accessibilityLabel="Borrar corito">
              <Feather name="trash-2" size={18} color="#FFB7A1" />
            </TouchableOpacity>
          </View>
        ))
      )}
      <Modal visible={!!editando} transparent animationType="fade" onRequestClose={() => setEditando(null)}>
        <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 40 }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.cardBorder, maxHeight: '90%', width: '90%', maxWidth: 520 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[styles.title, { color: colors.textMain }]}>Editar corito</Text>
              <TouchableOpacity onPress={() => setEditando(null)} style={{ padding: 6 }}>
                <Feather name="x" size={22} color={colors.textSub} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {editando ? (
                <FormCorito
                  key={editando.id}
                  corito={editando}
                  isDark={isDark}
                  onGuardado={() => {
                    setEditando(null);
                    cargar();
                  }}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <AlertaPersonalizada {...alerta} />
    </View>
  );
};

// ---- CONTENIDO DE CLASES: se sube el Word (contenido) y el PDF (actividad para imprimir) ----
// Nombre de los archivos: clase_mes_año_grupo y una letra. Ej. 1_01_27_4_6C.docx (contenido) y 1_01_27_4_6A.pdf (actividad)
const CODIGOS_GRUPO = { '4_6': 'Niños', '7_9': 'Pre adolescentes', '10_12': 'Adolescentes' };
// Títulos que trae el Word, en el orden de la clase
const SECCIONES_CLASE = [
  { clave: 'objetivo', titulo: 'Objetivo para el maestro', patron: /^objetivo/ },
  { clave: 'puntos', titulo: 'Puntos clave', patron: /^puntos clave/ },
  { clave: 'palabras', titulo: 'Palabras para explicar', patron: /^palabras para explicar/ },
  { clave: 'oracion', titulo: 'Oración de inicio y cantos', patron: /^oracion de inicio/ },
  { clave: 'rompehielos', titulo: 'Bienvenida y rompehielos', patron: /^bienvenida/ },
  { clave: 'introduccion', titulo: 'Introducción', patron: /^introduccion/ },
  { clave: 'historia', titulo: 'Historia bíblica', patron: /^historia biblica/ },
  { clave: 'resaltar', titulo: 'Puntos a resaltar', patron: /^puntos a resaltar/ },
  { clave: 'ofrenda', titulo: 'Espacio para ofrendar', patron: /^espacio para ofrendar/ },
  { clave: 'actividades', titulo: 'Versículo y actividades', patron: /^versiculo y actividades/ },
  { clave: 'cierre', titulo: 'Cierre y oración final', patron: /^cierre/ },
];

// Un .docx es un .zip: aquí se abre con lo que ya trae el navegador, sin instalar nada
const leerZip = async (buffer) => {
  const datos = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decodificar = new TextDecoder();
  let fin = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (datos.getUint32(i, true) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) throw new Error('El archivo no parece un Word (.docx).');
  const total = datos.getUint16(fin + 10, true);
  let p = datos.getUint32(fin + 16, true);
  const archivos = {};
  for (let n = 0; n < total && datos.getUint32(p, true) === 0x02014b50; n++) {
    const largoNombre = datos.getUint16(p + 28, true);
    const nombre = decodificar.decode(bytes.subarray(p + 46, p + 46 + largoNombre));
    archivos[nombre] = { metodo: datos.getUint16(p + 10, true), tamano: datos.getUint32(p + 20, true), inicio: datos.getUint32(p + 42, true) };
    p += 46 + largoNombre + datos.getUint16(p + 30, true) + datos.getUint16(p + 32, true);
  }
  const leer = async (nombre, binario) => {
    const a = archivos[nombre];
    if (!a) return null;
    const desde = a.inicio + 30 + datos.getUint16(a.inicio + 26, true) + datos.getUint16(a.inicio + 28, true);
    const crudo = bytes.subarray(desde, desde + a.tamano);
    let respuesta;
    if (a.metodo === 0) respuesta = new Response(crudo);
    else {
      if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede leer archivos Word. Usa Chrome o Safari actualizados.');
      respuesta = new Response(new Blob([crudo]).stream().pipeThrough(new DecompressionStream('deflate-raw')));
    }
    return binario ? await respuesta.blob() : await respuesta.text();
  };
  return { nombres: Object.keys(archivos), leer };
};

// Saca los párrafos del Word: su texto y si son viñetas (y de qué nivel). Las tablas solo traen fotos y se omiten.
const parrafosDelWord = (xml) => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parrafos = [];
  const DENTRO = ['w:pPr', 'w:numPr', 'w:r', 'w:hyperlink', 'w:smartTag', 'w:ins', 'w:sdt', 'w:sdtContent', 'w:fldSimple'];
  const leerParrafo = (p) => {
    const info = { texto: '', lista: false, nivel: 0 };
    const visitar = (n) => {
      Array.from(n.childNodes || []).forEach((h) => {
        if (h.nodeName === 'w:t') info.texto += h.textContent;
        else if (h.nodeName === 'w:tab') info.texto += ' ';
        else if (h.nodeName === 'w:br' || h.nodeName === 'w:cr') info.texto += '\n';
        else if (h.nodeName === 'w:numPr') {
          info.lista = true;
          visitar(h);
        } else if (h.nodeName === 'w:ilvl') info.nivel = parseInt(h.getAttribute('w:val') || '0', 10) || 0;
        else if (DENTRO.includes(h.nodeName)) visitar(h);
      });
    };
    visitar(p);
    info.texto = info.texto
      .replace(/[ \u00a0]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .trim();
    return info;
  };
  const fotosDe = (nodo) =>
    Array.from(nodo.getElementsByTagName('a:blip'))
      .map((b) => b.getAttribute('r:embed'))
      .filter(Boolean);
  const recorrer = (nodo) => {
    Array.from(nodo.childNodes || []).forEach((h) => {
      if (h.nodeName === 'w:p') {
        const info = leerParrafo(h);
        if (info.texto) parrafos.push(info);
        fotosDe(h).forEach((id) => parrafos.push({ foto: id }));
      } else if (h.nodeName === 'w:tbl') fotosDe(h).forEach((id) => parrafos.push({ foto: id }));
      else if (h.childNodes && h.childNodes.length) recorrer(h);
    });
  };
  recorrer(doc.documentElement);
  return parrafos;
};

// Convierte el Word en los datos de la clase: título, texto base y cada sección con su tiempo
const leerClaseDelWord = async (archivo) => {
  const zip = await leerZip(await archivo.arrayBuffer());
  const cuerpo = await zip.leer('word/document.xml');
  if (!cuerpo) throw new Error('El archivo no parece un Word (.docx).');
  const destinos = {};
  const rels = await zip.leer('word/_rels/document.xml.rels');
  if (rels)
    Array.from(new DOMParser().parseFromString(rels, 'application/xml').getElementsByTagName('Relationship')).forEach((r) => {
      destinos[r.getAttribute('Id')] = 'word/' + (r.getAttribute('Target') || '').replace(/^\.?\//, '');
    });
  const encabezado = [];
  for (const nombre of zip.nombres.filter((n) => /^word\/header\d*\.xml$/.test(n)).sort()) encabezado.push(...parrafosDelWord(await zip.leer(nombre)));
  // Encabezado: "Domingo 1 (3 de enero): La Creación" y "Texto base: Génesis 1:1 – 2:3"
  const lineasEnc = encabezado.filter((p) => p.texto).map((p) => p.texto);
  let numeroEnc = null;
  let titulo = '';
  let textoBase = '';
  lineasEnc.forEach((t, i) => {
    const d = t.match(/^domingo\s*(\d+)\s*(\([^)]*\))?\s*:?\s*(.*)$/i);
    if (d && !titulo) {
      numeroEnc = parseInt(d[1], 10);
      titulo = (d[3] || '').trim();
    }
    const b = t.match(/^texto base\s*:?\s*(.*)$/i);
    if (b && !textoBase) textoBase = (b[1] || '').trim() || (lineasEnc[i + 1] || '').trim();
  });
  // Cuerpo: se reparte en secciones según sus títulos
  const secciones = [];
  let actual = null;
  parrafosDelWord(cuerpo).forEach((p) => {
    if (p.foto) {
      const ruta = destinos[p.foto];
      if (actual && ruta && /\.(png|jpe?g|gif|bmp|webp)$/i.test(ruta)) actual.fotos.push(ruta);
      return;
    }
    const limpio = sinAcentos(p.texto.replace(/^\d+[.)]\s*/, '')).trim();
    if (/^itinerario\s*:?$/.test(limpio)) return;
    const tipo = SECCIONES_CLASE.find((s) => s.patron.test(limpio));
    if (tipo && !secciones.some((s) => s.clave === tipo.clave)) {
      const tiempo = (p.texto.match(/\((\d+\s*min[a-z.]*)\)/i) || [])[1] || '';
      const sinTiempo = p.texto.replace(/\(\d+\s*min[a-z.]*\)/i, '');
      const dosPuntos = sinTiempo.indexOf(':');
      const resto = dosPuntos >= 0 ? sinTiempo.slice(dosPuntos + 1).trim() : '';
      actual = { clave: tipo.clave, titulo: tipo.titulo, tiempo: tiempo.replace(/\.$/, ''), lineas: resto && resto !== '.' ? [resto.charAt(0).toUpperCase() + resto.slice(1)] : [], fotos: [] };
      secciones.push(actual);
      return;
    }
    if (!actual) return;
    actual.lineas.push(p.lista ? `${p.nivel > 0 ? '    ◦ ' : '• '}${p.texto}` : p.texto);
  });
  if (secciones.length === 0) throw new Error('No encontré las secciones de la clase (Objetivo, Puntos clave, Itinerario…).');
  const tipoDe = (ruta) => (/\.png$/i.test(ruta) ? 'image/png' : /\.gif$/i.test(ruta) ? 'image/gif' : /\.webp$/i.test(ruta) ? 'image/webp' : /\.bmp$/i.test(ruta) ? 'image/bmp' : 'image/jpeg');
  for (const s of secciones)
    s.fotos = (
      await Promise.all(
        s.fotos.map(async (ruta) => {
          const b = await zip.leer(ruta, true);
          return b ? new Blob([b], { type: tipoDe(ruta) }) : null;
        }),
      )
    ).filter(Boolean);
  const listas = secciones.map((s) => ({ titulo: s.titulo, tiempo: s.tiempo, texto: s.lineas.join('\n').trim(), clave: s.clave, fotos: s.fotos }));
  const de = (clave) => (listas.find((s) => s.clave === clave) || {}).texto || null;
  const actividades = de('actividades') || '';
  const lineaVersiculo = actividades.split('\n').find((l) => /^[•◦\s]*vers[ií]culo/i.test(l));
  return {
    numeroEnc,
    titulo,
    textoBase,
    totalFotos: listas.reduce((n, s) => n + s.fotos.length, 0),
    secciones: listas.map(({ titulo: t, tiempo, texto, fotos }) => ({ titulo: t, tiempo, texto, fotos })),
    campos: {
      objetivo: de('objetivo'),
      puntos_clave: de('puntos'),
      rompehielos: de('rompehielos'),
      introduccion: de('introduccion'),
      historia: de('historia'),
      puntos_resaltar: de('resaltar'),
      actividad_sugerida: actividades || null,
      versiculo_memoria: lineaVersiculo ? lineaVersiculo.replace(/^[•◦\s]*vers[ií]culo[^:]*:\s*/i, '').trim() : null,
    },
  };
};

// Lee el nombre del archivo: 1_01_27_4_6C → clase 1, enero de 2027, grupo 4 a 6, C = contenido
const datosDelNombre = (nombre) => {
  const m = (nombre || '').match(/(\d+)_(\d{1,2})_(\d{2})_(\d+_\d+)\s*([CAI])(?=[^A-Za-z]*\.\w+$)/i);
  if (!m) return null;
  const mes = parseInt(m[2], 10);
  const anio = 2000 + parseInt(m[3], 10);
  return {
    numero: parseInt(m[1], 10),
    mes,
    anio,
    codigo: m[4],
    tipo: m[5].toUpperCase(),
    grupo: CODIGOS_GRUPO[m[4]] || null,
    clave: `${parseInt(m[1], 10)}_${String(mes).padStart(2, '0')}_${m[3]}_${m[4]}`,
  };
};

// Reduce una foto a máximo 1000 px y la convierte a JPG para que pese poco (si no se puede leer, se omite)
const comprimirFoto = async (blob) => {
  try {
    const img = await createImageBitmap(blob);
    const escala = Math.min(1, 1000 / Math.max(img.width, img.height));
    const ancho = Math.round(img.width * escala);
    const alto = Math.round(img.height * escala);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);
    const reducida = await new Promise((r) => lienzo.toBlob(r, 'image/jpeg', 0.78));
    return reducida ? { blob: reducida, ancho, alto } : null;
  } catch (e) {
    return null;
  }
};

// Opción del panel: elegir varios Word y PDF, revisar la vista previa y subirlos
const SubirContenidoClases = ({ isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Clases de niños'];
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [leyendo, setLeyendo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const fechaDe = (it) => {
    const f = domingosDelMes(it.anio, it.mes - 1)[it.numero - 1];
    return f ? new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
  };

  const elegir = async (lista) => {
    setMensaje('');
    setLeyendo(true);
    const porClase = {};
    const sueltos = [];
    for (const archivo of lista) {
      const d = datosDelNombre(archivo.name);
      if (!d) {
        sueltos.push(`«${archivo.name}»: el nombre no sigue el formato (ej. 1_01_27_4_6C.docx).`);
        continue;
      }
      const it = porClase[d.clave] || (porClase[d.clave] = { ...d, contenido: null, actividad: null, errores: [], avisos: [] });
      if (!it.grupo) it.errores.push(`No conozco el código de grupo «${d.codigo}» (usa 4_6, 7_9 o 10_12).`);
      if (d.tipo === 'C') {
        if (!/\.docx$/i.test(archivo.name)) {
          it.errores.push('El contenido (C) debe ser un Word .docx.');
          continue;
        }
        try {
          it.contenido = await leerClaseDelWord(archivo);
          if (!it.contenido.titulo) it.errores.push('No encontré el título en el encabezado («Domingo 1 (…): Título»).');
          if (it.contenido.numeroEnc && it.contenido.numeroEnc !== d.numero) it.avisos.push(`El Word dice «Domingo ${it.contenido.numeroEnc}» pero el nombre dice clase ${d.numero}. Se usará la ${d.numero}.`);
        } catch (e) {
          it.errores.push(e.message || 'No se pudo leer el Word.');
        }
      } else {
        const nombreTipo = d.tipo === 'I' ? 'Las ilustraciones (I)' : 'La actividad (A)';
        if (!/\.pdf$/i.test(archivo.name)) {
          it.errores.push(`${nombreTipo} debe ser un PDF.`);
          continue;
        }
        if (archivo.size > 15 * 1024 * 1024) {
          it.errores.push('El PDF pesa más de 15 MB.');
          continue;
        }
        if (d.tipo === 'I') it.ilustraciones = archivo;
        else it.actividad = archivo;
      }
    }
    Object.values(porClase).forEach((it) => {
      if (!domingosDelMes(it.anio, it.mes - 1)[it.numero - 1]) it.errores.push(`${NOMBRES_MESES[it.mes - 1] || 'Ese mes'} ${it.anio} no tiene domingo ${it.numero}.`);
    });
    const ordenados = Object.values(porClase).sort((a, b) => a.anio - b.anio || a.mes - b.mes || ORDEN_GRUPOS.indexOf(a.grupo) - ORDEN_GRUPOS.indexOf(b.grupo) || a.numero - b.numero);
    setItems(ordenados);
    if (sueltos.length) setMensaje(sueltos.join('\n'));
    setLeyendo(false);
  };

  const guardarUna = async (it) => {
    const mesAnio = `${NOMBRES_MESES[it.mes - 1]} ${it.anio}`;
    const { data: temas, error: errorTema } = await supabase.from('temas_mensuales').select('id').ilike('mes_anio', mesAnio).limit(1);
    if (errorTema) throw errorTema;
    let temaId = temas && temas[0] && temas[0].id;
    if (!temaId) {
      const { data, error } = await supabase
        .from('temas_mensuales')
        .insert([{ titulo_tema: mesAnio, mes_anio: mesAnio, orden: (it.anio - 2027) * 12 + it.mes }])
        .select('id')
        .single();
      if (error) throw error;
      temaId = data.id;
    }
    const datos = {};
    if (it.contenido) {
      // Fotos de muestra: se borran las anteriores de esta clase y se suben las nuevas, ya reducidas
      const { data: viejas } = await supabase.storage.from('clases').list(it.clave);
      if (viejas && viejas.length) await supabase.storage.from('clases').remove(viejas.map((f) => `${it.clave}/${f.name}`));
      let n = 0;
      const secciones = [];
      for (const s of it.contenido.secciones) {
        const imagenes = [];
        for (const foto of s.fotos || []) {
          const lista = await comprimirFoto(foto);
          if (!lista) continue;
          n += 1;
          const ruta = `${it.clave}/foto${n}.jpg`;
          const { error } = await supabase.storage.from('clases').upload(ruta, lista.blob, { contentType: 'image/jpeg', upsert: true });
          if (error) throw error;
          imagenes.push({ url: `${supabase.storage.from('clases').getPublicUrl(ruta).data.publicUrl}?v=${Date.now()}`, ancho: lista.ancho, alto: lista.alto });
        }
        secciones.push({ titulo: s.titulo, tiempo: s.tiempo, texto: s.texto, ...(imagenes.length ? { imagenes } : {}) });
      }
      Object.assign(datos, it.contenido.campos, { titulo_clase: it.contenido.titulo, texto_base: it.contenido.textoBase || null, secciones });
    }
    if (it.actividad) {
      const ruta = `${it.clave}A.pdf`;
      const { error } = await supabase.storage.from('clases').upload(ruta, it.actividad, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
      datos.url_pdf = `${supabase.storage.from('clases').getPublicUrl(ruta).data.publicUrl}?v=${Date.now()}`;
    }
    if (it.ilustraciones) {
      const ruta = `${it.clave}I.pdf`;
      const { error } = await supabase.storage.from('clases').upload(ruta, it.ilustraciones, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
      datos.url_ilustraciones = `${supabase.storage.from('clases').getPublicUrl(ruta).data.publicUrl}?v=${Date.now()}`;
    }
    const { data: existentes, error: errorBuscar } = await supabase.from('clases_detalle').select('id').eq('tema_id', temaId).eq('rango_edad', it.grupo).eq('numero_clase', it.numero).limit(1);
    if (errorBuscar) throw errorBuscar;
    if (existentes && existentes[0]) {
      const { error } = await supabase.from('clases_detalle').update(datos).eq('id', existentes[0].id);
      if (error) throw error;
    } else {
      if (!it.contenido) throw new Error('Esta clase todavía no existe: sube también su Word.');
      const { error } = await supabase.from('clases_detalle').insert([{ tema_id: temaId, rango_edad: it.grupo, numero_clase: it.numero, ...datos }]);
      if (error) throw error;
    }
  };

  const listas = items.filter((it) => it.errores.length === 0);
  const subir = async () => {
    setSubiendo(true);
    const fallas = [];
    let hechas = 0;
    for (const it of listas) {
      setMensaje(`Subiendo ${hechas + 1} de ${listas.length}…`);
      try {
        await guardarUna(it);
        hechas += 1;
      } catch (e) {
        fallas.push(`Clase ${it.numero} de ${it.grupo}: ${e.message || 'no se pudo guardar'}`);
      }
    }
    setSubiendo(false);
    setItems(fallas.length ? items : []);
    setMensaje(`Listo: ${hechas} de ${listas.length} clases guardadas.${fallas.length ? '\n' + fallas.join('\n') : ''}`);
  };

  return (
    <View>
      <Text style={{ color: colors.textSub, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>Elige los Word (contenido) y los PDF (actividad e ilustraciones) de una vez. Nombre: clase_mes_año_grupo y la letra C, A o I. Ej. 1_01_27_4_6C.docx, 1_01_27_4_6A.pdf y 1_01_27_4_6I.pdf</Text>
      {Platform.OS === 'web' ? (
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={(e) => {
            const lista = Array.from(e.target.files || []);
            e.target.value = '';
            if (lista.length) elegir(lista);
          }}
        />
      ) : null}
      <TouchableOpacity onPress={() => inputRef.current && inputRef.current.click()} disabled={leyendo || subiendo} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textSub, backgroundColor: colors.cardBg, marginBottom: 12 }}>
        {leyendo ? <ActivityIndicator color={colors.textSub} /> : <Feather name="file-plus" size={20} color={colors.textSub} />}
        <Text style={{ flex: 1, color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{leyendo ? 'Leyendo archivos…' : 'Elegir archivos (Word y PDF)'}</Text>
      </TouchableOpacity>

      {items.map((it) => (
        <View key={it.clave} style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: it.errores.length ? '#C97A7A' : colors.cardBorder, borderRadius: 20, padding: 14, marginBottom: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textMain }}>{it.contenido && it.contenido.titulo ? it.contenido.titulo : `Clase ${it.numero}`}</Text>
          <Text style={{ fontSize: 12.5, color: colors.textSub, marginTop: 2 }}>
            Clase {it.numero} • {fechaDe(it) || `${NOMBRES_MESES[it.mes - 1] || '?'} ${it.anio}`} • {it.grupo || it.codigo}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {[
              ['Contenido', it.contenido, it.contenido ? `${it.contenido.secciones.length} secciones${it.contenido.totalFotos ? ` • ${it.contenido.totalFotos} fotos` : ''}` : 'sin Word'],
              ['Actividad', it.actividad, it.actividad ? 'PDF listo' : 'sin PDF'],
              ['Ilustraciones', it.ilustraciones, it.ilustraciones ? 'PDF listo' : 'sin PDF'],
            ].map(([etq, ok, det]) => (
              <View key={etq} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: ok ? paleta.fondo : colors.background }}>
                <Feather name={ok ? 'check' : 'minus'} size={13} color={ok ? paleta.texto : colors.textSub} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: ok ? paleta.texto : colors.textSub }}>
                  {etq}: {det}
                </Text>
              </View>
            ))}
          </View>
          {it.contenido && it.contenido.textoBase ? <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 8 }}>Texto base: {it.contenido.textoBase}</Text> : null}
          {it.contenido ? <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 4 }}>{it.contenido.secciones.map((s) => s.titulo).join(' • ')}</Text> : null}
          {it.avisos.map((t, i) => (
            <Text key={`a${i}`} style={{ fontSize: 12, color: '#C9A227', marginTop: 6 }}>
              • {t}
            </Text>
          ))}
          {it.errores.map((t, i) => (
            <Text key={`e${i}`} style={{ fontSize: 12, color: '#C97A7A', marginTop: 6 }}>
              • {t}
            </Text>
          ))}
        </View>
      ))}

      {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>{mensaje}</Text> : null}
      {listas.length > 0 ? (
        <TouchableOpacity onPress={subir} disabled={subiendo} style={[styles.primaryButton, { backgroundColor: isDark ? paleta.fondo : paleta.texto, opacity: subiendo ? 0.6 : 1 }]}>
          {subiendo ? (
            <ActivityIndicator color={isDark ? paleta.texto : '#FFFFFF'} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: isDark ? paleta.texto : '#FFFFFF' }]}>
              Subir {listas.length} {listas.length === 1 ? 'clase' : 'clases'}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
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
    if (visible) {
      setPaso('inicio');
      setTexto('');
      setResultados([]);
      setMensaje('');
      cargarAsistentes();
    }
  }, [visible]);

  useEffect(() => {
    if (paso !== 'buscar' || texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    const espera = setTimeout(async () => {
      const { data } = await supabase.from('ninos').select('id, nombre_completo, grupo').ilike('nombre_completo', `%${texto.trim()}%`).order('nombre_completo', { ascending: true }).limit(15);
      if (!cancelado) setResultados(data || []);
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [texto, paso]);

  const registrar = async (nino) => {
    if (asistentes.some((a) => a.nino_id === nino.id)) {
      setMensaje(`${nino.nombre_completo} ya está en la lista.`);
      return false;
    }
    const { error } = await supabase.from('asistencia_clases').insert([{ fecha, grupo, nino_id: nino.id, registrado_por: usuario }]);
    if (error) {
      setMensaje(error.code === '23505' ? `${nino.nombre_completo} ya está en la lista.` : 'No se pudo guardar: ' + error.message);
      return false;
    }
    await cargarAsistentes();
    return true;
  };

  const marcar = async (nino) => {
    setGuardando(true);
    const ok = await registrar(nino);
    setGuardando(false);
    if (ok) {
      setMensaje(`Registrado: ${nino.nombre_completo}`);
      setTexto('');
      setResultados([]);
    }
  };

  const agregarYMarcar = async () => {
    const nombre = texto.trim().replace(/\s+/g, ' ');
    if (nombre.length < 3) {
      setMensaje('Escribe el nombre completo del niño.');
      return;
    }
    setGuardando(true);
    const { data: existente } = await supabase.from('ninos').select('id, nombre_completo').ilike('nombre_completo', nombre).limit(1);
    if (existente && existente.length > 0) {
      setGuardando(false);
      setMensaje(`Ya existe "${existente[0].nombre_completo}". Búscalo y márcalo.`);
      return;
    }
    const { data: nuevo, error } = await supabase
      .from('ninos')
      .insert([{ nombre_completo: nombre, grupo, creado_por: usuario }])
      .select('id, nombre_completo')
      .single();
    if (error) {
      setGuardando(false);
      setMensaje('No se pudo agregar: ' + error.message);
      return;
    }
    const ok = await registrar(nuevo);
    setGuardando(false);
    if (ok) {
      setMensaje(`Registrado: ${nuevo.nombre_completo}`);
      setTexto('');
      setPaso('inicio');
    }
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
            <TouchableOpacity onPress={onCerrar} style={{ padding: 6 }}>
              <Feather name="x" size={22} color={colors.textSub} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 16 }}>
            {fechaBonita} • {grupo}
          </Text>

          {paso === 'inicio' && (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 0 }]}
                onPress={() => {
                  setMensaje('');
                  setTexto('');
                  setPaso('buscar');
                }}
              >
                <Feather name="search" size={16} color="#FFFFFF" />
                <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Buscar niño</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder }]}
                onPress={() => {
                  setMensaje('');
                  setTexto('');
                  setPaso('agregar');
                }}
              >
                <Feather name="user-plus" size={16} color={colors.textMain} />
                <Text style={[styles.primaryButtonText, { color: colors.textMain, marginLeft: 8 }]}>Agregar niño</Text>
              </TouchableOpacity>
              {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 12 }}>{mensaje}</Text> : null}
              <Text style={{ color: colors.textMain, fontWeight: '700', marginTop: 20, marginBottom: 8 }}>Asistencia ({asistentes.length})</Text>
              <ScrollView style={{ maxHeight: 220 }}>
                {asistentes.length === 0 ? (
                  <Text style={{ color: colors.textSub, fontSize: 13 }}>Todavía no hay niños registrados en esta clase.</Text>
                ) : (
                  asistentes.map((a) => (
                    <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                      <Text style={{ flex: 1, color: colors.textMain, fontSize: 14 }}>{a.ninos ? a.ninos.nombre_completo : '—'}</Text>
                      <TouchableOpacity onPress={() => quitar(a.id)} style={{ padding: 6 }}>
                        <Feather name="x" size={16} color={colors.textSub} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}

          {paso === 'buscar' && (
            <>
              <TextInput
                style={[styles.input, estiloInput]}
                placeholder="Nombre del niño..."
                placeholderTextColor={colors.textSub}
                value={texto}
                onChangeText={(t) => {
                  setTexto(t);
                  setMensaje('');
                }}
                autoFocus
              />
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
              <TouchableOpacity
                onPress={() => {
                  setPaso('inicio');
                  setTexto('');
                  setMensaje('');
                }}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={{ color: colors.textSub, fontSize: 14 }}>Listo, volver a la lista</Text>
              </TouchableOpacity>
            </>
          )}

          {paso === 'agregar' && (
            <>
              <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 8 }}>Nombre completo del niño (quedará en el grupo {grupo}):</Text>
              <TextInput
                style={[styles.input, estiloInput]}
                placeholder="Nombre y apellido"
                placeholderTextColor={colors.textSub}
                value={texto}
                onChangeText={(t) => {
                  setTexto(t);
                  setMensaje('');
                }}
                autoFocus
              />
              {mensaje ? <Text style={{ color: colors.textSub, fontSize: 13, marginBottom: 8 }}>{mensaje}</Text> : null}
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 4 }]} onPress={agregarYMarcar} disabled={guardando}>
                {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar y marcar asistencia</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPaso('inicio');
                  setTexto('');
                  setMensaje('');
                }}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
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
    if (!usuarioLogin || !pinLogin) return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'Ingresa tu usuario y PIN.' });
    setIngresando(true);
    try {
      const email = `${usuarioSeguro(usuarioLogin)}@indus.app`;
      const password = `IndusApp-${pinLogin.trim()}`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.session) {
        setAlerta({ visible: true, titulo: 'Acceso denegado', mensaje: 'Usuario o PIN incorrectos.' });
      } else {
        const { data, error } = await supabase.from('maestros').select('*').eq('user_id', authData.user.id).single();
        if (error || !data) {
          setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se encontró tu perfil de maestro.' });
        } else {
          usuarioActivoGlobal = data.nombre_usuario;
          rolUsuarioActivoGlobal = data.rol;
          vincularOneSignal(data.nombre_usuario);
          setUsuarioLogin('');
          setPinLogin('');
          navigation.replace('MenuPrincipal');
        }
      }
    } catch (error) {
      setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo iniciar sesión.' });
    } finally {
      setIngresando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: compacto ? 'flex-start' : 'center', alignItems: 'center', padding: 20, paddingTop: compacto ? 12 : 20 }}>
          <View style={{ width: '100%', maxWidth: 450 }}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: compacto ? 110 : 180, height: compacto ? 78 : 128, resizeMode: 'contain', alignSelf: 'center', marginBottom: compacto ? 12 : 30 }} />
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>Usuario</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholderTextColor={colors.textSub} value={usuarioLogin} onChangeText={(t) => setUsuarioLogin(t.replace(/\s/g, '').toLowerCase())} autoCapitalize="none" autoCorrect={false} spellCheck={false} />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>PIN</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholderTextColor={colors.textSub} value={pinLogin} onChangeText={setPinLogin} keyboardType="numeric" maxLength={4} secureTextEntry={true} />
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
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [mostrarAvisos, setMostrarAvisos] = useState(false);
  const [hayNotificaciones, setHayNotificaciones] = useState(false);
  const [avisosPush, setAvisosPush] = useState(estadoAvisos());
  const columnas = useColumnas();
  const esTablet = columnas >= 2;
  const tarjetas = [tieneClases && { icono: 'smile', titulo: 'Clases de niños', categoria: 'Clases de niños', onPress: () => navigation.navigate('Grupos') }, tieneRol && { icono: 'calendar', titulo: 'Rol de predicaciones y Cena del Señor', categoria: 'Predicaciones', onPress: () => navigation.navigate('Roles') }, { icono: 'volume-2', titulo: 'Anuncios', categoria: 'Anuncios', pronto: true, onPress: () => proximamente(getThemeColors('Anuncios', isDark).textDark) }, { icono: 'heart', titulo: 'Petición de oración', categoria: 'Petición', pronto: true, onPress: () => proximamente(getThemeColors('Petición', isDark).textDark) }, { icono: 'calendar', titulo: 'Calendario de actividades', categoria: 'Calendario', pronto: true, onPress: () => proximamente(getThemeColors('Calendario', isDark).textDark) }].filter(Boolean);

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
      if (rolUsuarioActivoGlobal === 'administrador') {
        setTieneRol(true);
        setTieneClases(true);
        return () => clearInterval(temporizador);
      }
      (async () => {
        const hoy = fechaISO(new Date());
        const [{ data }, { data: cena }] = await Promise.all([supabase.from('programa_servicios').select('id').ilike('nombre_usuario', usuarioActivoGlobal).gte('fecha', hoy), supabase.from('cena_turnos').select('id').ilike('nombre_usuario', usuarioActivoGlobal).gte('fecha', hoy).in('estado', ['invitado', 'confirmado']).limit(1)]);
        setTieneRol((data && data.length > 0) || (cena && cena.length > 0));
      })();
      (async () => {
        const { data } = await supabase.from('clases_asignadas').select('id').or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`).gte('fecha', fechaISO(new Date())).limit(1);
        setTieneClases(!!(data && data.length > 0));
      })();
      return () => clearInterval(temporizador);
    }, []),
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
      titulo: 'Cerrar sesión',
      mensaje: '¿Seguro que quieres cerrar tu sesión?',
      textoConfirmar: 'Sí, cerrar sesión',
      themeColor: '#4A5568',
      onCancelar: cerrarAlerta,
      isDark: isDark,
      onConfirmar: () => {
        cerrarAlerta();
        cerrarSesion();
      },
    });
  };

  const proximamente = (color) => {
    setAlerta({ visible: true, titulo: 'Próximamente', mensaje: 'Esta sección todavía se está construyendo.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: color });
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
          <TouchableOpacity onPress={() => setMostrarAvisos(true)} style={{ padding: 8 }} accessibilityLabel="Avisos">
            <IconoNotificacion size={28} color={colors.textSub} activo={hayNotificaciones} />
          </TouchableOpacity>
        </View>

        {avisosPush !== 'activo' && avisosPush !== 'no-soportado' && (
          <View style={{ width: '95%', maxWidth: esTablet ? 1100 : 850, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 14 }}>
            <Feather name="bell-off" size={20} color={colors.textSub} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 13, color: colors.textMain }}>{avisosPush === 'pendiente' ? 'Activa los avisos para enterarte de las solicitudes de apoyo.' : avisosPush === 'bloqueado' ? 'Los avisos están bloqueados. Actívalos en los ajustes de tu teléfono o navegador.' : 'Para recibir avisos, instala la app en tu pantalla de inicio.'}</Text>
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
      </ScrollView>
      <AlertaPersonalizada {...alerta} />
      <PanelAjustes visible={mostrarAjustes} onCerrar={() => setMostrarAjustes(false)} isDark={isDark} toggleTheme={toggleTheme} onCerrarSesion={confirmarCerrarSesion} onAdmin={() => navigation.navigate('Admin')} onAyuda={() => setMostrarAyuda(true)} />
      <ModalAyuda visible={mostrarAyuda} onCerrar={() => setMostrarAyuda(false)} onNavegar={(pantalla, params) => (pantalla === 'Notificaciones' ? setMostrarAvisos(true) : navigation.navigate(pantalla, params))} isDark={isDark} />
      <PanelNotificaciones visible={mostrarAvisos} onCerrar={() => setMostrarAvisos(false)} onNavegar={(pantalla, params) => navigation.navigate(pantalla, params)} onRevisadas={setHayNotificaciones} isDark={isDark} />
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
    const anim = Animated.loop(Animated.sequence([Animated.timing(pulso, { toValue: 1.4, duration: 500, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(pulso, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' })]));
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
      (maestros || []).forEach((m) => {
        mapa[m.nombre_usuario.toLowerCase()] = m.nombre_completo;
      });
      setMapaNombres(mapa);
    }

    const { data: elegibles } = await supabase.rpc('nombres_publicos');
    setMaestrosElegibles((elegibles || []).filter((m) => m.elegible_predicaciones));
  };

  useFocusEffect(
    React.useCallback(() => {
      cargarRol().then(() => setCargando(false));
    }, []),
  );

  const onRefresh = React.useCallback(async () => {
    setRefrescando(true);
    await cargarRol();
    setRefrescando(false);
  }, []);

  const confirmarAsistencia = async (item) => {
    await supabase.from('programa_servicios').update({ estado_confirmacion: 'confirmado' }).eq('id', item.id);
    setFechas((prev) => prev.map((f) => (f.id === item.id ? { ...f, estado_confirmacion: 'confirmado' } : f)));
  };

  const formatearFecha = (fechaTexto) => {
    const fecha = new Date(fechaTexto + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const enviarSolicitudApoyo = async (item, opciones = {}) => {
    const { destino = null, tipo = null, fechaIntercambioId = null } = opciones;
    const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('programa_servicio_id', item.id).eq('estado', 'Pendiente');
    if (existente && existente.length > 0) {
      setAlerta({ visible: true, titulo: 'Ya existe', mensaje: 'Ya hay una solicitud de apoyo pendiente para esta fecha.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#2C4A73' });
      return;
    }
    const tipoCalc = calcularTipo(item.fecha, item.horario);
    const { error } = await supabase.from('solicitudes_sustitucion').insert([
      {
        mes_anio: formatearFecha(item.fecha),
        titulo_tema: `${tipoCalc} • ${item.horario}`,
        grupo_clase: 'Predicaciones',
        maestro_solicitante: item.nombre_usuario,
        programa_servicio_id: item.id,
        fecha_referencia: item.fecha,
        maestro_destino: destino,
        tipo_intercambio: tipo,
        programa_servicio_id_intercambio: fechaIntercambioId,
      },
    ]);
    if (error) {
      setAlerta({ visible: true, titulo: 'Error', mensaje: error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: 'Listo', mensaje: destino ? 'Tu solicitud se envió directamente a esa persona.' : 'Tu solicitud ya aparece en el tablón de apoyo.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#2C4A73' });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView ref={scrollRolRef} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colors.textSub} />}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8 }}>
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

        <View style={{ width: '95%', maxWidth: 850, marginBottom: 15 }}>
          <BotonChico icono="clipboard" texto="Solicitudes de apoyo" categoria="Predicaciones" isDark={isDark} onPress={() => navigation.navigate('Tablon', { soloGrupo: 'Predicaciones' })} />
        </View>

        <View
          style={{ width: '95%', maxWidth: 850 }}
          onLayout={(e) => {
            listaRolY.current = e.nativeEvent.layout.y;
          }}
        >
          {cargando && <ActivityIndicator style={{ marginTop: 20 }} color={colors.textSub} />}
          {!cargando && fechas.length === 0 && <Text style={{ color: colors.textSub, textAlign: 'center', marginTop: 20 }}>{rolUsuarioActivoGlobal === 'administrador' ? 'No hay fechas programadas.' : 'No tienes fechas próximas.'}</Text>}
          {Object.entries(
            fechas.reduce((acc, item) => {
              (acc[item.fecha] = acc[item.fecha] || []).push(item);
              return acc;
            }, {}),
          ).map(([fecha, items]) => (
            <View
              key={fecha}
              onLayout={(e) => {
                if (servicioId && !yaDesplazadoRol.current && items.some(esObjetivo) && scrollRolRef.current) {
                  yaDesplazadoRol.current = true;
                  const y = listaRolY.current + e.nativeEvent.layout.y - 10;
                  setTimeout(() => {
                    if (scrollRolRef.current) scrollRolRef.current.scrollTo({ y: Math.max(0, y), animated: true });
                  }, 150);
                }
              }}
              style={{ flexDirection: 'row', marginBottom: 14 }}
            >
              <View style={{ width: 56, alignItems: 'center', paddingTop: 14 }}>
                <Text style={{ fontSize: 21, fontWeight: '700', color: colors.textMain }}>{['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(fecha + 'T00:00:00').getDay()]}</Text>
                <Text style={{ fontSize: 13, color: colors.textSub }}>
                  {new Date(fecha + 'T00:00:00').getDate()} {new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}
                </Text>
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
                        <Feather name={esClase ? 'calendar' : 'mic'} size={16} color={tintText} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: colors.textMain }}>
                          {item.horario}
                          {rolUsuarioActivoGlobal === 'administrador' ? ` • ${ponerMayusculas(mapaNombres[item.nombre_usuario.toLowerCase()] || item.nombre_usuario)}` : ''}
                        </Text>
                        {esObjetivo(item) && item.estado_confirmacion !== 'confirmado' && item.nombre_usuario.toLowerCase() === usuarioActivoGlobal.toLowerCase() && <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9FBCE8' : '#2C4A73', marginTop: 3 }}>Confirma aquí tu asistencia 👉</Text>}
                      </View>
                      {item.usuario_original && <Text style={{ fontSize: 11, color: colors.textSub, textDecorationLine: 'line-through', marginRight: 2 }}>{mapaNombres[item.usuario_original.toLowerCase()] || item.usuario_original}</Text>}
                      {item.nombre_usuario.toLowerCase() === usuarioActivoGlobal.toLowerCase()
                        ? item.estado_confirmacion !== 'confirmado' && (
                            <TouchableOpacity onPress={() => confirmarAsistencia(item)} style={{ padding: 6 }}>
                              <Animated.View style={{ transform: [{ scale: esObjetivo(item) ? pulso : 1 }] }}>
                                <Feather name="thumbs-up" size={18} color={esObjetivo(item) ? (isDark ? '#9FBCE8' : '#2C4A73') : colors.textSub} />
                              </Animated.View>
                            </TouchableOpacity>
                          )
                        : rolUsuarioActivoGlobal === 'administrador' && item.estado_confirmacion !== 'confirmado' && <Feather name="clock" size={16} color="#C9A227" />}
                      {(item.nombre_usuario.toLowerCase() === usuarioActivoGlobal.toLowerCase() || rolUsuarioActivoGlobal === 'administrador') && (
                        <TouchableOpacity
                          onPress={() => {
                            setItemApoyo(item);
                            setMostrarModalApoyo(true);
                          }}
                          style={{ padding: 6, marginLeft: 2 }}
                        >
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
        onConfirmar={async (opciones) => {
          setMostrarModalApoyo(false);
          await enviarSolicitudApoyo(itemApoyo, opciones);
        }}
      />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA 1b: GRUPOS (clases de niños)
// ==========================================
// Ventana de clases: cada quien ve lo del mes en curso y lo del próximo (se habilita un mes antes)
const finDeVentana = () => {
  const h = new Date();
  return fechaISO(new Date(h.getFullYear(), h.getMonth() + 2, 0));
};
const inicioDeMesActual = () => {
  const h = new Date();
  return fechaISO(new Date(h.getFullYear(), h.getMonth(), 1));
};
const nombreEquipo = (equipo) => {
  const n = String(equipo || '')
    .replace(/^\s*(equipo|eq)\.?\s*/i, '')
    .trim();
  return n ? `Equipo ${n}` : null;
};

function GruposScreen({ navigation, route }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const columnas = useColumnas();
  const anchoMax = columnas >= 2 ? 1100 : 850;
  const esAdmin = rolUsuarioActivoGlobal === 'administrador';
  const yo = (usuarioActivoGlobal || '').toLowerCase();
  // Si viene un mes, es la vista de ese mes: todos sus grupos (coordinadores y vista de administrador)
  const mesVista = route?.params?.mes || null;
  const [misClases, setMisClases] = useState([]);
  const [filasMes, setFilasMes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mapaNombres, setMapaNombres] = useState({});
  useEffect(() => {
    cargarMapaNombres().then(setMapaNombres);
  }, []);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        if (mesVista) {
          const { data } = await supabase.from('clases_asignadas').select('fecha, grupo, mes_anio, coordinador, nombre_usuario, usuario_original, equipo').eq('mes_anio', mesVista).range(0, 999);
          setFilasMes(data || []);
        } else {
          // Tus clases y lo que coordinas, solo del mes en curso y del próximo
          let consulta = supabase.from('clases_asignadas').select('fecha, grupo, mes_anio, coordinador, nombre_usuario, equipo').gte('fecha', inicioDeMesActual()).lte('fecha', finDeVentana()).order('fecha', { ascending: true }).range(0, 999);
          if (!esAdmin) consulta = consulta.or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`);
          const { data } = await consulta;
          setMisClases(data || []);
        }
        setCargando(false);
      })();
    }, [mesVista]),
  );

  // Al tocar una tarjeta se abre solo ese mes: sus clases (con temario) o sus domingos
  const abrirGrupo = async (g, mesAnio) => {
    if (GRUPOS_INFO[g] && GRUPOS_INFO[g].temario) {
      const { data } = await supabase.from('temas_mensuales').select('*').ilike('mes_anio', mesAnio).limit(1);
      const tema = (data && data[0]) || { id: null, titulo_tema: mesAnio, mes_anio: mesAnio };
      return navigation.navigate('Clases', { tema, grupo: g });
    }
    return navigation.navigate('Domingos', { grupo: g, mes: mesAnio });
  };

  // Tarjetas: un grupo por mes donde das clase, y un equipo por mes que coordinas (con la etiqueta «Coordinas»)
  const tarjetas = [];
  const hoy = fechaISO(new Date());
  misClases.forEach((a) => {
    const mia = (a.nombre_usuario || '').toLowerCase() === yo;
    const coordino = (a.coordinador || '').toLowerCase() === yo;
    if (mia && a.fecha >= hoy && !tarjetas.some((t) => t.clave === `${a.mes_anio}|${a.grupo}`)) {
      tarjetas.push({ clave: `${a.mes_anio}|${a.grupo}`, fecha: a.fecha, icono: (GRUPOS_INFO[a.grupo] || {}).icono || 'smile', titulo: a.grupo, subtitulo: a.mes_anio, detalle: a.coordinador && !coordino ? `Coordina: ${nombreDe(a.coordinador)}` : null, categoria: a.grupo, onPress: () => abrirGrupo(a.grupo, a.mes_anio) });
    }
    if ((coordino || esAdmin) && !tarjetas.some((t) => t.clave === `coord|${a.mes_anio}`)) {
      tarjetas.push({ clave: `coord|${a.mes_anio}`, fecha: a.fecha, icono: 'users', titulo: nombreEquipo(a.equipo) || 'Tu equipo', subtitulo: a.mes_anio, detalle: coordino ? 'Todos los grupos del mes' : a.coordinador ? `Coordina: ${nombreDe(a.coordinador)}` : 'Todos los grupos del mes', etiqueta: coordino ? 'Coordinas' : null, categoria: 'Clases de niños', onPress: () => navigation.push('Grupos', { mes: a.mes_anio }) });
    }
  });
  tarjetas.sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));

  // Vista de un mes: cada grupo con quién está asignado
  const asignadosA = (g) => {
    const nombres = [];
    filasMes
      .filter((r) => r.grupo === g)
      .forEach((r) => {
        const n = nombreDe(r.usuario_original || r.nombre_usuario);
        if (!nombres.includes(n)) nombres.push(n);
      });
    return nombres.length > 0 ? `Asignado a: ${nombres.join(', ')}` : 'Sin asignar';
  };
  const gruposDelMes = ORDEN_GRUPOS.map((g) => ({ icono: GRUPOS_INFO[g].icono, titulo: g, subtitulo: `${GRUPOS_INFO[g].turno} • ${GRUPOS_INFO[g].edades}`, detalle: asignadosA(g), categoria: g, onPress: () => abrirGrupo(g, mesVista) }));
  const filaConDatos = filasMes.find((r) => r.coordinador || r.equipo) || {};
  const subtituloMes = [nombreEquipo(filaConDatos.equipo), filaConDatos.coordinador ? `Coordina: ${nombreDe(filaConDatos.coordinador)}` : null].filter(Boolean).join(' • ') || 'Todos los grupos del mes';
  const lista = mesVista ? gruposDelMes : tarjetas;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: anchoMax, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>{mesVista || 'Clases de niños'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>{mesVista ? subtituloMes : 'Selecciona el grupo a impartir'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        <View style={{ width: '95%', maxWidth: anchoMax, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
          {esAdmin && !mesVista ? <BotonChico icono="toggle-left" texto="Vista de administrador" neutro isDark={isDark} onPress={() => navigation.replace('VistaAdmin')} /> : null}
          <BotonChico icono="clipboard" texto="Solicitudes de apoyo" categoria="Clases de niños" isDark={isDark} onPress={() => navigation.navigate('Tablon', { excluirGrupo: 'Predicaciones' })} />
          <BotonChico icono="music" texto="Coritos" categoria="Coritos" isDark={isDark} onPress={() => navigation.navigate('Coritos')} />
        </View>
        {cargando ? (
          <ActivityIndicator size="large" color={colors.textSub} style={{ marginTop: 30 }} />
        ) : !mesVista && tarjetas.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '95%', maxWidth: anchoMax }]}>
            <Feather name="calendar" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin clases por ahora</Text>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Un mes antes de que te toque, aquí aparecerán tus grupos y sus temas.</Text>
          </View>
        ) : (
          <View style={[styles.gruposContainer, { width: '95%', maxWidth: anchoMax }, columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            {lista.map((g, i, arr) => (
              <TarjetaMenu key={g.clave || g.titulo} {...g} isDark={isDark} columnas={columnas} esUltima={i === arr.length - 1} total={arr.length} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: VISTA DE ADMINISTRADOR (rol de clases por año y mes)
// ==========================================
function VistaAdminScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const columnas = useColumnas();
  const [meses, setMeses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mapaNombres, setMapaNombres] = useState({});
  useEffect(() => {
    cargarMapaNombres().then(setMapaNombres);
  }, []);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('clases_asignadas').select('fecha, mes_anio, coordinador, equipo').gte('fecha', inicioDeMesActual()).order('fecha', { ascending: true }).range(0, 4999);
      const porMes = [];
      (data || []).forEach((r) => {
        let m = porMes.find((x) => x.mes_anio === r.mes_anio);
        if (!m) {
          m = { mes_anio: r.mes_anio, fecha: parsearMesAnio(r.mes_anio), equipo: null, coordinador: null };
          porMes.push(m);
        }
        if (!m.equipo && r.equipo) m.equipo = r.equipo;
        if (!m.coordinador && r.coordinador) m.coordinador = r.coordinador;
      });
      setMeses(porMes.filter((m) => m.fecha));
      setCargando(false);
    })();
  }, []);

  const anios = [...new Set(meses.map((m) => m.fecha.getFullYear()))];
  const hoy = new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Grupos'))} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Vista de administrador</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Rol de clases por mes</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        <View style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
          <BotonChico icono="toggle-right" texto="Vista de administrador" categoria="Usuarios" isDark={isDark} onPress={() => navigation.replace('Grupos')} />
        </View>
        {cargando ? (
          <ActivityIndicator size="large" color={colors.textSub} style={{ marginTop: 30 }} />
        ) : meses.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '95%', maxWidth: 850 }]}>
            <Feather name="calendar" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Aún no hay rol de clases</Text>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Cuando subas el rol, aquí verás cada mes con su equipo.</Text>
          </View>
        ) : (
          anios.map((anio) => (
            <View key={anio} style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textMain, marginTop: 6, marginBottom: 12, marginLeft: 4 }}>{anio}</Text>
              <View style={columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {meses
                  .filter((m) => m.fecha.getFullYear() === anio)
                  .map((m) => (
                    <TarjetaLista key={m.mes_anio} icono="calendar" titulo={NOMBRES_MESES[m.fecha.getMonth()]} subtitulo={nombreEquipo(m.equipo) || 'Equipo sin número'} etiqueta={m.fecha.getFullYear() === hoy.getFullYear() && m.fecha.getMonth() === hoy.getMonth() ? 'Este mes' : null} asignado={m.coordinador ? `Coordina: ${nombreDe(m.coordinador)}` : null} categoria="Clases de niños" isDark={isDark} ancho={columnas >= 2 ? '48.5%' : '100%'} onPress={() => navigation.push('Grupos', { mes: m.mes_anio })} />
                  ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
// ==========================================
// CENA DEL SEÑOR (1 preside y 6 sirven la mesa)
// ==========================================
// Domingo que se está organizando: el próximo (si hoy es domingo, hoy)
const proximoDomingo = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return fechaISO(d);
};
// Por dónde reparte cada posición: lado del pasillo, hilera donde empieza y hacia dónde avanza
const RECORRIDO_CENA = {
  1: { lado: 'izq', fila: 15, hasta: 13 },
  2: { lado: 'der', fila: 11, hasta: 13 },
  3: { lado: 'izq', fila: 5, hasta: 7 },
  4: { lado: 'der', fila: 10, hasta: 8 },
  5: { lado: 'izq', fila: 4, hasta: 2 },
  6: { lado: 'der', fila: 1, hasta: 3 },
};
const responderCena = async (turnoId, respuesta) => {
  const { data, error } = await supabase.functions.invoke('cena', { body: { accion: 'responder', turno_id: turnoId, respuesta } });
  if (error || (data && data.error)) throw new Error((data && data.error) || (error && error.message) || 'Error');
  return data;
};
const fechaLargaCena = (iso) => {
  const t = new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Botones «Confirmar» y «No puedo» de una invitación (en avisos y en la pantalla de la Cena)
const AccionesCena = ({ turno, isDark, onHecho }) => {
  const [enviando, setEnviando] = useState(false);
  const responderInvitacion = async (respuesta) => {
    setEnviando(true);
    try {
      await responderCena(turno, respuesta);
      onHecho(respuesta);
    } catch (e) {
      setEnviando(false);
      if (typeof window !== 'undefined' && window.alert) window.alert('No se pudo enviar tu respuesta: ' + e.message);
    }
  };
  if (enviando) return <ActivityIndicator style={{ marginTop: 10, alignSelf: 'flex-start' }} color={getColors(isDark).textSub} />;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      <BotonChico icono="check" texto="Confirmar" categoria="Cena" isDark={isDark} onPress={() => responderInvitacion('confirmar')} />
      <BotonChico icono="x" texto="No puedo" neutro isDark={isDark} onPress={() => responderInvitacion('declinar')} />
    </View>
  );
};

// Diagrama del salón con el recorrido de una posición: un punto sale del frente y recorre su hilera
const DiagramaCena = ({ posicion, isDark }) => {
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Cena'];
  const avance = useRef(new Animated.Value(0)).current;
  const W = 300;
  const FILA0 = 92;
  const PASO = 21;
  const H = FILA0 + 14 * PASO + 12;
  const xCirculo = { 5: 30, 3: 72, 1: 114, 2: 186, 4: 228, 6: 270 };
  const yFila = (f) => FILA0 + (f - 1) * PASO;
  const r = RECORRIDO_CENA[posicion];
  const izq = r && r.lado === 'izq';
  // Solo se dibuja desde tu hilera: sale hacia tu lado del pasillo y avanza 2 hileras en tu dirección
  const puntos = r
    ? [
        [izq ? 134 : 166, yFila(r.fila)],
        [izq ? 96 : 204, yFila(r.fila)],
        [izq ? 96 : 204, yFila(r.hasta)],
      ]
    : [];
  useEffect(() => {
    if (!r) return undefined;
    avance.setValue(0);
    const animacion = Animated.loop(Animated.sequence([Animated.timing(avance, { toValue: 1, duration: 5000, useNativeDriver: false }), Animated.delay(900), Animated.timing(avance, { toValue: 0, duration: 0, useNativeDriver: false })]));
    animacion.start();
    return () => animacion.stop();
  }, [posicion]);
  if (!r) return null;
  // Reparte el tiempo de la animación según lo largo de cada tramo
  const largos = puntos.slice(1).map((p, i) => Math.abs(p[0] - puntos[i][0]) + Math.abs(p[1] - puntos[i][1]));
  const total = largos.reduce((a, b) => a + b, 0) || 1;
  const entradas = [0];
  largos.forEach((l) => entradas.push(entradas[entradas.length - 1] + l / total));
  entradas[entradas.length - 1] = 1;
  const x = avance.interpolate({ inputRange: entradas, outputRange: puntos.map((p) => p[0] - 8) });
  const y = avance.interpolate({ inputRange: entradas, outputRange: puntos.map((p) => p[1] - 8) });
  const camino = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');
  const fin = puntos[puntos.length - 1];
  const flecha = r.hasta < r.fila ? `M${fin[0] - 6} ${fin[1] + 7} L${fin[0]} ${fin[1]} L${fin[0] + 6} ${fin[1] + 7}` : `M${fin[0] - 6} ${fin[1] - 7} L${fin[0]} ${fin[1]} L${fin[0] + 6} ${fin[1] - 7}`;
  return (
    <View style={{ alignSelf: 'center', width: W, height: H, marginVertical: 8 }}>
      <Svg width={W} height={H}>
        <Path d={camino} stroke={paleta.fondo} strokeWidth={3} fill="none" strokeLinejoin="round" />
        <Path d={flecha} stroke={paleta.fondo} strokeWidth={3} fill="none" strokeLinecap="round" />
      </Svg>
      {/* Mesa al frente */}
      <View style={{ position: 'absolute', left: 120, top: 0, width: 60, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 10, color: colors.textSub }}>Mesa</Text>
      </View>
      {/* Las 6 posiciones al frente */}
      {Object.entries(xCirculo).map(([p, cx]) => {
        const mio = Number(p) === posicion;
        return (
          <View key={p} style={{ position: 'absolute', left: cx - 14, top: 24, width: 28, height: 28, borderRadius: 14, backgroundColor: mio ? paleta.fondo : 'transparent', borderWidth: 1.5, borderColor: mio ? paleta.fondo : colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: mio ? paleta.texto : colors.textSub }}>{p}</Text>
          </View>
        );
      })}
      {/* Hileras de bancas */}
      {Array.from({ length: 15 }, (_, i) => i + 1).map((f) => (
        <Text key={f} style={{ position: 'absolute', left: 140, top: yFila(f) - 8, width: 20, textAlign: 'center', fontSize: 11, fontWeight: f === r.fila ? '800' : '500', color: f === r.fila ? colors.textMain : colors.textSub }}>
          {f}
        </Text>
      ))}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: paleta.texto, borderWidth: 3, borderColor: paleta.fondo, transform: [{ translateX: x }, { translateY: y }] }} />
    </View>
  );
};

// ==========================================
// PANTALLA: ROLES (predicaciones y Cena del Señor)
// ==========================================
function RolesScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const columnas = useColumnas();
  const anchoMax = columnas >= 2 ? 1100 : 850;
  const tarjetas = [
    { icono: 'calendar', titulo: 'Rol de predicaciones', categoria: 'Predicaciones', onPress: () => navigation.navigate('MiRol') },
    { icono: 'cena', titulo: 'Rol de la Cena del Señor', categoria: 'Cena', onPress: () => navigation.navigate('Cena') },
  ];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: anchoMax, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Roles</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Predicaciones y Cena del Señor</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        <View style={[styles.gruposContainer, { width: '95%', maxWidth: anchoMax }, columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          {tarjetas.map((t, i, arr) => (
            <TarjetaMenu key={t.titulo} {...t} isDark={isDark} columnas={columnas >= 2 ? 2 : 1} esUltima={i === arr.length - 1} total={arr.length} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: ROL DE LA CENA DEL SEÑOR (semana a semana)
// ==========================================
function CenaScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Cena'];
  const esAdmin = rolUsuarioActivoGlobal === 'administrador';
  const yo = (usuarioActivoGlobal || '').toLowerCase();
  const domingo = proximoDomingo();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [eligiendo, setEligiendo] = useState(null);
  const [elegibles, setElegibles] = useState([]);
  const [asignando, setAsignando] = useState(false);
  const [mapaNombres, setMapaNombres] = useState({});
  const [alerta, setAlerta] = useState({ visible: false });
  const cerrarAlerta = () => setAlerta({ visible: false });
  useEffect(() => {
    cargarMapaNombres().then(setMapaNombres);
  }, []);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);

  const cargar = async () => {
    const { data } = await supabase.from('cena_turnos').select('*').eq('fecha', domingo).in('estado', ['invitado', 'confirmado']).order('posicion', { ascending: true });
    setTurnos(data || []);
    setCargando(false);
  };
  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, []),
  );

  const miTurno = turnos.find((t) => (t.nombre_usuario || '').toLowerCase() === yo);
  const confirmado = miTurno && miTurno.estado === 'confirmado';
  const verRol = esAdmin || confirmado;
  // El botón + para asignar a mano se habilita el sábado desde las 12:00 (y el domingo)
  const ahora = new Date();
  const puedeAsignar = esAdmin && ((ahora.getDay() === 6 && ahora.getHours() >= 12) || ahora.getDay() === 0);
  const turnoDe = (p) => turnos.find((t) => t.posicion === p);

  const abrirAsignar = async (posicion) => {
    setEligiendo(posicion);
    const { data } = await supabase.from('maestros').select('nombre_usuario, nombre_completo, elegible_presidir, elegible_mesa').order('nombre_completo', { ascending: true });
    const confirmados = turnos.filter((t) => t.estado === 'confirmado').map((t) => (t.nombre_usuario || '').toLowerCase());
    setElegibles((data || []).filter((m) => (posicion === 0 ? m.elegible_presidir : m.elegible_mesa) && !confirmados.includes((m.nombre_usuario || '').toLowerCase())));
  };
  const asignar = async (persona) => {
    setAsignando(true);
    const { data, error } = await supabase.functions.invoke('cena', { body: { accion: 'asignar', fecha: domingo, posicion: eligiendo, nombre_usuario: persona.nombre_usuario } });
    setAsignando(false);
    setEligiendo(null);
    if (error || (data && data.error)) return setAlerta({ visible: true, titulo: 'No se pudo asignar', mensaje: (data && data.error) || error.message, onConfirmar: cerrarAlerta, isDark });
    cargar();
  };

  // Quien ya confirmó y después no puede: libera su lugar y la app invita al siguiente
  const cancelarMiLugar = () =>
    setAlerta({
      visible: true,
      titulo: '¿Ya no puedes apoyar?',
      mensaje: 'Se liberará tu lugar y la app invitará a otro hermano.',
      textoConfirmar: 'Liberar mi lugar',
      onCancelar: cerrarAlerta,
      isDark,
      themeColor: '#C97A7A',
      onConfirmar: async () => {
        cerrarAlerta();
        const { data, error } = await supabase.functions.invoke('cena', { body: { accion: 'cancelar', turno_id: miTurno.id } });
        if (error || (data && data.error)) return setTimeout(() => setAlerta({ visible: true, titulo: 'No se pudo', mensaje: (data && data.error) || error.message, onConfirmar: cerrarAlerta, isDark }), 300);
        cargar();
      },
    });
  const tarjeta = { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 28, padding: 20, marginBottom: 14 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 30, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Cena del Señor</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        <View style={{ width: '95%', maxWidth: 850 }}>
          {cargando ? (
            <ActivityIndicator color={colors.textSub} style={{ marginTop: 30 }} />
          ) : (
            <>
              {/* Invitación pendiente */}
              {miTurno && miTurno.estado === 'invitado' ? (
                <View style={tarjeta}>
                  <Feather name="mail" size={22} color={paleta.fondo} />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textMain, marginTop: 8 }}>Te invitamos a apoyar en la Cena del Señor</Text>
                  <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4 }}>
                    {miTurno.posicion === 0 ? 'Para presidir' : `Para servir la mesa (posición ${miTurno.posicion})`} • {fechaLargaCena(domingo)}
                  </Text>
                  <AccionesCena turno={miTurno.id} isDark={isDark} onHecho={() => cargar()} />
                </View>
              ) : null}

              {/* Quien no está programado esta semana */}
              {!verRol && !(miTurno && miTurno.estado === 'invitado') ? (
                <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <View style={{ marginBottom: 15 }}>
                    <IconoCena size={40} color={colors.textSub} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No estás programado esta semana</Text>
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>Cuando te inviten a apoyar en la Cena del Señor, aquí verás tu lugar y cómo repartir.</Text>
                </View>
              ) : null}

              {/* Tu parte (confirmado) */}
              {confirmado ? (
                <View style={tarjeta}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSub, letterSpacing: 1 }}>TU PARTE</Text>
                  {miTurno.posicion === 0 ? (
                    <>
                      <Text style={{ fontSize: 19, fontWeight: '800', color: colors.textMain, marginTop: 6 }}>Presides la Cena del Señor</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 19, fontWeight: '800', color: colors.textMain, marginTop: 6 }}>Sirves en la posición {miTurno.posicion}</Text>
                      <DiagramaCena posicion={miTurno.posicion} isDark={isDark} />
                    </>
                  )}
                </View>
              ) : null}

              {/* Rol de la semana: los participantes confirmados lo ven; el administrador ve también quién está pendiente */}
              {verRol ? (
                <View style={tarjeta}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSub, letterSpacing: 1, marginBottom: 6 }}>{`Rol del ${fechaLargaCena(domingo).replace(',', '')}`.toUpperCase()}</Text>
                  {[0, 1, 2, 3, 4, 5, 6].map((p) => {
                    const t = turnoDe(p);
                    const listo = t && t.estado === 'confirmado';
                    // Invitado sin responder: el administrador ve su nombre opaco; los demás ven «Por confirmar»
                    const pendiente = !listo && esAdmin && !!t;
                    const texto = listo || pendiente ? nombreDe(t.nombre_usuario) : 'Por confirmar';
                    return (
                      <View key={p} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: p === 0 ? 0 : 1, borderTopColor: colors.cardBorder }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: listo ? paleta.fondo : 'transparent', borderWidth: 1.5, borderColor: listo ? paleta.fondo : colors.cardBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>{p === 0 ? <Feather name="book-open" size={15} color={listo ? paleta.texto : colors.textSub} /> : <Text style={{ fontWeight: '700', color: listo ? paleta.texto : colors.textSub }}>{p}</Text>}</View>
                        <View style={{ flex: 1 }}>
                          {p === 0 ? <Text style={{ fontSize: 12, color: colors.textSub }}>Preside</Text> : null}
                          <Text style={{ fontSize: 15, fontWeight: listo || pendiente ? '700' : '500', color: listo || pendiente ? colors.textMain : colors.textSub, fontStyle: listo || pendiente ? 'normal' : 'italic', opacity: pendiente ? 0.4 : 1 }}>{texto}</Text>
                        </View>
                        {listo ? <IconoCheck size={22} color={isDark ? '#8FC79F' : '#6FA884'} /> : null}
                        {listo && miTurno && t.id === miTurno.id ? (
                          <TouchableOpacity onPress={cancelarMiLugar} accessibilityLabel="Ya no puedo" style={{ padding: 6, marginLeft: 6 }}>
                            <Feather name="x-circle" size={22} color="#C97A7A" />
                          </TouchableOpacity>
                        ) : null}
                        {puedeAsignar && !listo ? (
                          <TouchableOpacity onPress={() => abrirAsignar(p)} accessibilityLabel="Asignar" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: paleta.fondo, alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="plus" size={20} color={paleta.texto} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Lista para asignar a mano */}
      <Modal visible={eligiendo !== null} transparent animationType="fade" onRequestClose={() => setEligiendo(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>{eligiendo === 0 ? 'Quién preside' : `Posición ${eligiendo}`}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSub }]}>Elige a un hermano elegible. Quedará confirmado y le llegará un aviso.</Text>
            {asignando ? (
              <ActivityIndicator color={colors.textSub} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 360, width: '100%' }}>
                {elegibles.length === 0 ? (
                  <Text style={{ color: colors.textSub, textAlign: 'center', marginVertical: 20 }}>No hay hermanos elegibles disponibles.</Text>
                ) : (
                  elegibles.map((m) => (
                    <TouchableOpacity key={m.nombre_usuario} onPress={() => asignar(m)} style={{ paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <Text style={{ color: colors.textMain, fontSize: 15 }}>{ponerMayusculas(m.nombre_completo || m.nombre_usuario)}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.cardBorder, marginTop: 14, alignSelf: 'stretch' }]} onPress={() => setEligiendo(null)}>
              <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <AlertaPersonalizada {...alerta} />
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
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const { items, vistas } = await obtenerNotificaciones();
      setVistasPrevias(vistas);
      await marcarNotificacionesVistas(items);
      const nuevas = items.filter((n) => n.accion || n.abierta || !vistas.includes(n.clave));
      const yaVistas = items.filter((n) => !n.accion && !n.abierta && vistas.includes(n.clave));
      setSolicitudes([...nuevas, ...yaVistas]);
      setCargando(false);
    })();
  }, []);

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
                <TouchableOpacity key={s.clave} activeOpacity={0.8} onPress={() => navigation.navigate(s.destino ? s.destino.pantalla : 'Tablon', s.destino ? s.destino.params : {})} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 12, opacity: !s.accion && !s.abierta && vistasPrevias.includes(s.clave) ? 0.5 : 1 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 15 }}>{s.mensaje}</Text>
                    <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 2 }}>{s.detalle}</Text>
                    {s.cenaTurno ? (
                      <AccionesCena
                        turno={s.cenaTurno}
                        isDark={isDark}
                        onHecho={(r) => {
                          if (r === 'confirmar') navigation.navigate('Cena');
                          else setSolicitudes((prev) => prev.filter((x) => x.clave !== s.clave));
                        }}
                      />
                    ) : null}
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

  const listaRef = useRef(null);
  const [verArriba, setVerArriba] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const { data } = await supabase.from('maestros').select('*').order('nombre_usuario', { ascending: true });
        setMaestros(data || []);
        setCargando(false);
      })();
    }, []),
  );

  const descargarCSV = () => {
    const encabezados = ['Usuario', 'Nombre completo', 'PIN', 'Celular', 'Rol', 'Elegible Clases de niños', 'Elegible Predicaciones y Clases'];
    const filas = maestros.map((m) => [m.nombre_usuario, m.nombre_completo || '', m.pin_acceso, m.telefono || '', m.rol, m.elegible_clases_ninos ? 'Sí' : 'No', m.elegible_predicaciones ? 'Sí' : 'No']);
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
      <ScrollView ref={listaRef} onScroll={(e) => setVerArriba(e.nativeEvent.contentOffset.y > 700)} scrollEventThrottle={100} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
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
          {!cargando &&
            maestros.map((maestro) => (
              <TouchableOpacity key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => navigation.navigate('DetalleUsuario', { maestro })}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userTextName, { color: colors.textMain }]}>{ponerMayusculas(maestro.nombre_completo || maestro.nombre_usuario)}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textSub} />
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
      {verArriba ? (
        <TouchableOpacity onPress={() => listaRef.current && listaRef.current.scrollTo({ y: 0, animated: true })} accessibilityLabel="Volver arriba" style={{ position: 'absolute', right: 20, bottom: 28, width: 52, height: 52, borderRadius: 26, backgroundColor: PALETA_MENU[isDark ? 'oscuro' : 'claro']['Usuarios'].fondo, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
          <Feather name="arrow-up" size={22} color={PALETA_MENU[isDark ? 'oscuro' : 'claro']['Usuarios'].texto} />
        </TouchableOpacity>
      ) : null}
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
      return setAlerta({ visible: true, titulo: 'Sin número', mensaje: 'Esta persona no tiene un número celular guardado.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#EFBC68' });
    }
    const mensaje = `¡Hola! Aquí tienes tus accesos.\n\n👤 Usuario: ${maestro.nombre_usuario}\n🔑 PIN: ${maestro.pin_acceso}`;
    Linking.openURL(`https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`);
  };

  const copiarInfo = async () => {
    await Clipboard.setStringAsync(`Usuario: ${maestro.nombre_usuario}\nPIN: ${maestro.pin_acceso}`);
    setAlerta({ visible: true, titulo: 'Copiado', mensaje: 'La información se copió al portapapeles.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#7EA0D8' });
  };

  // Dar de baja desde aquí, igual que en el panel (nadie puede darse de baja a sí mismo)
  const confirmarBaja = () => {
    if (maestro.nombre_usuario === usuarioActivoGlobal) return setAlerta({ visible: true, titulo: 'Acción denegada', mensaje: 'No puedes dar de baja tu propia cuenta.', onConfirmar: cerrarAlerta, isDark: isDark });
    setAlerta({
      visible: true,
      titulo: 'Dar de baja',
      mensaje: `¿Seguro que quieres dar de baja a ${ponerMayusculas(maestro.nombre_completo || maestro.nombre_usuario)}? Ya no podrá entrar a la app.`,
      textoConfirmar: 'Dar de baja',
      onCancelar: cerrarAlerta,
      isDark: isDark,
      themeColor: '#C97A7A',
      onConfirmar: async () => {
        cerrarAlerta();
        const { data: resultado, error } = await supabase.functions.invoke('eliminar-maestro', { body: { maestro_id: maestro.id } });
        if (error || resultado?.error) return setTimeout(() => setAlerta({ visible: true, titulo: 'Error', mensaje: resultado?.error || error?.message || 'No se pudo dar de baja.', onConfirmar: cerrarAlerta, isDark: isDark }), 300);
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Admin');
      },
    });
  };

  const recargar = async () => {
    const { data } = await supabase.from('maestros').select('*').eq('id', maestro.id).single();
    if (data) setMaestro(data);
  };

  const guardarEdicion = async (datos) => {
    setMostrarModal(false);
    await supabase
      .from('maestros')
      .update({
        telefono: datos.telefono,
        nombre_completo: datos.nombre_completo,
        elegible_clases_ninos: datos.elegible_clases_ninos,
        elegible_predicaciones: datos.elegible_predicaciones,
        rol: datos.rol,
        equipo: datos.equipo,
        elegible_presidir: datos.elegible_presidir,
        elegible_mesa: datos.elegible_mesa,
      })
      .eq('id', maestro.id);
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
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 4 }}>{maestro.elegible_predicaciones ? '✓' : '✗'} Predicaciones y Clases</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 4 }}>{maestro.elegible_presidir ? '✓' : '✗'} Cena del Señor: presidir</Text>
          <Text style={{ color: colors.textMain, fontSize: 15, marginBottom: 20 }}>{maestro.elegible_mesa ? '✓' : '✗'} Cena del Señor: servir la mesa</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            <BotonChico icono="edit-2" texto="Editar" categoria="Usuarios" isDark={isDark} onPress={() => setMostrarModal(true)} />
            <BotonChico icono="share-2" texto="Compartir" neutro isDark={isDark} onPress={compartirWhatsApp} />
            <BotonChico icono="copy" texto="Copiar" neutro isDark={isDark} onPress={copiarInfo} />
            <BotonChico icono="trash-2" texto="Dar de baja" peligro isDark={isDark} onPress={confirmarBaja} />
          </View>
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
  const [meses, setMeses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [verFuturo] = useState(!!route?.params?.verFuturo);
  const columnas = useColumnas();
  const theme = getThemeColors(grupo, isDark);
  const colors = getColors(isDark);

  // Meses del temario: los que tienen clases asignadas en este grupo (a ti, si eres maestro), desde el mes actual.
  // Si el mes aún no tiene contenido, igual aparece, con sus domingos en blanco.
  useEffect(() => {
    (async () => {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const esAdmin = rolUsuarioActivoGlobal === 'administrador';
      let consulta = supabase.from('clases_asignadas').select('mes_anio, nombre_usuario, coordinador').eq('grupo', grupo).range(0, 4999);
      if (!esAdmin) consulta = consulta.or(`nombre_usuario.ilike.${usuarioActivoGlobal},coordinador.ilike.${usuarioActivoGlobal}`);
      const [{ data: asignadas }, { data: temas }, { data: conContenido }] = await Promise.all([consulta, supabase.from('temas_mensuales').select('*'), supabase.from('clases_detalle').select('tema_id').eq('rango_edad', grupo).range(0, 4999)]);
      // Cada quien ve todos los meses donde tiene clases (como maestro o coordinador).
      // El administrador ve todos los meses programados, desde el mes en curso.
      const yo = (usuarioActivoGlobal || '').toLowerCase();
      const esMia = (r) => (r.nombre_usuario || '').toLowerCase() === yo || (r.coordinador || '').toLowerCase() === yo;
      const lista = (asignadas || []).filter((r) => parsearMesAnio(r.mes_anio) && parsearMesAnio(r.mes_anio) >= inicioMes && (esAdmin || parsearMesAnio(r.mes_anio) <= new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)));
      const etiquetas = new Set((esAdmin ? lista : lista.filter(esMia)).map((r) => r.mes_anio));
      const idsConContenido = new Set((conContenido || []).map((c) => c.tema_id));
      const porMes = {};
      etiquetas.forEach((etq) => {
        const fecha = parsearMesAnio(etq);
        if (!fecha || fecha < inicioMes) return;
        const mesAnio = `${NOMBRES_MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
        const tema = (temas || []).find((t) => (t.mes_anio || '').toLowerCase() === mesAnio.toLowerCase());
        porMes[mesAnio] = { mesAnio, fecha, tema: tema || { id: null, titulo_tema: mesAnio, mes_anio: mesAnio }, conContenido: !!(tema && idsConContenido.has(tema.id)) };
      });
      setMeses(Object.values(porMes).sort((a, b) => a.fecha - b.fecha));
      setCargando(false);
    })();
  }, [grupo, verFuturo]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
        <View style={{ width: '95%', maxWidth: columnas >= 2 ? 1100 : 850, flex: 1, paddingBottom: 20 }}>
          <View style={styles.headerRowSpaceBetween}>
            <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
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
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.main} />
            </View>
          ) : (
            <View style={[styles.listContainer, columnas >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
              {meses.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: '100%' }]}>
                  <Feather name="calendar" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                  <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin meses próximos</Text>
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>Cuando se asignen clases de este grupo, aparecerán aquí.</Text>
                </View>
              ) : (
                meses.map((m) => <TarjetaLista key={m.mesAnio} icono="calendar" titulo={m.mesAnio} subtitulo={m.conContenido ? (m.tema.titulo_tema && m.tema.titulo_tema !== m.mesAnio ? m.tema.titulo_tema : 'Contenido listo') : 'Contenido pendiente'} categoria={grupo} isDark={isDark} ancho={columnas >= 2 ? '48.5%' : '100%'} onPress={() => navigation.navigate('Clases', { tema: m.tema, grupo: grupo })} />)
              )}
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
  const fechaDeClase = (c) => {
    const mes = parsearMesAnio(tema.mes_anio);
    return mes ? domingosDelMes(mes.getFullYear(), mes.getMonth())[c.numero_clase - 1] || null : null;
  };
  // Los maestros solo ven sus clases que aún no pasan; coordinadores y administradores ven todas
  const hoyClases = fechaISO(new Date());
  const yaPaso = (c) => {
    const f = fechaDeClase(c);
    return !!f && f < hoyClases;
  };
  const domingosMes = (() => {
    const m = parsearMesAnio(tema.mes_anio);
    return m ? domingosDelMes(m.getFullYear(), m.getMonth()) : [];
  })();
  // Cada domingo con su clase; si todavía no se sube el contenido, aparece como «Contenido pendiente»
  const clasesDelMes = domingosMes.map((f, i) => clasesReales.find((c) => c.numero_clase === i + 1) || { id: `pendiente-${i + 1}`, numero_clase: i + 1, titulo_clase: `Clase ${i + 1}`, pendiente: true });
  const clasesVisibles = fechasPermitidas ? clasesDelMes.filter((c) => fechasPermitidas.includes(fechaDeClase(c)) && !yaPaso(c)) : clasesDelMes;
  const [filasMes, setFilasMes] = useState([]);
  const [pendientesIds, setPendientesIds] = useState([]);
  const enfocada = useIsFocused();
  <TarjetaLista key={clase.id} icono={clase.pendiente ? 'clock' : 'book-open'} titulo={clase.titulo_clase} subtitulo={fechaBonitaDeClase(clase)} detalle={clase.pendiente ? 'Contenido pendiente' : clase.texto_base ? `Base: ${clase.texto_base}` : null}
  const apoyoPendiente = (c) => {
    const fecha = fechaDeClase(c);
    return filasMes.some((r) => r.fecha === fecha && pendientesIds.includes(r.id));
  };
  const [mapaNombres, setMapaNombres] = useState({});
  useEffect(() => {
    cargarMapaNombres().then(setMapaNombres);
  }, []);
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
      const { data, error } = tema.id ? await supabase.from('clases_detalle').select('*').eq('tema_id', tema.id).eq('rango_edad', grupo).order('numero_clase', { ascending: true }) : { data: [], error: null };
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
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={[styles.headerSoloText, { flex: 1 }]}>
            <Text style={[styles.titleMini, { color: colors.textMain }]}>{tema.titulo_tema.toUpperCase()}</Text>
            <Text style={[styles.subtitle, { color: theme.textDark }]}>
              {tema.mes_anio} • {grupo}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.main} />
          </View>
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
                  <TarjetaLista key={clase.id} numero={clase.numero_clase} titulo={clase.pendiente ? 'Contenido pendiente' : clase.titulo_clase} detalle={!clase.pendiente && clase.texto_base ? `Base: ${clase.texto_base}` : null} asignado={textoAsignado(clase)} etiqueta={yaPaso(clase) ? 'Ya pasó' : apoyoPendiente(clase) ? 'Apoyo pendiente' : null} categoria={grupo} isDark={isDark} ancho={columnas >= 2 ? '48.5%' : '100%'} onPress={() => navigation.navigate('ClaseDetalle', { clase, tema, grupo })} />
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

  function cerrarAlerta() {
    setAlerta({ ...alerta, visible: false });
  }

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
    const aviso = (mensaje) => setAlerta({ visible: true, titulo: 'Aviso', mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    if (!fechaClase) return aviso('No se pudo determinar la fecha de esta clase.');
    if (!asignacion) return aviso('Esta clase todavía no tiene a nadie asignado, así que no se puede pedir apoyo.');
    if (rolUsuarioActivoGlobal !== 'administrador' && asignacion.nombre_usuario.toLowerCase() !== usuarioActivoGlobal.toLowerCase()) return aviso('Solo la persona asignada a esta clase puede pedir apoyo.');
    setMostrarApoyo(true);
  }

  const enviarSolicitudClase = async (opciones = {}) => {
    const { destino = null, tipo = null, fechaIntercambioId = null } = opciones;
    setMostrarApoyo(false);
    const mostrar = (titulo, mensaje) => setTimeout(() => setAlerta({ visible: true, titulo, mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
    const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('clase_asignada_id', asignacion.id).eq('estado', 'Pendiente');
    if (existente && existente.length > 0) return mostrar('Ya existe', 'Ya hay una solicitud de apoyo pendiente para esta clase.');
    const fechaBonita = new Date(fechaClase + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const { error } = await supabase.from('solicitudes_sustitucion').insert([
      {
        mes_anio: asignacion.mes_anio,
        titulo_tema: fechaBonita,
        grupo_clase: grupo,
        maestro_solicitante: asignacion.nombre_usuario,
        clase_asignada_id: asignacion.id,
        fecha_referencia: fechaClase,
        maestro_destino: destino,
        tipo_intercambio: tipo,
        clase_asignada_id_intercambio: fechaIntercambioId,
      },
    ]);
    if (error) mostrar('Error', error.message);
    else mostrar('Enviado', destino ? 'Tu solicitud se envió directamente a esa persona.' : 'Tu solicitud ya aparece en las Solicitudes de Apoyo.');
  };

  function abrirLista() {
    if (!fechaClase) return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'No se pudo determinar la fecha de esta clase.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    setMostrarLista(true);
  }

  // Vista previa de los PDF (actividad e ilustraciones) dentro de la app; desde ahí se pueden descargar
  const [verPdf, setVerPdf] = useState(null);
  function descargarPDF() {
    if (!clase.url_pdf) return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'Esta clase aún no tiene un PDF asignado.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    setVerPdf({ url: clase.url_pdf, titulo: 'Actividad' });
  }

  const [fotoAbierta, setFotoAbierta] = useState(null);
  const columnasFotos = useColumnas();
  const SeccionDeClase = ({ seccion }) => (
    <View style={styles.seccionDetalle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <Text style={[styles.seccionTitulo, { color: theme.textDark, marginBottom: 0 }]}>{seccion.titulo}</Text>
        {seccion.tiempo ? (
          <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: paletaGrupo.fondo }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: paletaGrupo.texto }}>{seccion.tiempo}</Text>
          </View>
        ) : null}
      </View>
      {seccion.texto ? <Text style={[styles.seccionTexto, { color: colors.textMain }]}>{seccion.texto}</Text> : null}
      {Array.isArray(seccion.imagenes) && seccion.imagenes.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 10, marginTop: 12 }}>
          {seccion.imagenes.map((f, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => setFotoAbierta(f)} accessibilityLabel="Ver foto" style={{ width: columnasFotos === 3 ? '23%' : columnasFotos === 2 ? '31%' : '47%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.cardBorder }}>
              <Image source={{ uri: f.url }} style={{ width: '100%', aspectRatio: f.ancho && f.alto ? f.ancho / f.alto : 1 }} resizeMode="contain" />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );

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
        <Text style={[styles.detalleSubtitle, { color: theme.main }]}>
          {fechaClase
            ? (() => {
                const t = new Date(fechaClase + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                return t.charAt(0).toUpperCase() + t.slice(1);
              })()
            : `Clase ${clase.numero_clase}`}{' '}
          • {grupo}
        </Text>
        {clase.texto_base ? <Text style={[styles.detalleBase, { color: colors.textSub }]}>Base bíblica: {clase.texto_base}</Text> : null}
        <TouchableOpacity onPress={abrirLista} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: paletaGrupo.fondo }}>
          <Feather name="check-circle" size={18} color={paletaGrupo.texto} />
          <Text style={{ color: paletaGrupo.texto, fontWeight: '700', fontSize: 14 }}>Tomar lista</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        {clase.pendiente ? (
          <View style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 28, padding: 20, marginBottom: 14 }}>
            <Feather name="clock" size={22} color={theme.textDark} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain, marginTop: 8 }}>Contenido pendiente</Text>
            <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4, lineHeight: 20 }}>El contenido de esta clase todavía no se ha subido. Aun así puedes tomar lista o pedir apoyo.</Text>
          </View>
        ) : null}
        {Array.isArray(clase.secciones) && clase.secciones.length > 0 ? (
          clase.secciones.map((s, i) => <SeccionDeClase key={i} seccion={s} />)
        ) : (
          <>
            <RenderSeccion titulo="Objetivo del Maestro" texto={clase.objetivo} />
            <RenderSeccion titulo="Puntos Clave" texto={clase.puntos_clave} />
            <RenderSeccion titulo="Bienvenida y Rompehielos (15 min)" texto={clase.rompehielos} />
            <RenderSeccion titulo="Introducción (10 min)" texto={clase.introduccion} />
            <RenderSeccion titulo="Historia Bíblica (25 min)" texto={clase.historia} />
            <RenderSeccion titulo="Puntos a Resaltar (15 min)" texto={clase.puntos_resaltar} />
            <RenderSeccion titulo="Versículo a Memorizar (15 min)" texto={clase.versiculo_memoria} />
            <RenderSeccion titulo="Actividad Sugerida (25 min)" texto={clase.actividad_sugerida} />
          </>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <BotonChico icono="life-buoy" texto="Solicitar apoyo" categoria={grupo} isDark={isDark} onPress={abrirApoyo} />
          {clase.url_pdf ? <BotonChico icono="download" texto="Actividad" categoria={grupo} isDark={isDark} onPress={descargarPDF} /> : null}
          {clase.url_ilustraciones ? <BotonChico icono="image" texto="Ilustraciones" categoria={grupo} isDark={isDark} onPress={() => setVerPdf({ url: clase.url_ilustraciones, titulo: 'Ilustraciones' })} /> : null}
        </View>
      </ScrollView>
      <AlertaPersonalizada {...alerta} />
      <ModalSolicitarApoyo visible={mostrarApoyo} tipoItem="clase" item={asignacion} maestrosElegibles={maestrosElegibles} usuarioPropio={usuarioActivoGlobal} isDark={isDark} onCancelar={() => setMostrarApoyo(false)} onConfirmar={enviarSolicitudClase} />
      <VisorPDF url={verPdf && verPdf.url} titulo={verPdf ? verPdf.titulo : ''} onCerrar={() => setVerPdf(null)} isDark={isDark} categoria={grupo} />
      <ModalAsistencia visible={mostrarLista} onCerrar={() => setMostrarLista(false)} fecha={fechaClase} grupo={grupo} isDark={isDark} usuario={usuarioActivoGlobal} />
      <Modal visible={!!fotoAbierta} transparent animationType="fade" onRequestClose={() => setFotoAbierta(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setFotoAbierta(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {fotoAbierta ? <Image source={{ uri: fotoAbierta.url }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /> : null}
          <View style={{ position: 'absolute', top: 36, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: DOMINGOS DE UN GRUPO SIN TEMARIO PROPIO (cuneros y grupos de la tarde)
// ==========================================
function DomingosScreen({ route, navigation }) {
  const grupo = route?.params?.grupo;
  const mes = route?.params?.mes;
  // Si se entró desde la tarjeta de un mes, solo se muestran los domingos de ese mes
  const mesFiltro = (() => {
    const m = parsearMesAnio(mes);
    return m ? fechaISO(m).slice(0, 7) : null;
  })();
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
  useEffect(() => {
    cargarMapaNombres().then(setMapaNombres);
  }, []);
  const nombreDe = (u) => ponerMayusculas(mapaNombres[(u || '').toLowerCase()] || u);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const d = new Date();
        const inicio = fechaISO(new Date(d.getFullYear(), d.getMonth(), 1));
        const { data } = await supabase.from('clases_asignadas').select('id, fecha, nombre_usuario, usuario_original, coordinador').eq('grupo', grupo).gte('fecha', inicio).order('fecha', { ascending: true }).range(0, 999);
        const todas = data || [];
        const mesDe = (r) => r.fecha.slice(0, 7);
        // Meses que coordino: ahí veo todos los domingos del grupo
        const mesesCoordino = new Set(todas.filter((r) => (r.coordinador || '').toLowerCase() === yo).map(mesDe));
        setVerTodo(esAdmin || mesesCoordino.size > 0);
        // Los maestros ven todos sus domingos que aún no pasan, de todos los meses; el administrador ve todos los programados
        const visibles = todas.filter((r) => esAdmin || (r.fecha <= finDeVentana() && (((r.nombre_usuario || '').toLowerCase() === yo && r.fecha >= hoy) || mesesCoordino.has(mesDe(r))))).filter((r) => !mesFiltro || mesDe(r) === mesFiltro);
        setFilas(visibles);
        setCargando(false);
        if (info.repasoDe) {
          const fechas = [...new Set(visibles.map((r) => r.fecha))].slice(0, 12);
          const mapa = {};
          for (const f of fechas) mapa[f] = await clasesDeRepaso(info.repasoDe, f);
          setRepasos(mapa);
        }
      })();
    }, [grupo, mesFiltro]),
  );

  const fechas = [...new Set(filas.map((r) => r.fecha))];
  const fechaBonita = (f) => {
    const t = new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
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
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={[styles.headerSoloText, { flex: 1 }]}>
            <Text style={[styles.titleMini, { color: colors.textMain }]}>{(grupo || '').toUpperCase()}</Text>
            <Text style={[styles.subtitle, { color: theme.textDark }]}>
              {mes ? `${mes} • ` : ''}
              {info.turno} • {info.edades}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.main} />
          </View>
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
  const fechaBonita = (() => {
    const t = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  })();

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
    const aviso = (mensaje) => setAlerta({ visible: true, titulo: 'Aviso', mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main });
    if (!asignacion) return aviso('Este domingo todavía no tiene a nadie asignado, así que no se puede pedir apoyo.');
    if (rolUsuarioActivoGlobal !== 'administrador' && asignacion.nombre_usuario.toLowerCase() !== usuarioActivoGlobal.toLowerCase()) return aviso('Solo la persona asignada a este domingo puede pedir apoyo.');
    setMostrarApoyo(true);
  }

  const enviarSolicitud = async (opciones = {}) => {
    const { destino = null, tipo = null, fechaIntercambioId = null } = opciones;
    setMostrarApoyo(false);
    const mostrar = (titulo, mensaje) => setTimeout(() => setAlerta({ visible: true, titulo, mensaje, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
    const { data: existente } = await supabase.from('solicitudes_sustitucion').select('id').eq('clase_asignada_id', asignacion.id).eq('estado', 'Pendiente');
    if (existente && existente.length > 0) return mostrar('Ya existe', 'Ya hay una solicitud de apoyo pendiente para este domingo.');
    const { error } = await supabase.from('solicitudes_sustitucion').insert([
      {
        mes_anio: asignacion.mes_anio,
        titulo_tema: new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
        grupo_clase: grupo,
        maestro_solicitante: asignacion.nombre_usuario,
        clase_asignada_id: asignacion.id,
        fecha_referencia: fecha,
        maestro_destino: destino,
        tipo_intercambio: tipo,
        clase_asignada_id_intercambio: fechaIntercambioId,
      },
    ]);
    if (error) mostrar('Error', error.message);
    else mostrar('Enviado', destino ? 'Tu solicitud se envió directamente a esa persona.' : 'Tu solicitud ya aparece en las Solicitudes de Apoyo.');
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
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.detalleTitleMain, { color: colors.textMain }]}>{fechaBonita}</Text>
        <Text style={[styles.detalleSubtitle, { color: theme.textDark }]}>
          {grupo} • {info.turno} • {info.edades}
        </Text>
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
          </>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <BotonChico icono="life-buoy" texto="Solicitar apoyo" categoria={grupo} isDark={isDark} onPress={abrirApoyo} />
        </View>
      </ScrollView>
      <AlertaPersonalizada {...alerta} />
      <ModalSolicitarApoyo visible={mostrarApoyo} tipoItem="clase" item={asignacion} maestrosElegibles={maestrosElegibles} usuarioPropio={usuarioActivoGlobal} isDark={isDark} onCancelar={() => setMostrarApoyo(false)} onConfirmar={enviarSolicitud} />
      <ModalAsistencia visible={mostrarLista} onCerrar={() => setMostrarLista(false)} fecha={fecha} grupo={grupo} isDark={isDark} usuario={usuarioActivoGlobal} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: CORITOS (lista completa con buscador y reproductor abajo)
// ==========================================
function CoritosScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const paleta = PALETA_MENU[isDark ? 'oscuro' : 'claro']['Coritos'];
  const rep = useReproductor();
  const [coritos, setCoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [letra, setLetra] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('coritos').select('*').order('titulo', { ascending: true });
      setCoritos(data || []);
      setCargando(false);
    })();
  }, []);

  const visibles = coritos.filter((c) => sinAcentos(c.titulo).includes(sinAcentos(busqueda)));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: 850, flex: 1 }}>
        <View style={[styles.headerRowSpaceBetween, { alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8 }}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 999, paddingHorizontal: 16, marginBottom: 12 }}>
          <Feather name="search" size={18} color={colors.textSub} />
          <TextInput style={{ flex: 1, fontSize: 15, color: colors.inputText, paddingVertical: 12, outlineStyle: 'none' }} placeholder="Buscar corito" placeholderTextColor={colors.textSub} value={busqueda} onChangeText={setBusqueda} />
          {busqueda ? (
            <TouchableOpacity onPress={() => setBusqueda('')} style={{ padding: 4 }} accessibilityLabel="Borrar búsqueda">
              <Feather name="x-circle" size={18} color={colors.textSub} />
            </TouchableOpacity>
          ) : null}
        </View>

        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={paleta.texto} />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 10 }}>
            {visibles.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Feather name="music" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>{coritos.length === 0 ? 'Aún no hay coritos' : 'Sin resultados'}</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>{coritos.length === 0 ? 'Aquí aparecerán los coritos cuando se suban.' : 'Prueba con otra palabra.'}</Text>
              </View>
            ) : (
              visibles.map((c) => <FilaCorito key={c.id} corito={c} rep={rep} lista={visibles} onLetra={setLetra} isDark={isDark} />)
            )}
          </ScrollView>
        )}
        <View style={{ paddingTop: 6, paddingBottom: 12 }}>
          <BarraReproductor rep={rep} isDark={isDark} lista={visibles} onLetra={setLetra} />
        </View>
      </View>
      <ModalLetra corito={letra} onCerrar={() => setLetra(null)} isDark={isDark} />
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
        (data || []).forEach((m) => {
          mapa[m.nombre_usuario.toLowerCase()] = m.nombre_completo;
        });
        setMapaNombres(mapa);
        setMiPerfil((data || []).find((m) => (m.nombre_usuario || '').toLowerCase() === (usuarioActivoGlobal || '').toLowerCase()) || {});
      })();
    }, []),
  );

  const onRefresh = React.useCallback(async () => {
    setRefrescando(true);
    await obtenerSolicitudes();
    setRefrescando(false);
  }, []);

  const nombreBonito = (usuario) => ponerMayusculas(mapaNombres[(usuario || '').toLowerCase()] || usuario);

  function cerrarAlerta() {
    setAlerta({ ...alerta, visible: false });
  }

  async function obtenerSolicitudes() {
    const hoy = fechaISO(new Date());
    let consulta = supabase.from('solicitudes_sustitucion').select('*').order('creado_en', { ascending: false });
    if (soloGrupo) {
      consulta = consulta.eq('grupo_clase', soloGrupo);
    }
    if (excluirGrupo) {
      consulta = consulta.neq('grupo_clase', excluirGrupo);
    }
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
      visible: true,
      titulo: 'Cancelar',
      mensaje: '¿Ya no necesitas el apoyo?',
      isDark: isDark,
      themeColor: theme.main,
      textoConfirmar: 'Sí, cancelar',
      onCancelar: cerrarAlerta,
      onConfirmar: async () => {
        cerrarAlerta();
        await supabase.from('solicitudes_sustitucion').delete().eq('id', solicitudId);
        obtenerSolicitudes();
      },
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
      visible: true,
      titulo: 'Confirmar',
      mensaje: `¿Aceptas apoyar con "${solicitud.titulo_tema}"?`,
      isDark: isDark,
      themeColor: theme.main,
      textoConfirmar: 'Aceptar',
      onCancelar: cerrarAlerta,
      onConfirmar: async () => {
        cerrarAlerta();
        if ((solicitud.maestro_solicitante || '').toLowerCase() === usuarioActivoGlobal.toLowerCase()) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'No puedes aceptar tu propia solicitud.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
          return;
        }
        if (!solicitud.maestro_destino) {
          const { data: lista } = await supabase.rpc('nombres_publicos');
          const yo = (lista || []).find((m) => (m.nombre_usuario || '').toLowerCase() === usuarioActivoGlobal.toLowerCase()) || {};
          const esPred = solicitud.grupo_clase === 'Predicaciones';
          if (!(esPred ? yo.elegible_predicaciones : yo.elegible_clases_ninos)) {
            setTimeout(() => setAlerta({ visible: true, titulo: 'No se puede aceptar', mensaje: esPred ? 'Esta solicitud es solo para personas habilitadas para predicaciones.' : 'Esta solicitud es solo para personas habilitadas para clases de niños.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
            return;
          }
        }
        if (solicitud.programa_servicio_id || solicitud.clase_asignada_id) {
          const esClase = !!solicitud.clase_asignada_id;
          const esIntercambio = solicitud.tipo_intercambio === 'intercambio';
          const idOtro = esClase ? solicitud.clase_asignada_id_intercambio : solicitud.programa_servicio_id_intercambio;
          let fechaOtra = null;
          if (esIntercambio && idOtro) {
            const { data: otro } = await supabase
              .from(esClase ? 'clases_asignadas' : 'programa_servicios')
              .select('fecha')
              .eq('id', idOtro)
              .single();
            fechaOtra = otro ? otro.fecha : null;
          }
          const ignAceptante = esIntercambio && idOtro ? (esClase ? { claseId: idOtro } : { rolId: idOtro }) : {};
          const c1 = await buscarConflictoDia(usuarioActivoGlobal, solicitud.fecha_referencia, ignAceptante);
          if (c1) {
            setTimeout(() => setAlerta({ visible: true, titulo: 'No se puede aceptar', mensaje: `Ya tienes ${c1}.`, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
            return;
          }
          if (fechaOtra) {
            const ignSolicitante = esClase ? { claseId: solicitud.clase_asignada_id } : { rolId: solicitud.programa_servicio_id };
            const c2 = await buscarConflictoDia(solicitud.maestro_solicitante, fechaOtra, ignSolicitante);
            if (c2) {
              setTimeout(() => setAlerta({ visible: true, titulo: 'No se puede aceptar', mensaje: `${nombreBonito(solicitud.maestro_solicitante)} ya tiene ${c2} en la fecha que tomaría con el intercambio.`, onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
              return;
            }
          }
        }
        const { data: tomada, error: error1 } = await supabase.from('solicitudes_sustitucion').update({ estado: 'Cubierta', maestro_suplente: usuarioActivoGlobal }).eq('id', solicitud.id).eq('estado', 'Pendiente').select('id');
        if (!error1 && (!tomada || tomada.length === 0)) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'Ya no está disponible', mensaje: 'Alguien más ya aceptó esta solicitud.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
          obtenerSolicitudes();
          return;
        }
        let error2 = null,
          error3 = null;
        if (solicitud.programa_servicio_id) {
          const r = await supabase
            .from('programa_servicios')
            .update({
              nombre_usuario: usuarioActivoGlobal,
              usuario_original: await titularOriginal('programa_servicios', solicitud.programa_servicio_id, solicitud.maestro_solicitante),
              sustituido_en: new Date().toISOString(),
              estado_confirmacion: 'pendiente',
            })
            .eq('id', solicitud.programa_servicio_id);
          error2 = r.error;
        }
        if (solicitud.tipo_intercambio === 'intercambio' && solicitud.programa_servicio_id_intercambio) {
          const r = await supabase
            .from('programa_servicios')
            .update({
              nombre_usuario: solicitud.maestro_solicitante,
              usuario_original: await titularOriginal('programa_servicios', solicitud.programa_servicio_id_intercambio, usuarioActivoGlobal),
              sustituido_en: new Date().toISOString(),
              estado_confirmacion: 'pendiente',
            })
            .eq('id', solicitud.programa_servicio_id_intercambio);
          error3 = r.error;
        }
        if (solicitud.clase_asignada_id) {
          const r = await supabase
            .from('clases_asignadas')
            .update({ nombre_usuario: usuarioActivoGlobal, usuario_original: await titularOriginal('clases_asignadas', solicitud.clase_asignada_id, solicitud.maestro_solicitante), sustituido_en: new Date().toISOString() })
            .eq('id', solicitud.clase_asignada_id);
          error2 = error2 || r.error;
        }
        if (solicitud.tipo_intercambio === 'intercambio' && solicitud.clase_asignada_id_intercambio) {
          const r = await supabase
            .from('clases_asignadas')
            .update({ nombre_usuario: solicitud.maestro_solicitante, usuario_original: await titularOriginal('clases_asignadas', solicitud.clase_asignada_id_intercambio, usuarioActivoGlobal), sustituido_en: new Date().toISOString() })
            .eq('id', solicitud.clase_asignada_id_intercambio);
          error3 = error3 || r.error;
        }
        const errorReal = error1 || error2 || error3;
        if (errorReal) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo completar: ' + errorReal.message, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
        } else {
          setTimeout(() => setAlerta({ visible: true, titulo: '¡Gracias!', mensaje: 'Has sido asignado a esta clase.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
        }
        obtenerSolicitudes();
      },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: 850, flex: 1, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MenuPrincipal'))} style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
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
        {cargando ? (
          <ActivityIndicator size="large" color={colors.textSub} style={{ marginTop: 50 }} />
        ) : (
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
                  <View
                    key={solicitud.id}
                    onLayout={(e) => {
                      if (solicitudId && solicitud.id === solicitudId && !yaDesplazado.current && scrollRef.current) {
                        yaDesplazado.current = true;
                        scrollRef.current.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 10), animated: true });
                      }
                    }}
                    style={[styles.card, styles.cardLight, { backgroundColor: theme.bgLight, borderColor: solicitud.id === solicitudId ? theme.textDark : 'transparent', borderWidth: solicitud.id === solicitudId ? 2 : 1, opacity: solicitud.estado === 'Cubierta' ? 0.6 : 1 }]}
                  >
                    <View style={styles.textContainer}>
                      <Text style={[styles.topicTitle, { color: colors.textMain }]}>{nombreBonito(solicitud.maestro_solicitante)} pide apoyo</Text>
                      <Text style={[styles.topicSubtitle, { color: theme.textDark, fontWeight: 'bold' }]}>Grupo: {solicitud.grupo_clase}</Text>
                      <Text style={[styles.topicSubtitle, { color: colors.textSub }]}>{solicitud.mes_anio}</Text>
                      <Text style={[styles.topicSubtitle, { color: colors.textMain }]}>{solicitud.titulo_tema}</Text>
                      {solicitud.maestro_destino && (
                        <Text style={[styles.topicSubtitle, { color: colors.textSub, fontStyle: 'italic' }]}>
                          Para: {nombreBonito(solicitud.maestro_destino)}
                          {solicitud.tipo_intercambio === 'intercambio' ? ' • Intercambio de fechas' : ''}
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                      {solicitud.maestro_solicitante === usuarioActivoGlobal && solicitud.estado === 'Pendiente' && (
                        <TouchableOpacity style={[styles.cancelarButton, { borderColor: colors.cardBorder }]} onPress={() => cancelarSolicitud(solicitud.id, solicitud.grupo_clase)}>
                          <Text style={[styles.cancelarButtonText, { color: colors.textSub }]}>Cancelar</Text>
                        </TouchableOpacity>
                      )}
                      {solicitud.estado === 'Pendiente' ? (
                        puedeAceptar(solicitud) ? (
                          <TouchableOpacity style={[styles.aceptarDiscreto, { backgroundColor: theme.main }]} onPress={() => aceptarSustitucion(solicitud)}>
                            <Text style={styles.aceptarDiscretoText}>Aceptar Apoyo</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ color: colors.textSub, fontStyle: 'italic', padding: 8 }}>Esperando apoyo</Text>
                        )
                      ) : (
                        <Text style={{ color: theme.textDark, fontStyle: 'italic', padding: 8, fontWeight: 'bold' }}>Cubierta por {nombreBonito(solicitud.maestro_suplente)}</Text>
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
function AdminScreen({ navigation, route }) {
  const { isDark } = useContext(ThemeContext);
  // Sin "seccion" se ven las 3 tarjetas; con "seccion" se abre esa categoría con sus opciones plegadas
  const seccion = SECCIONES_ADMIN[route?.params?.seccion] ? route.params.seccion : null;
  const columnasAdmin = useColumnas();
  const [opcionAbierta, setOpcionAbierta] = useState(null);
  const alternarOpcion = (id) => setOpcionAbierta((actual) => (actual === id ? null : id));
  const opc = (id) => ({ id, abierta: opcionAbierta === id, onAlternar: alternarOpcion, categoria: seccion ? SECCIONES_ADMIN[seccion].categoria : 'Usuarios', isDark });
  const volverAdmin = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else if (seccion) navigation.replace('Admin');
    else navigation.navigate('MenuPrincipal');
  };
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuarioGenerado, setUsuarioGenerado] = useState('');
  const [pinGenerado, setPinGenerado] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);
  const [elegibleClases, setElegibleClases] = useState(false);
  const [elegiblePredicaciones, setElegiblePredicaciones] = useState(false);
  const [elegiblePresidir, setElegiblePresidir] = useState(false);
  const [elegibleMesa, setElegibleMesa] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [maestros, setMaestros] = useState([]);
  const [equipoSeleccionadoAdmin, setEquipoSeleccionadoAdmin] = useState(null);
  const [maestroEditando, setMaestroEditando] = useState(null);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar', isDark: isDark });
  const colors = getColors(isDark);
  const [telefono, setTelefono] = useState('');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [previaRol, setPreviaRol] = useState([]);
  const [cambiosRol, setCambiosRol] = useState(null);
  const [subiendoRol, setSubiendoRol] = useState(false);
  const [mesBuscarRol, setMesBuscarRol] = useState('');
  const [anioBuscarRol, setAnioBuscarRol] = useState('');
  const [resultadosRol, setResultadosRol] = useState([]);
  const [seleccionadosRol, setSeleccionadosRol] = useState([]);
  const [buscandoRol, setBuscandoRol] = useState(false);
  const [eliminandoRol, setEliminandoRol] = useState(false);
  const [previaClases, setPreviaClases] = useState(null);
  const [subiendoClases, setSubiendoClases] = useState(false);
  const [mesBuscarClases, setMesBuscarClases] = useState('');
  const [anioBuscarClases, setAnioBuscarClases] = useState('');
  const [resultadosClases, setResultadosClases] = useState([]);
  const [seleccionadasClases, setSeleccionadasClases] = useState([]);
  const [buscandoClases, setBuscandoClases] = useState(false);
  const [eliminandoClases, setEliminandoClases] = useState(false);
  const [grupoAsistencia, setGrupoAsistencia] = useState('Todos');
  const [mesAsistencia, setMesAsistencia] = useState('');
  const [descargandoAsistencia, setDescargandoAsistencia] = useState(false);
  useEffect(() => {
    obtenerMaestros();
  }, []);

  function cerrarAlerta() {
    setAlerta({ ...alerta, visible: false });
  }

  const procesarNombre = (texto) => {
    setNombreCompleto(texto);
    // Preserva la ñ/Ñ (se descompone en "n" + tilde con NFD) y solo quita acentos del resto de letras
    const usuarioLimpio = texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, (m) => (m === '\u0303' ? m : ''))
      .normalize('NFC')
      .replace(/\s+/g, '');
    setUsuarioGenerado(usuarioSeguro(usuarioLimpio));
    if (!pinGenerado && texto.length > 0) setPinGenerado(Math.floor(1000 + Math.random() * 9000).toString());
    if (texto.length === 0) setPinGenerado('');
  };

  const generarNuevoPin = () => setPinGenerado(Math.floor(1000 + Math.random() * 9000).toString());

  async function obtenerMaestros() {
    const { data } = await supabase.from('maestros').select('*').order('creado_en', { ascending: false });
    setMaestros(data || []);
  }

  async function registrarMaestro() {
    if (!usuarioGenerado || !pinGenerado) return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'Escribe el nombre del usuario.', onConfirmar: cerrarAlerta, isDark: isDark });
    setGuardando(true);
    const rolFinal = esAdmin ? 'administrador' : 'maestro';
    const equipoFinal = esAdmin ? 'Administradores' : 'Sin equipo';

    const { data: resultado, error } = await supabase.functions.invoke('registrar-maestro', {
      body: { nombre_usuario: usuarioGenerado, pin_acceso: pinGenerado, rol: rolFinal, equipo: equipoFinal, telefono: telefono, nombre_completo: nombreCompleto, elegible_clases_ninos: elegibleClases, elegible_predicaciones: elegiblePredicaciones },
    });

    if (error || resultado?.error) {
      let detalle = resultado?.error || error?.message || 'Error desconocido.';
      if (error && error.context && typeof error.context.json === 'function') {
        try {
          const cuerpo = await error.context.json();
          detalle = cuerpo.error || cuerpo.message || JSON.stringify(cuerpo);
        } catch (e) {}
      }
      if (/already been registered|already registered/i.test(detalle)) detalle = 'Ya existe un usuario con ese nombre. Prueba con otro nombre o agrega un apellido.';
      setAlerta({ visible: true, titulo: 'Error', mensaje: detalle, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      // La Cena del Señor se guarda aparte (la función de alta no conoce estos dos datos)
      if (elegiblePresidir || elegibleMesa) await supabase.from('maestros').update({ elegible_presidir: elegiblePresidir, elegible_mesa: elegibleMesa }).eq('nombre_usuario', usuarioGenerado);
      setAlerta({ visible: true, titulo: '¡Éxito!', mensaje: 'Usuario registrado.', onConfirmar: cerrarAlerta, isDark: isDark });
      setNombreCompleto('');
      setUsuarioGenerado('');
      setPinGenerado('');
      setTelefono('');
      setEsAdmin(false);
      setElegibleClases(false);
      setElegiblePredicaciones(false);
      setElegiblePresidir(false);
      setElegibleMesa(false);
      obtenerMaestros();
    }
    setGuardando(false);
  }

  async function guardarEdicion(datos) {
    setMaestroEditando(null);
    setEquipoSeleccionadoAdmin(null);
    await supabase.from('maestros').update({ telefono: datos.telefono, nombre_completo: datos.nombre_completo, elegible_clases_ninos: datos.elegible_clases_ninos, elegible_predicaciones: datos.elegible_predicaciones, elegible_presidir: datos.elegible_presidir, elegible_mesa: datos.elegible_mesa, rol: datos.rol, equipo: datos.equipo }).eq('id', maestroEditando.id);
    obtenerMaestros();
  }

  async function confirmarEliminacion(maestro) {
    if (maestro.nombre_usuario === usuarioActivoGlobal) {
      return setAlerta({ visible: true, titulo: 'Acción Denegada', mensaje: 'No puedes dar de baja tu propia cuenta.', textoConfirmar: 'Entendido', onConfirmar: cerrarAlerta, isDark: isDark });
    }
    const { data } = await supabase.from('maestros').select('id').eq('equipo', maestro.equipo);
    const cantidadEnEquipo = data ? data.length : 0;
    let mensajeAlerta = `¿Estás seguro de eliminar a ${maestro.nombre_usuario}?`;
    if (maestro.equipo !== 'Sin equipo' && maestro.rol !== 'administrador') {
      mensajeAlerta += `\n\n⚠️ El ${maestro.equipo} tiene ${cantidadEnEquipo} miembro(s).`;
    }

    setAlerta({
      visible: true,
      titulo: 'Dar de baja',
      mensaje: mensajeAlerta,
      textoConfirmar: 'Eliminar',
      onCancelar: cerrarAlerta,
      isDark: isDark,
      onConfirmar: async () => {
        cerrarAlerta();
        setEquipoSeleccionadoAdmin(null);
        const { data: resultado, error } = await supabase.functions.invoke('eliminar-maestro', { body: { maestro_id: maestro.id } });
        if (error || resultado?.error) {
          setAlerta({ visible: true, titulo: 'Error', mensaje: resultado?.error || error?.message || 'No se pudo eliminar.', onConfirmar: cerrarAlerta, isDark: isDark });
        }
        obtenerMaestros();
      },
    });
  }

  const compartirWhatsApp = (usuario, pin, equipo, telefono) => {
    const numeroLimpio = (telefono || '').replace(/\D/g, '');
    if (!numeroLimpio) {
      setAlerta({ visible: true, titulo: 'Sin número', mensaje: 'Esta persona no tiene un número celular guardado.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#EFBC68' });
      return;
    }
    const mensaje = `¡Hola! Aquí tienes tus accesos.\n\n👤 Usuario: ${usuario}\n🔑 PIN: ${pin}`;
    Linking.openURL(`https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`);
  };

  const copiarInfo = async (usuario, pin, equipo) => {
    await Clipboard.setStringAsync(`Usuario: ${usuario}\nPIN: ${pin}`);
    setAlerta({ visible: true, titulo: 'Copiado', mensaje: 'La información se copió al portapapeles.', onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#7EA0D8' });
  };

  // Lee el texto del CSV y lo convierte en una lista de filas
  const parsearCSV = (texto) => {
    // Acepta CSV de Excel o Google Sheets: con coma o punto y coma, y con o sin marca BOM al inicio
    const lineas = texto
      .replace(/^\uFEFF/, '')
      .replace(/\r/g, '')
      .split('\n')
      .filter((l) => l.trim() !== '');
    if (lineas.length < 2) return [];
    const separador = (lineas[0].match(/;/g) || []).length > (lineas[0].match(/,/g) || []).length ? ';' : ',';
    const partir = (l) => l.split(separador).map((v) => v.trim().replace(/^"|"$/g, '').trim());
    const encabezados = partir(lineas[0]).map((h) => h.toLowerCase());
    // Excel a veces cambia la fecha a 03/01/2027: se convierte a 2027-01-03
    const normalizarFecha = (f) => {
      const m = (f || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : f || '';
    };
    // Excel a veces cambia la hora a "18:00" o "6:00:00 p. m.": se deja como "6:00 pm"
    const normalizarHorario = (h) => {
      const m = (h || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:([ap])\.?\s*m\.?)?$/);
      if (!m) return h || '';
      let hora = parseInt(m[1], 10);
      let ampm = m[3] ? `${m[3]}m` : null;
      if (!ampm) {
        ampm = hora >= 12 ? 'pm' : 'am';
        if (hora > 12) hora -= 12;
        if (hora === 0) hora = 12;
      }
      return `${hora}:${m[2]} ${ampm}`;
    };
    return lineas
      .slice(1)
      .map((linea) => {
        const valores = partir(linea);
        const leido = {};
        encabezados.forEach((encabezado, i) => {
          leido[encabezado] = valores[i];
        });
        return { fecha: normalizarFecha(leido.fecha), horario: normalizarHorario(leido.horario), nombre_usuario: usuarioSeguro(leido.nombre_usuario) };
      })
      .filter((fila) => fila.fecha && fila.fecha.trim() !== '');
  };

  // Se activa cuando el admin selecciona el archivo CSV
  const manejarArchivoCSV = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = async (e) => {
      setCambiosRol(null);
      try {
        const filas = parsearCSV(e.target.result);
        const conocidos = new Set(maestros.map((m) => usuarioSeguro(m.nombre_usuario)));
        const faltan = [...new Set(filas.map((f) => f.nombre_usuario).filter((u) => !conocidos.has(u)))];
        if (faltan.length > 0) {
          setPreviaRol([]);
          setAlerta({ visible: true, titulo: 'Revisa los usuarios', mensaje: `Estos usuarios no existen en la app: ${faltan.join(', ')}.\n\nCorrígelos en el archivo (deben ser iguales a los de Administración → Usuarios) y vuelve a subirlo.`, onConfirmar: cerrarAlerta, isDark: isDark });
        } else {
          setPreviaRol(filas);
          setCambiosRol(await compararConRolActual(filas));
        }
      } catch (error) {
        setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo leer el archivo. Revisa que sea un CSV válido.', onConfirmar: cerrarAlerta, isDark: isDark });
      }
    };
    lector.readAsText(archivo);
  };

  // Si los meses del archivo ya tienen rol, calcula qué se agrega, qué se quita y a quién avisar
  const compararConRolActual = async (filas) => {
    const meses = [...new Set(filas.map((f) => f.fecha.slice(0, 7)))].sort();
    if (meses.length === 0) return null;
    const [anioFin, mesFin] = meses[meses.length - 1].split('-').map(Number);
    const actuales = (
      await traerTodo(() =>
        supabase
          .from('programa_servicios')
          .select('id, fecha, horario, nombre_usuario, usuario_original')
          .gte('fecha', `${meses[0]}-01`)
          .lte('fecha', fechaISO(new Date(anioFin, mesFin, 0)))
          .order('id', { ascending: true }),
      )
    ).filter((r) => meses.includes(r.fecha.slice(0, 7)));
    if (actuales.length === 0) return null;
    const mesesConRol = new Set(actuales.map((r) => r.fecha.slice(0, 7)));
    const cambios = compararRol(actuales, filas, (r) => `${r.fecha}|${horaClave(r.horario)}|${titularDe(r)}`, []);
    const hoy = fechaISO(new Date());
    const afectados = [...cambios.agregar.filter((r) => r.fecha >= hoy && mesesConRol.has(r.fecha.slice(0, 7))).map((r) => r.nombre_usuario), ...cambios.quitar.filter((r) => r.fecha >= hoy).flatMap((r) => [r.nombre_usuario, r.usuario_original])];
    return { ...cambios, mesesConRol: [...mesesConRol], afectados: [...new Set(afectados.filter(Boolean).map((u) => u.toLowerCase()))] };
  };

  // Sube a Supabase el rol: si es nuevo lo guarda completo; si ya existía, solo aplica los cambios
  const confirmarCargaRol = async () => {
    setSubiendoRol(true);
    try {
      if (!cambiosRol) {
        const { data: subidas, error } = await supabase.from('programa_servicios').insert(previaRol).select('id');
        if (error) throw error;
        // Avisa a cada persona programada que ya está disponible su rol nuevo
        supabase.functions.invoke('recordatorios', { body: { accion: 'rol-nuevo', ids: (subidas || []).map((r) => r.id) } }).catch((e) => console.error('No se pudo avisar del rol nuevo:', e));
        setAlerta({ visible: true, titulo: '¡Éxito!', mensaje: `Se subieron ${previaRol.length} fechas correctamente.`, onConfirmar: cerrarAlerta, isDark: isDark });
      } else {
        await borrarPorIds(
          'programa_servicios',
          cambiosRol.quitar.map((r) => r.id),
        );
        if (cambiosRol.agregar.length > 0) {
          const { data: subidas, error } = await supabase.from('programa_servicios').insert(cambiosRol.agregar).select('id, fecha');
          if (error) throw error;
          // Las fechas de meses que no tenían rol cuentan como rol nuevo
          const deMesesNuevos = (subidas || []).filter((r) => !cambiosRol.mesesConRol.includes(r.fecha.slice(0, 7))).map((r) => r.id);
          if (deMesesNuevos.length > 0) supabase.functions.invoke('recordatorios', { body: { accion: 'rol-nuevo', ids: deMesesNuevos } }).catch((e) => console.error('No se pudo avisar del rol nuevo:', e));
        }
        avisarRolActualizado(cambiosRol.afectados, 'predicaciones');
        setAlerta({ visible: true, titulo: 'Rol actualizado', mensaje: `Se agregaron ${cambiosRol.agregar.length} y se quitaron ${cambiosRol.quitar.length} fechas. Se avisó a ${cambiosRol.afectados.length} persona(s).`, onConfirmar: cerrarAlerta, isDark: isDark });
      }
      setPreviaRol([]);
      setCambiosRol(null);
    } catch (error) {
      setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo subir el rol: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setSubiendoRol(false);
  };

  // ---- Clases de niños: carga por CSV ----
  const parsearCSVClases = (texto) => {
    const lineas = texto
      .replace(/^\uFEFF/, '')
      .replace(/\r/g, '')
      .split('\n')
      .filter((l) => l.trim() !== '');
    if (lineas.length < 2) return [];
    const separador = (lineas[0].match(/;/g) || []).length > (lineas[0].match(/,/g) || []).length ? ';' : ',';
    const partir = (linea) => {
      const celdas = [];
      let actual = '';
      let entreComillas = false;
      for (const c of linea) {
        if (c === '"') entreComillas = !entreComillas;
        else if (c === separador && !entreComillas) {
          celdas.push(actual.trim());
          actual = '';
        } else actual += c;
      }
      celdas.push(actual.trim());
      return celdas;
    };
    const encabezados = partir(lineas[0]).map(normalizarEncabezado);
    return lineas.slice(1).map((linea) => {
      const valores = partir(linea);
      const fila = {};
      encabezados.forEach((h, i) => {
        fila[h] = valores[i] || '';
      });
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
    maestros.forEach((m) => {
      porUsuario[normalizarUsuario(m.nombre_usuario)] = m;
    });
    const buscarMaestro = (t) => porUsuario[normalizarUsuario(t)];
    const gruposPorPersonaMes = {};

    filasCSV.forEach((fila, idx) => {
      const numero = idx + 2;
      // Excel a veces guarda filas en blanco (solo comas) al final: se ignoran
      if (!Object.values(fila).some((v) => (v || '').trim())) return;
      const fechaMes = parsearMesAnio(fila.mes);
      if (!fechaMes) {
        errores.push(`Fila ${numero}: el mes "${fila.mes || ''}" no se entiende (usa por ejemplo "Octubre 2026").`);
        return;
      }
      const mesAnio = `${NOMBRES_MESES[fechaMes.getMonth()]} ${fechaMes.getFullYear()}`;
      const domingos = domingosDelMes(fechaMes.getFullYear(), fechaMes.getMonth());
      let coordinador = null;
      if (fila.coordinador) {
        const c = buscarMaestro(fila.coordinador);
        if (!c) errores.push(`Fila ${numero}: el coordinador "${fila.coordinador}" no existe como usuario.`);
        else coordinador = c.nombre_usuario;
      }
      GRUPOS_CLASES.forEach((g) => {
        (fila[g.columna] || (g.alias ? fila[g.alias] : '') || '')
          .split(/[\/;|]/)
          .map((n) => n.trim())
          .filter(Boolean)
          .forEach((nombre) => {
            const m = buscarMaestro(nombre);
            if (!m) {
              errores.push(`Fila ${numero}: "${nombre}" (${g.grupo}) no existe como usuario.`);
              return;
            }
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
    // Si algún mes ya tiene rol, no se borra nada: se compara y solo se aplican los cambios
    let cambios = null;
    if (meses.length > 0 && errores.length === 0) {
      const actuales = await traerTodo(() => supabase.from('clases_asignadas').select('id, fecha, grupo, horario, nombre_usuario, usuario_original, coordinador, equipo, mes_anio').in('mes_anio', meses).order('id', { ascending: true }));
      if (actuales.length > 0) {
        const mesesConRol = [...new Set(actuales.map((r) => r.mes_anio))];
        const c = compararRol(actuales, filas, (r) => `${r.fecha}|${r.grupo}|${titularDe(r)}`, ['coordinador', 'equipo']);
        const hoy = fechaISO(new Date());
        const afectados = [...c.agregar.filter((r) => r.fecha >= hoy && mesesConRol.includes(r.mes_anio)).map((r) => r.nombre_usuario), ...c.quitar.filter((r) => r.fecha >= hoy).flatMap((r) => [r.nombre_usuario, r.usuario_original]), ...c.actualizar.filter((u) => u.antes.fecha >= hoy && 'coordinador' in u.cambios).flatMap((u) => [u.antes.coordinador, u.despues.coordinador])];
        cambios = { ...c, mesesConRol, afectados: [...new Set(afectados.filter(Boolean).map((u) => u.toLowerCase()))] };
      }
    }
    return { filas, errores: [...new Set(errores)], avisos: [...new Set(avisos)], meses, personas: new Set(filas.map((f) => f.nombre_usuario)).size, cambios };
  };

  const manejarArchivoClases = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = async (e) => {
      try {
        setPreviaClases(await prepararCargaClases(e.target.result));
      } catch (error) {
        setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo leer el archivo. Revisa que sea un CSV válido.', onConfirmar: cerrarAlerta, isDark: isDark });
      }
    };
    lector.readAsText(archivo);
  };

  const confirmarCargaClases = async () => {
    if (!previaClases || previaClases.errores.length > 0 || previaClases.filas.length === 0) return;
    setSubiendoClases(true);
    const c = previaClases.cambios;
    try {
      if (!c) {
        const { error } = await supabase.from('clases_asignadas').insert(previaClases.filas);
        if (error) throw error;
        setAlerta({ visible: true, titulo: '¡Éxito!', mensaje: `Se guardaron ${previaClases.filas.length} clases de ${previaClases.personas} maestros.`, onConfirmar: cerrarAlerta, isDark: isDark });
      } else {
        await borrarPorIds(
          'clases_asignadas',
          c.quitar.map((r) => r.id),
        );
        // Los cambios iguales (por ejemplo, el nuevo coordinador de un mes) se guardan juntos
        const porCambio = {};
        c.actualizar.forEach((u) => {
          const k = JSON.stringify(u.cambios);
          (porCambio[k] = porCambio[k] || []).push(u.id);
        });
        for (const [k, ids] of Object.entries(porCambio)) {
          for (let i = 0; i < ids.length; i += 200) {
            const { error } = await supabase
              .from('clases_asignadas')
              .update(JSON.parse(k))
              .in('id', ids.slice(i, i + 200));
            if (error) throw error;
          }
        }
        if (c.agregar.length > 0) {
          const { error } = await supabase.from('clases_asignadas').insert(c.agregar);
          if (error) throw error;
        }
        avisarRolActualizado(c.afectados, 'clases');
        setAlerta({ visible: true, titulo: 'Rol actualizado', mensaje: `Se agregaron ${c.agregar.length}, se quitaron ${c.quitar.length} y se actualizaron ${c.actualizar.length} clases. Se avisó a ${c.afectados.length} persona(s).`, onConfirmar: cerrarAlerta, isDark: isDark });
      }
      setPreviaClases(null);
    } catch (error) {
      setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudieron subir las clases: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setSubiendoClases(false);
  };

  const buscarClases = async () => {
    const mesNum = parseInt(mesBuscarClases);
    const anioNum = parseInt(anioBuscarClases);
    if (!mesNum || mesNum < 1 || mesNum > 12 || !anioNum) {
      return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'Escribe un mes (1-12) y un año válidos.', onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setBuscandoClases(true);
    const desde = fechaISO(new Date(anioNum, mesNum - 1, 1));
    const hasta = fechaISO(new Date(anioNum, mesNum, 0));
    const { data, error } = await supabase.from('clases_asignadas').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: true }).order('grupo', { ascending: true }).range(0, 999);
    setBuscandoClases(false);
    if (error) {
      return setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo buscar: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setResultadosClases(data || []);
    setSeleccionadasClases([]);
  };

  const toggleSeleccionClase = (id) => {
    setSeleccionadasClases((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const seleccionarTodoClases = () => {
    setSeleccionadasClases(seleccionadasClases.length === resultadosClases.length ? [] : resultadosClases.map((r) => r.id));
  };

  const confirmarEliminarSeleccionadasClases = () => {
    if (seleccionadasClases.length === 0) return;
    setAlerta({
      visible: true,
      titulo: 'Eliminar clases',
      mensaje: `¿Eliminar ${seleccionadasClases.length} clase(s)? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      onCancelar: cerrarAlerta,
      isDark: isDark,
      themeColor: '#C97A7A',
      onConfirmar: async () => {
        cerrarAlerta();
        setEliminandoClases(true);
        const { data, error } = await supabase.from('clases_asignadas').delete().in('id', seleccionadasClases).select('id');
        setEliminandoClases(false);
        if (error) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo eliminar: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
          return;
        }
        const idsBorrados = (data || []).map((r) => r.id);
        const hoyBorrado = fechaISO(new Date());
        avisarRolActualizado(
          resultadosClases.filter((r) => idsBorrados.includes(r.id) && r.fecha >= hoyBorrado).flatMap((r) => [r.nombre_usuario, r.usuario_original]),
          'clases',
        );
        setResultadosClases((prev) => prev.filter((r) => !idsBorrados.includes(r.id)));
        setSeleccionadasClases([]);
        if (idsBorrados.length < seleccionadasClases.length) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'No se borraron todas', mensaje: `Se eliminaron ${idsBorrados.length} de ${seleccionadasClases.length}. Las demás probablemente están bloqueadas por una regla de seguridad (RLS) en Supabase.`, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
        }
      },
    });
  };

  const descargarAsistenciaCSV = async () => {
    let desde = null;
    let hasta = null;
    if (mesAsistencia.trim()) {
      const fechaMes = parsearMesAnio(mesAsistencia);
      if (!fechaMes) {
        return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'Escribe el mes así: "Enero 2027", o déjalo vacío para descargar todo.', onConfirmar: cerrarAlerta, isDark: isDark });
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
        return setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo descargar: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
      }
      filas.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    setDescargandoAsistencia(false);
    if (filas.length === 0) {
      return setAlerta({ visible: true, titulo: 'Sin datos', mensaje: 'No hay asistencia registrada con ese filtro.', onConfirmar: cerrarAlerta, isDark: isDark });
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

  async function buscarRol() {
    const mesNum = parseInt(mesBuscarRol);
    const anioNum = parseInt(anioBuscarRol);
    if (!mesNum || mesNum < 1 || mesNum > 12 || !anioNum) {
      return setAlerta({ visible: true, titulo: 'Aviso', mensaje: 'Escribe un mes (1-12) y un año válidos.', onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setBuscandoRol(true);
    const desde = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
    const hasta = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    const { data, error } = await supabase.from('programa_servicios').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: true });
    setBuscandoRol(false);
    if (error) {
      return setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo buscar: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    }
    setResultadosRol(data || []);
    setSeleccionadosRol([]);
  }

  function toggleSeleccionRol(id) {
    setSeleccionadosRol((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function seleccionarTodoRol() {
    setSeleccionadosRol(seleccionadosRol.length === resultadosRol.length ? [] : resultadosRol.map((r) => r.id));
  }

  function confirmarEliminarSeleccionadosRol() {
    if (seleccionadosRol.length === 0) return;
    setAlerta({
      visible: true,
      titulo: 'Eliminar fechas',
      mensaje: `¿Eliminar ${seleccionadosRol.length} fecha(s) del rol? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      onCancelar: cerrarAlerta,
      isDark: isDark,
      themeColor: '#C97A7A',
      onConfirmar: async () => {
        cerrarAlerta();
        setEliminandoRol(true);
        const { data, error } = await supabase.from('programa_servicios').delete().in('id', seleccionadosRol).select('id');
        setEliminandoRol(false);
        if (error) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'Error', mensaje: 'No se pudo eliminar: ' + error.message, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
          return;
        }
        const idsBorrados = (data || []).map((r) => r.id);
        const hoyBorrado = fechaISO(new Date());
        avisarRolActualizado(
          resultadosRol.filter((r) => idsBorrados.includes(r.id) && r.fecha >= hoyBorrado).flatMap((r) => [r.nombre_usuario, r.usuario_original]),
          'predicaciones',
        );
        setResultadosRol((prev) => prev.filter((r) => !idsBorrados.includes(r.id)));
        setSeleccionadosRol([]);
        if (idsBorrados.length < seleccionadosRol.length) {
          setTimeout(() => setAlerta({ visible: true, titulo: 'No se borraron todas', mensaje: `Se eliminaron ${idsBorrados.length} de ${seleccionadosRol.length}. Las demás probablemente están bloqueadas por una regla de seguridad (RLS) en Supabase — parece limitarse a fechas pasadas.`, onConfirmar: cerrarAlerta, isDark: isDark }), 500);
        }
      },
    });
  }

  const maestrosPorEquipo = maestros.reduce((acc, maestro) => {
    let equipo = maestro.equipo || 'Sin equipo';
    if (maestro.rol === 'administrador') equipo = 'Administradores';
    if (!acc[equipo]) acc[equipo] = [];
    acc[equipo].push(maestro);
    return acc;
  }, {});

  const listaEquipos = Object.keys(maestrosPorEquipo)
    .filter((e) => e === 'Administradores')
    .sort((a, b) => {
      if (a === 'Administradores') return -1;
      if (b === 'Administradores') return 1;
      return a.localeCompare(b);
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, width: '100%', maxWidth: !seccion && columnasAdmin >= 2 ? 1100 : 850, alignSelf: 'center', paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 15, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={volverAdmin} style={{ padding: 8, marginLeft: -8 }}>
              <Feather name="arrow-left" size={22} color={colors.textSub} />
            </TouchableOpacity>
            <View style={{ marginLeft: 4, flex: 1 }}>
              <Text style={[styles.title, { color: colors.textMain }]}>{seccion ? SECCIONES_ADMIN[seccion].titulo : 'Administración'}</Text>
              {seccion ? <Text style={[styles.subtitle, { color: colors.textSub }]}>{SECCIONES_ADMIN[seccion].subtitulo}</Text> : null}
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipal')}>
            <Image source={isDark ? require('./logo-white.png') : require('./logo-black.png')} style={{ width: 50, height: 36, resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>

        {!seccion && (
          <View style={[styles.gruposContainer, columnasAdmin >= 2 && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            {Object.keys(SECCIONES_ADMIN).map((clave, i, todas) => (
              <TarjetaMenu key={clave} icono={SECCIONES_ADMIN[clave].icono} titulo={SECCIONES_ADMIN[clave].titulo} subtitulo={SECCIONES_ADMIN[clave].subtitulo} categoria={SECCIONES_ADMIN[clave].categoria} isDark={isDark} columnas={columnasAdmin} esUltima={i === todas.length - 1} total={todas.length} onPress={() => navigation.push('Admin', { seccion: clave })} />
            ))}
          </View>
        )}

        {seccion === 'usuarios' && (
          <>
            <OpcionAdmin {...opc('alta')} icono="user-plus" titulo="Dar de alta a un usuario" subtitulo="Crea su usuario y PIN">
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
                <Switch trackColor={{ false: colors.cardBorder, true: '#EFBC68' }} thumbColor={'#FFFFFF'} onValueChange={setEsAdmin} value={esAdmin} />
              </View>

              <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Clases de niños</Text>
                <Switch trackColor={{ false: colors.cardBorder, true: '#5FA8A0' }} thumbColor={'#FFFFFF'} onValueChange={setElegibleClases} value={elegibleClases} />
              </View>

              <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={[styles.label, { color: colors.textSub }]}>Elegible: Predicaciones y Clases</Text>
                <Switch trackColor={{ false: colors.cardBorder, true: '#7EA0D8' }} thumbColor={'#FFFFFF'} onValueChange={setElegiblePredicaciones} value={elegiblePredicaciones} />
              </View>

              <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={[styles.label, { color: colors.textSub }]}>Cena del Señor: presidir</Text>
                <Switch trackColor={{ false: colors.cardBorder, true: '#B98E8E' }} thumbColor={'#FFFFFF'} onValueChange={setElegiblePresidir} value={elegiblePresidir} />
              </View>

              <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={[styles.label, { color: colors.textSub }]}>Cena del Señor: servir la mesa</Text>
                <Switch trackColor={{ false: colors.cardBorder, true: '#B98E8E' }} thumbColor={'#FFFFFF'} onValueChange={setElegibleMesa} value={elegibleMesa} />
              </View>

              {usuarioGenerado !== '' && (
                <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Accesos que se crearán:</Text>
                  <View style={styles.autoGenRow}>
                    <Text style={[styles.autoGenLabel, { color: colors.textSub }]}>Usuario:</Text>
                    <TextInput style={[styles.autoGenInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} value={usuarioGenerado} onChangeText={(t) => setUsuarioGenerado(usuarioSeguro(t))} />
                  </View>
                  <View style={styles.autoGenRow}>
                    <Text style={[styles.autoGenLabel, { color: colors.textSub }]}>PIN (4 dígitos):</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <TextInput style={[styles.autoGenInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, flex: 1 }]} value={pinGenerado} onChangeText={setPinGenerado} keyboardType="numeric" maxLength={4} />
                      <TouchableOpacity onPress={generarNuevoPin} style={{ padding: 10 }}>
                        <Feather name="refresh-cw" size={18} color={colors.textSub} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={registrarMaestro}>
                {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar</Text>}
              </TouchableOpacity>
            </OpcionAdmin>
            <OpcionAdmin {...opc('buscarUsuarios')} icono="search" titulo="Buscar usuarios" subtitulo="Editar, compartir accesos y ver administradores">
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 15 }]} placeholder="Buscar usuario por nombre..." placeholderTextColor={colors.textSub} value={busquedaUsuario} onChangeText={setBusquedaUsuario} />

              {busquedaUsuario.trim() === '' && (
                <TouchableOpacity style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 15 }]} onPress={() => navigation.navigate('TodosUsuarios')}>
                  <Feather name="users" size={24} color={colors.textSub} />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>Todos los usuarios</Text>
                    <Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestros.length} en total</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textSub} />
                </TouchableOpacity>
              )}

              {busquedaUsuario.trim() !== '' ? (
                <View>
                  {maestros
                    .filter((m) => m.nombre_usuario.toLowerCase().includes(busquedaUsuario.trim().toLowerCase()))
                    .map((maestro) => (
                      <View key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('DetalleUsuario', { maestro })}>
                          <Text style={[styles.userTextName, { color: colors.textMain }]}>
                            {maestro.nombre_usuario} {maestro.nombre_usuario === usuarioActivoGlobal && '(Tú)'}
                          </Text>
                          <Text style={[styles.userTextPin, { color: colors.textSub }]}>PIN: {maestro.pin_acceso}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirWhatsApp(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo, maestro.telefono)}>
                          <Feather name="share-2" size={18} color={colors.textSub} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnGray} onPress={() => copiarInfo(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo)}>
                          <Feather name="copy" size={18} color={colors.textSub} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}>
                          <Feather name="edit-2" size={18} color={colors.textSub} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}>
                          <Feather name="trash-2" size={18} color="#FFB7A1" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  <TouchableOpacity style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 5, marginBottom: 15 }]} onPress={() => navigation.navigate('TodosUsuarios')}>
                    <Feather name="users" size={24} color={colors.textSub} />
                    <View style={{ marginLeft: 15, flex: 1 }}>
                      <Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>Todos los usuarios</Text>
                      <Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestros.length} en total</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
              ) : !equipoSeleccionadoAdmin ? (
                <View>
                  <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Toca la tarjeta para ver a los administradores.</Text>
                  {listaEquipos.map((equipo, index) => (
                    <TouchableOpacity key={index} style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => setEquipoSeleccionadoAdmin(equipo)}>
                      {equipo === 'Administradores' ? <Feather name="shield" size={24} color={colors.textSub} /> : <IconoGrupoGrande size={24} color={colors.textSub} />}
                      <View style={{ marginLeft: 15, flex: 1 }}>
                        <Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>{equipo}</Text>
                        <Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestrosPorEquipo[equipo].length} miembro(s)</Text>
                      </View>
                      <Feather name="chevron-right" size={20} color={colors.textSub} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View>
                  <TouchableOpacity style={styles.backToEquiposBtn} onPress={() => setEquipoSeleccionadoAdmin(null)}>
                    <Feather name="arrow-left" size={18} color={colors.textSub} />
                    <Text style={[styles.backToEquiposText, { color: colors.textSub }]}>Volver</Text>
                  </TouchableOpacity>
                  <Text style={[styles.topicTitle, { color: '#EFBC68', marginTop: 10 }]}>{equipoSeleccionadoAdmin}</Text>
                  {(maestrosPorEquipo[equipoSeleccionadoAdmin] || []).map((maestro) => (
                    <View key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userTextName, { color: colors.textMain }]}>
                          {maestro.nombre_completo || maestro.nombre_usuario} {maestro.nombre_usuario === usuarioActivoGlobal && '(Tú)'}
                        </Text>
                        <Text style={[styles.userTextPin, { color: colors.textSub }]}>PIN: {maestro.pin_acceso}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirWhatsApp(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo, maestro.telefono)}>
                        <Feather name="share-2" size={18} color={colors.textSub} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnGray} onPress={() => copiarInfo(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo)}>
                        <Feather name="copy" size={18} color={colors.textSub} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}>
                        <Feather name="edit-2" size={18} color={colors.textSub} />
                      </TouchableOpacity>{' '}
                      <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}>
                        <Feather name="trash-2" size={18} color="#FFB7A1" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </OpcionAdmin>
          </>
        )}

        {seccion === 'predicaciones' && (
          <>
            <OpcionAdmin {...opc('subirRol')} icono="upload" titulo="Subir o actualizar rol" subtitulo="Archivo CSV con las fechas del periodo">
              <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Sube el archivo CSV con las fechas del periodo. Si esos meses ya tienen rol, no se borra nada: solo se aplican los cambios y se avisa a quienes les cambió algo.</Text>

              {Platform.OS === 'web' && <SelectorArchivo isDark={isDark} onArchivo={manejarArchivoCSV} etiqueta="Elegir CSV del Rol" />}

              {previaRol.length > 0 && cambiosRol && (
                <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Actualización del rol</Text>
                  {cambiosRol.agregar.length + cambiosRol.quitar.length === 0 ? (
                    <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 4 }}>El archivo es igual al rol que ya está cargado. No hay nada que actualizar.</Text>
                  ) : (
                    <>
                      <Text style={{ color: colors.textMain, fontSize: 13, marginTop: 4 }}>
                        Se agregan {cambiosRol.agregar.length} y se quitan {cambiosRol.quitar.length} fechas. Las demás se quedan igual (con su confirmación).
                      </Text>
                      {cambiosRol.quitar.slice(0, 6).map((r) => (
                        <Text key={'q' + r.id} style={{ color: '#C97A7A', fontSize: 12, marginTop: 4 }}>
                          – {r.fecha} • {r.horario} • {r.nombre_usuario}
                        </Text>
                      ))}
                      {cambiosRol.agregar.slice(0, 6).map((r, i) => (
                        <Text key={'a' + i} style={{ color: '#6FA884', fontSize: 12, marginTop: 4 }}>
                          + {r.fecha} • {r.horario} • {r.nombre_usuario}
                        </Text>
                      ))}
                      <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 8 }}>{cambiosRol.afectados.length > 0 ? `Se avisará a ${cambiosRol.afectados.length} persona(s): ${cambiosRol.afectados.slice(0, 8).join(', ')}${cambiosRol.afectados.length > 8 ? '…' : ''}` : 'Los cambios son de fechas que ya pasaron: no se avisará a nadie.'}</Text>
                      <TouchableOpacity style={[styles.primaryButton, { marginTop: 15 }]} onPress={confirmarCargaRol}>
                        {subiendoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Aplicar cambios</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              {previaRol.length > 0 && !cambiosRol && (
                <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Se van a subir {previaRol.length} fechas:</Text>
                  {previaRol.slice(0, 5).map((fila, index) => (
                    <Text key={index} style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>
                      {fila.fecha} • {fila.horario} • {calcularTipo(fila.fecha, fila.horario)} • {fila.nombre_usuario}
                    </Text>
                  ))}
                  {previaRol.length > 5 && <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>...y {previaRol.length - 5} más</Text>}
                  <TouchableOpacity style={[styles.primaryButton, { marginTop: 15 }]} onPress={confirmarCargaRol}>
                    {subiendoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Confirmar y subir</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </OpcionAdmin>
            <OpcionAdmin {...opc('borrarRol')} icono="search" titulo="Buscar y borrar fechas" subtitulo="Para quitar fechas sueltas (se avisa a quien la tenía)">
              <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Para quitar fechas sueltas. Si quieres corregir todo un rol, mejor vuelve a subir el archivo en «Subir o actualizar rol».</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Mes (1-12)" placeholderTextColor={colors.textSub} value={mesBuscarRol} onChangeText={(t) => setMesBuscarRol(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={2} />
                <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Año (ej. 2026)" placeholderTextColor={colors.textSub} value={anioBuscarRol} onChangeText={(t) => setAnioBuscarRol(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} />
              </View>
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={buscarRol}>
                {buscandoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Buscar</Text>}
              </TouchableOpacity>

              {resultadosRol.length > 0 && (
                <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 15 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>{resultadosRol.length} fecha(s) encontradas</Text>
                    <TouchableOpacity onPress={seleccionarTodoRol}>
                      <Text style={{ color: '#7EA0D8', fontSize: 12, fontWeight: '600' }}>{seleccionadosRol.length === resultadosRol.length ? 'Quitar selección' : 'Seleccionar todo'}</Text>
                    </TouchableOpacity>
                  </View>
                  {resultadosRol.map((item) => (
                    <TouchableOpacity key={item.id} onPress={() => toggleSeleccionRol(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <Feather name={seleccionadosRol.includes(item.id) ? 'check-square' : 'square'} size={18} color={seleccionadosRol.includes(item.id) ? '#7EA0D8' : colors.textSub} />
                      <Text style={{ color: colors.textMain, fontSize: 13, marginLeft: 10, flex: 1 }}>
                        {item.fecha} • {item.horario} • {item.nombre_usuario}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.primaryButton, { marginTop: 15, backgroundColor: '#C97A7A' }]} onPress={confirmarEliminarSeleccionadosRol} disabled={seleccionadosRol.length === 0}>
                    {eliminandoRol ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Eliminar seleccionados ({seleccionadosRol.length})</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </OpcionAdmin>
          </>
        )}

        {seccion === 'clases' && (
          <>
            <OpcionAdmin {...opc('contenidoClases')} icono="file-text" titulo="Subir contenido de clases" subtitulo="Word con la clase y PDF de actividad e ilustraciones">
              <SubirContenidoClases isDark={isDark} />
            </OpcionAdmin>
            <OpcionAdmin {...opc('subirClases')} icono="upload" titulo="Subir o actualizar rol de clases" subtitulo="Archivo CSV con equipos, coordinadores y grupos">
              <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Sube el CSV con equipo, mes, coordinador y grupos. Se crea una clase por cada domingo del mes. Si esos meses ya tienen rol, no se borra nada: solo se aplican los cambios y se avisa a quienes les cambió algo.</Text>

              {Platform.OS === 'web' && <SelectorArchivo isDark={isDark} onArchivo={manejarArchivoClases} etiqueta="Elegir CSV de clases" />}

              {previaClases && (
                <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  {previaClases.errores.length > 0 ? (
                    <>
                      <Text style={[styles.autoGenTitle, { color: '#C97A7A' }]}>Corrige esto antes de subir:</Text>
                      {previaClases.errores.map((t, i) => (
                        <Text key={i} style={{ color: '#C97A7A', fontSize: 12, marginTop: 4 }}>
                          • {t}
                        </Text>
                      ))}
                    </>
                  ) : previaClases.cambios ? (
                    <>
                      <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Actualización del rol de {previaClases.cambios.mesesConRol.join(', ')}</Text>
                      {previaClases.cambios.agregar.length + previaClases.cambios.quitar.length + previaClases.cambios.actualizar.length === 0 ? (
                        <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 4 }}>El archivo es igual al rol que ya está cargado. No hay nada que actualizar.</Text>
                      ) : (
                        <>
                          <Text style={{ color: colors.textMain, fontSize: 13, marginTop: 4 }}>
                            Se agregan {previaClases.cambios.agregar.length} y se quitan {previaClases.cambios.quitar.length} clases. Lo demás se queda igual (incluso quién cubre a quién).
                          </Text>
                          {previaClases.cambios.quitar.slice(0, 6).map((r) => (
                            <Text key={'q' + r.id} style={{ color: '#C97A7A', fontSize: 12, marginTop: 4 }}>
                              – {r.fecha} • {r.grupo} • {r.nombre_usuario}
                            </Text>
                          ))}
                          {previaClases.cambios.agregar.slice(0, 6).map((r, i) => (
                            <Text key={'a' + i} style={{ color: '#6FA884', fontSize: 12, marginTop: 4 }}>
                              + {r.fecha} • {r.grupo} • {r.nombre_usuario}
                            </Text>
                          ))}
                          {[...new Map(previaClases.cambios.actualizar.filter((u) => 'coordinador' in u.cambios).map((u) => [u.antes.mes_anio, u])).values()].map((u) => (
                            <Text key={'u' + u.id} style={{ color: '#C9A227', fontSize: 12, marginTop: 4 }}>
                              ~ {u.antes.mes_anio}: nuevo coordinador {u.despues.coordinador || '—'} (antes {u.antes.coordinador || '—'})
                            </Text>
                          ))}
                          <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 8 }}>{previaClases.cambios.afectados.length > 0 ? `Se avisará a ${previaClases.cambios.afectados.length} persona(s): ${previaClases.cambios.afectados.slice(0, 8).join(', ')}${previaClases.cambios.afectados.length > 8 ? '…' : ''}` : 'Los cambios son de fechas que ya pasaron: no se avisará a nadie.'}</Text>
                        </>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>
                      Se van a crear {previaClases.filas.length} clases para {previaClases.personas} maestros en {previaClases.meses.join(', ')}:
                    </Text>
                  )}
                  {previaClases.avisos.length > 0 && (
                    <>
                      <Text style={[styles.autoGenTitle, { color: '#C9A227', marginTop: 10 }]}>Avisos (no impiden subir):</Text>
                      {previaClases.avisos.map((t, i) => (
                        <Text key={i} style={{ color: '#C9A227', fontSize: 12, marginTop: 4 }}>
                          • {t}
                        </Text>
                      ))}
                    </>
                  )}
                  {previaClases.errores.length === 0 &&
                    !previaClases.cambios &&
                    previaClases.filas.slice(0, 5).map((f, i) => (
                      <Text key={i} style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>
                        {f.fecha} • {f.grupo} • {f.nombre_usuario}
                      </Text>
                    ))}
                  {previaClases.errores.length === 0 && !previaClases.cambios && previaClases.filas.length > 5 && <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 4 }}>...y {previaClases.filas.length - 5} más</Text>}
                  {previaClases.errores.length === 0 && (!previaClases.cambios || previaClases.cambios.agregar.length + previaClases.cambios.quitar.length + previaClases.cambios.actualizar.length > 0) && (
                    <TouchableOpacity style={[styles.primaryButton, { marginTop: 15 }]} onPress={confirmarCargaClases}>
                      {subiendoClases ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{previaClases.cambios ? 'Aplicar cambios' : 'Confirmar y subir'}</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </OpcionAdmin>
            <OpcionAdmin {...opc('borrarClases')} icono="search" titulo="Buscar y borrar clases" subtitulo="Para quitar clases sueltas (se avisa a quien la tenía)">
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Mes (1-12)" placeholderTextColor={colors.textSub} value={mesBuscarClases} onChangeText={(t) => setMesBuscarClases(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={2} />
                <TextInput style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Año (ej. 2027)" placeholderTextColor={colors.textSub} value={anioBuscarClases} onChangeText={(t) => setAnioBuscarClases(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} />
              </View>
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={buscarClases}>
                {buscandoClases ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Buscar</Text>}
              </TouchableOpacity>

              {resultadosClases.length > 0 && (
                <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 15 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>{resultadosClases.length} clase(s) encontradas</Text>
                    <TouchableOpacity onPress={seleccionarTodoClases}>
                      <Text style={{ color: '#7EA0D8', fontSize: 12, fontWeight: '600' }}>{seleccionadasClases.length === resultadosClases.length ? 'Quitar selección' : 'Seleccionar todo'}</Text>
                    </TouchableOpacity>
                  </View>
                  {resultadosClases.map((item) => (
                    <TouchableOpacity key={item.id} onPress={() => toggleSeleccionClase(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <Feather name={seleccionadasClases.includes(item.id) ? 'check-square' : 'square'} size={18} color={seleccionadasClases.includes(item.id) ? '#7EA0D8' : colors.textSub} />
                      <Text style={{ color: colors.textMain, fontSize: 13, marginLeft: 10, flex: 1 }}>
                        {item.fecha} • {item.grupo} • {item.nombre_usuario}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.primaryButton, { marginTop: 15, backgroundColor: '#C97A7A' }]} onPress={confirmarEliminarSeleccionadasClases} disabled={seleccionadasClases.length === 0}>
                    {eliminandoClases ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Eliminar seleccionadas ({seleccionadasClases.length})</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </OpcionAdmin>
            <OpcionAdmin {...opc('asistencia')} icono="download" titulo="Descargar asistencia" subtitulo="En CSV, de un grupo o de todos juntos">
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
                {descargandoAsistencia ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="download" size={16} color="#FFFFFF" />
                    <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Descargar CSV</Text>
                  </>
                )}
              </TouchableOpacity>
            </OpcionAdmin>
            <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.5, color: colors.textSub, marginTop: 10, marginBottom: 10, marginLeft: 6 }}>Coritos</Text>
            <OpcionAdmin {...opc('nuevoCorito')} icono="music" titulo="Agregar corito" subtitulo="Audio, letra y grupos">
              <FormCorito isDark={isDark} onGuardado={() => setAlerta({ visible: true, titulo: 'Corito guardado', mensaje: 'Ya aparece en la sección Coritos.', textoConfirmar: 'Aceptar', onConfirmar: cerrarAlerta, isDark })} />
            </OpcionAdmin>
            <OpcionAdmin {...opc('editarCoritos')} icono="edit-3" titulo="Editar o borrar coritos" subtitulo="Corrige título, letra, grupos o audio">
              <ListaCoritosAdmin isDark={isDark} />
            </OpcionAdmin>
          </>
        )}
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
    try {
      return Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage.getItem('modo_oscuro') === '1';
    } catch (e) {
      return false;
    }
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
      // Barra de desplazamiento delgada y redondeada, clara u oscura según el tema (se nota en PC)
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      let estiloBarra = document.getElementById('estilo-barra');
      if (!estiloBarra) {
        estiloBarra = document.createElement('style');
        estiloBarra.id = 'estilo-barra';
        document.head.appendChild(estiloBarra);
      }
      const pulgar = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
      const pulgarEncima = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)';
      estiloBarra.textContent = `
        * { scrollbar-width: thin; scrollbar-color: ${pulgar} transparent; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${pulgar}; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: ${pulgarEncima}; }
        ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
      `;
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase.from('maestros').select('*').eq('user_id', session.user.id).single();
          if (data) {
            usuarioActivoGlobal = data.nombre_usuario;
            rolUsuarioActivoGlobal = data.rol;
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
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MenuPrincipal" component={MenuPrincipalScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Grupos" component={GruposScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VistaAdmin" component={VistaAdminScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MiRol" component={MiRolScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Roles" component={RolesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Cena" component={CenaScreen} options={{ headerShown: false }} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : Platform.OS === 'ios' ? 40 : 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSoloText: { paddingBottom: 10, paddingTop: 5 },
  headerRowSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 5, paddingBottom: 10 },
  title: { fontSize: 22, letterSpacing: 1, fontWeight: 'bold', marginRight: 10 },
  titleMini: { fontSize: 18, letterSpacing: 1.5, fontFamily: 'serif' },
  subtitle: { fontSize: 14, marginTop: 5 },

  gruposContainer: { paddingVertical: 10, gap: 16 },

  listContainer: { width: '100%' },
  card: { borderRadius: 30, padding: 22 },
  cardLight: { borderWidth: 1, marginBottom: 16 },
  textContainer: { flex: 1, paddingRight: 10 },
  topicTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  topicSubtitle: { fontSize: 14, flex: 1, marginBottom: 5 },

  detalleTitleMain: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  detalleSubtitle: { fontSize: 15, fontWeight: '600' },
  detalleBase: { fontSize: 14, fontStyle: 'italic', marginTop: 6 },
  seccionDetalle: { marginBottom: 20 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  seccionTexto: { fontSize: 18, fontWeight: '500', lineHeight: 28 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 18, padding: 15, fontSize: 16 },
  primaryButton: { backgroundColor: '#4A5568', padding: 17, borderRadius: 999, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
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
  autoGenInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 8, fontSize: 14 },
});