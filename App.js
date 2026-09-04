import React, { useState, useEffect, createContext, useContext } from 'react';
import { Text, View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Switch, Modal, Share, Linking, Platform, StatusBar, KeyboardAvoidingView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OneSignal from 'react-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conexión a Supabase
const supabaseUrl = 'https://clspbwuvzqnzkvnaafzo.supabase.co';
const supabaseKey = 'sb_publishable_QThR0YIh1opBm9vLBKrjCw_4cv3grQE';
const supabase = createClient(supabaseUrl, supabaseKey);

let usuarioActivoGlobal = null;
let rolUsuarioActivoGlobal = null;

// Contexto Global para el Tema
const ThemeContext = createContext();

// Paleta de Colores Dinámica
const getColors = (isDark) => ({
  background: isDark ? '#2C313C' : '#FFFFFF',
  cardBg: isDark ? '#3B424D' : '#FFFFFF',
  cardBorder: isDark ? '#4A5568' : '#C8CFD6',
  textMain: isDark ? '#FFFFFF' : '#2C313C',
  textSub: isDark ? '#A0AEC0' : '#4A5568',
  inputBg: isDark ? '#4A5568' : '#FFFFFF',
  inputBorder: isDark ? '#718096' : '#C8CFD6',
  inputText: isDark ? '#FFFFFF' : '#2C313C',
});

// Función para obtener el color dinámico del grupo
const getThemeColors = (grupo, isDark) => {
  switch(grupo) {
    case 'Niños': return { main: '#FFB7A1', textDark: isDark ? '#FFB7A1' : '#D96E53', bgLight: isDark ? 'rgba(255, 183, 161, 0.1)' : '#FFF0EC' }; 
    case 'Pre adolescentes': return { main: '#EFBC68', textDark: isDark ? '#EFBC68' : '#C48B29', bgLight: isDark ? 'rgba(239, 188, 104, 0.1)' : '#FDF6EB' }; 
    case 'Adolescentes': return { main: '#919F89', textDark: isDark ? '#919F89' : '#6A7A61', bgLight: isDark ? 'rgba(145, 159, 137, 0.1)' : '#EEF1ED' }; 
    default: return { main: '#4A5568', textDark: isDark ? '#A0AEC0' : '#4A5568', bgLight: isDark ? '#3B424D' : '#FFFFFF' }; 
  }
};

// Calcula si una fecha es Clase o Predicación según el día y horario
const calcularTipo = (fechaTexto, horario) => {
  const dia = new Date(fechaTexto + 'T00:00:00').getDay(); // 0 = domingo, 2 = martes, 4 = jueves
  if (dia === 0) {
    return (horario || '').includes('10') ? 'Clase' : 'Predicación';
  }
  return 'Clase';
};

const Stack = createNativeStackNavigator();

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
  const colors = getColors(isDark);
  
  useEffect(() => { 
    if (maestro) {
      const soloNumeros = (maestro.equipo || '').replace(/[^0-9]/g, '');
      setNuevoNumeroEquipo(soloNumeros);
      setNuevoTelefono(maestro.telefono || '');
    } 
  }, [maestro]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.textMain }]}>Editar Maestro</Text>
          <Text style={[styles.modalMessage, { color: colors.textSub }]}>{maestro?.nombre_usuario}</Text>

          <Text style={[styles.label, { color: colors.textSub, marginTop: 12 }]}>Número de equipo</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} 
            value={nuevoNumeroEquipo} 
            onChangeText={(texto) => setNuevoNumeroEquipo(texto.replace(/[^0-9]/g, ''))} 
            placeholder="Ej. 2" 
            placeholderTextColor={colors.textSub}
            keyboardType="numeric" 
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

          <View style={[styles.modalButtons, { marginTop: 20 }]}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]} onPress={onCancelar}>
              <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EFBC68' }]} onPress={() => { onGuardar({ equipo: nuevoNumeroEquipo ? `Equipo ${nuevoNumeroEquipo}` : 'Sin equipo', telefono: nuevoTelefono }); }}>
              <Text style={styles.modalConfirmText}>Guardar</Text>
            </TouchableOpacity>
          </View>
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
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '' });

  const cerrarAlerta = () => setAlerta({ ...alerta, visible: false });

  async function iniciarSesion() {
    if (!usuarioLogin || !pinLogin) return setAlerta({ visible: true, titulo: "Aviso", mensaje: "Ingresa tu usuario y PIN." });
    setIngresando(true);
    try {
      const { data, error } = await supabase.from('maestros').select('*').eq('nombre_usuario', usuarioLogin.trim()).eq('pin_acceso', pinLogin.trim()).single(); 
      if (error || !data) {
        setAlerta({ visible: true, titulo: "Acceso denegado", mensaje: "Usuario o PIN incorrectos." });
      } else {
        usuarioActivoGlobal = data.nombre_usuario;
        rolUsuarioActivoGlobal = data.rol;
        await AsyncStorage.setItem('sesionMaestro', JSON.stringify({ nombre_usuario: data.nombre_usuario, rol: data.rol }));
        OneSignal.login(data.nombre_usuario);
               setUsuarioLogin(''); setPinLogin('');
        navigation.replace('MenuPrincipal');
      }
    } catch (error) { setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo iniciar sesión." }); } finally { setIngresando(false); }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={[styles.loginBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Feather name="book-open" size={48} color={colors.textSub} style={{ alignSelf: 'center', marginBottom: 15 }} />
            <Text style={[styles.titleMini, { color: colors.textMain, textAlign: 'center' }]}>PROGRAMA CLASE DE NIÑOS INDUS</Text>
            <Text style={[styles.subtitle, { color: colors.textSub, textAlign: 'center', marginBottom: 30 }]}>Ingresa tus credenciales</Text>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>Usuario</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholderTextColor={colors.textSub} value={usuarioLogin} onChangeText={setUsuarioLogin} autoCapitalize="none"/>
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

    useFocusEffect(
    React.useCallback(() => {
      if (rolUsuarioActivoGlobal === 'administrador') { setTieneRol(true); return; }
      (async () => {
        const hoy = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('programa_servicios').select('id').ilike('nombre_usuario', usuarioActivoGlobal).gte('fecha', hoy);
        setTieneRol(data && data.length > 0);
      })();
    }, [])
  );

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('sesionMaestro');
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
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={confirmarCerrarSesion} style={{ padding: 8 }}>
            <Feather name="log-out" size={24} color={colors.textSub} />
          </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: 1.5, fontSize: 18, color: colors.textMain }}>INDUS</Text>
            <Text style={{ fontFamily: 'sans-serif', fontSize: 11, color: colors.textSub, marginTop: -2 }}>app</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={{ padding: 8 }}>
            <Feather name={isDark ? "sun" : "moon"} size={18} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        <View style={[styles.gruposContainer, { width: '95%', maxWidth: 850 }]}>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#EAF3F0', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Grupos')}>
            <Feather name="smile" size={32} color="#2F6E5E" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#2F6E5E' }]}>Clases de niños</Text>
          </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => tieneRol ? navigation.navigate('MiRol') : setAlerta({ visible: true, titulo: "Sin fecha asignada", mensaje: "No tienes ninguna fecha programada por ahora.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#2C4A73' })}
          >
            <Feather name={tieneRol ? "calendar" : "lock"} size={32} color={tieneRol ? "#2C4A73" : colors.textSub} style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: tieneRol ? "#2C4A73" : colors.textSub }]}>Rol de predicaciones</Text>
          </TouchableOpacity>
                    <TouchableOpacity style={[styles.card, { backgroundColor: '#FBEEDD', borderColor: 'transparent' }]} onPress={() => proximamente('#8A4F1E')}>
            <Feather name="volume-2" size={32} color="#8A4F1E" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#8A4F1E' }]}>Anuncios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#F1EDFA', borderColor: 'transparent' }]} onPress={() => proximamente('#5B4A8A')}>
            <Feather name="heart" size={32} color="#5B4A8A" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#5B4A8A' }]}>Petición de oración</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#FDEFEF', borderColor: 'transparent' }]} onPress={() => proximamente('#A34A4A')}>
            <Feather name="calendar" size={32} color="#A34A4A" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#A34A4A' }]}>Calendario de actividades</Text>
          </TouchableOpacity>
        </View>

        {rolUsuarioActivoGlobal === 'administrador' && (
          <TouchableOpacity style={[styles.adminButton, { width: '95%', maxWidth: 850 }]} onPress={() => navigation.navigate('Admin')}>
            <Feather name="settings" size={16} color={colors.textSub} />
            <Text style={[styles.adminButtonText, { color: colors.textSub }]}>Panel Admin</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
            <AlertaPersonalizada {...alerta} />
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: MI ROL
// ==========================================
function MiRolScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);
  const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const hoy = new Date().toISOString().split('T')[0];
            const { data } = await supabase.from('programa_servicios').select('*').ilike('nombre_usuario', usuarioActivoGlobal).gte('fecha', hoy).order('fecha', { ascending: true });
      setFechas(data || []);
      setCargando(false);
    })();
  }, []);

  const formatearFecha = (fechaTexto) => {
    const fecha = new Date(fechaTexto + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Mi rol</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Tus próximas fechas</Text>
          </View>
        </View>

        <View style={{ width: '95%', maxWidth: 850 }}>
          {cargando && <ActivityIndicator style={{ marginTop: 20 }} color={colors.textSub} />}
          {!cargando && fechas.length === 0 && (
            <Text style={{ color: colors.textSub, textAlign: 'center', marginTop: 20 }}>No tienes fechas próximas.</Text>
          )}
          {fechas.map((item) => {
                        const tipoCalculado = calcularTipo(item.fecha, item.horario);
            const esClase = tipoCalculado === 'Clase';
            const tintBg = esClase ? '#EDF2FA' : '#FBEAE0';
            const tintText = esClase ? '#3A5A8A' : '#A65A2E';
            return (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={esClase ? "calendar" : "mic"} size={18} color={tintText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textMain, textTransform: 'capitalize' }}>{formatearFecha(item.fecha)}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSub }}>{item.horario}</Text>
                </View>
                                <Text style={{ fontSize: 10, fontWeight: '500', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, backgroundColor: tintBg, color: tintText }}>{tipoCalculado}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA 1b: GRUPOS (clases de niños)
// ==========================================
function GruposScreen({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const colors = getColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>Clases de niños</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Selecciona el grupo a impartir</Text>
          </View>
        </View>

        <View style={[styles.gruposContainer, { width: '95%', maxWidth: 850 }]}>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#FFF0EC', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Temas', { grupo: 'Niños' })}>
            <Feather name="smile" size={32} color="#D96E53" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#D96E53' }]}>Niños</Text>
            <Text style={[styles.grupoEdadBlanco, { color: '#D96E53' }]}>3 a 6 años</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#FDF6EB', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Temas', { grupo: 'Pre adolescentes' })}>
            <Feather name="users" size={32} color="#C48B29" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#C48B29' }]}>Pre adolescentes</Text>
            <Text style={[styles.grupoEdadBlanco, { color: '#C48B29' }]}>7 a 9 años</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#EEF1ED', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Temas', { grupo: 'Adolescentes' })}>
            <Feather name="book" size={32} color="#6A7A61" style={styles.grupoIcon} />
            <Text style={[styles.grupoTitleBlanco, { color: '#6A7A61' }]}>Adolescentes</Text>
            <Text style={[styles.grupoEdadBlanco, { color: '#6A7A61' }]}>10 a 13 años</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.tablonButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => navigation.navigate('Tablon')}>
            <Feather name="clipboard" size={20} color={colors.textSub} />
            <Text style={[styles.tablonButtonText, { color: colors.textSub }]}>Solicitudes de Apoyo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  const [verFuturo, setVerFuturo] = useState(false);
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
        <View style={{ width: '95%', maxWidth: 850, flex: 1, paddingBottom: 20 }}>
          <View style={styles.headerRowSpaceBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titleMini, { color: colors.textMain }]}>TEMARIO</Text>
              <Text style={[styles.subtitle, { color: theme.textDark }]}>Grupo: {grupo}</Text>
            </View>
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, { color: colors.textSub }]}>Ver futuros</Text>
              <Switch trackColor={{ false: colors.cardBorder, true: theme.main }} thumbColor={"#FFFFFF"} onValueChange={setVerFuturo} value={verFuturo} />
            </View>
          </View>
          
          {cargando ? (
            <View style={styles.center}><ActivityIndicator size="large" color={theme.main} /></View>
          ) : (
            <View style={styles.listContainer}>
              {temasFiltrados.map((tema) => (
                <TouchableOpacity key={tema.id} style={[styles.card, styles.cardLight, { backgroundColor: theme.bgLight, borderColor: 'transparent' }]} onPress={() => navigation.navigate('Clases', { tema: tema, grupo: grupo })}>
                  <View style={styles.cardHeader}>
                    <View style={styles.textContainer}><Text style={[styles.topicTitle, { color: colors.textMain }]}>{tema.titulo_tema}</Text></View>
                    <Feather name="chevron-right" size={24} color={theme.main} />
                  </View>
                  <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                    <View style={styles.iconText}><Feather name="calendar" size={16} color={colors.textSub} /><Text style={[styles.monthText, { color: colors.textSub }]}>{tema.mes_anio}</Text></View>
                    <View style={styles.iconText}><Feather name="users" size={16} color={colors.textSub} /><Text style={[styles.teacherText, { color: colors.textSub }]}>{tema.equipo_asignado || 'Sin asignar'}</Text></View>
                  </View>
                </TouchableOpacity>
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
  const [cargando, setCargando] = useState(true);
  const theme = getThemeColors(grupo, isDark);
  const colors = getColors(isDark);

  useEffect(() => {
    async function obtenerClases() {
      const { data, error } = await supabase.from('clases_detalle').select('*').eq('tema_id', tema.id).eq('rango_edad', grupo).order('numero_clase', { ascending: true });
      if (!error && data) setClasesReales(data);
      setCargando(false);
    }
    obtenerClases();
  }, [tema.id, grupo]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: 850, flex: 1 }}>
        <View style={styles.headerSoloText}>
          <Text style={[styles.titleMini, { color: colors.textMain }]}>{tema.titulo_tema.toUpperCase()}</Text>
          <Text style={[styles.subtitle, { color: theme.textDark }]}>{tema.mes_anio} • {grupo}</Text>
        </View>
        {cargando ? (
          <View style={styles.center}><ActivityIndicator size="large" color={theme.main} /></View>
        ) : (
          <ScrollView style={styles.listContainer}>
            {clasesReales.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Feather name="book" size={40} color={colors.textSub} style={{ marginBottom: 15 }} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin lecciones</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Las clases para este mes aún no han sido cargadas.</Text>
              </View>
            ) : (
              clasesReales.map((clase) => (
                <TouchableOpacity key={clase.id} style={[styles.card, styles.cardLight, { backgroundColor: theme.bgLight, borderColor: 'transparent' }]} onPress={() => navigation.navigate('ClaseDetalle', { clase, tema, grupo })}>
                   <View style={styles.cardHeader}>
                      <View style={styles.textContainer}>
                        <Text style={[styles.topicTitle, { color: colors.textMain }]}>{clase.titulo_clase}</Text>
                        <Text style={[styles.topicSubtitle, { color: colors.textSub }]}>Domingo {clase.numero_clase}</Text>
                        {clase.texto_base && <Text style={{ fontSize: 13, color: colors.textSub, marginTop: 4, fontStyle: 'italic' }}>Base: {clase.texto_base}</Text>}
                      </View>
                      <Feather name="book-open" size={20} color={theme.main} />
                   </View>
                </TouchableOpacity>
              ))
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
          await supabase.from('solicitudes_sustitucion').insert([{ tema_id: tema.id, mes_anio: tema.mes_anio, titulo_tema: `${tema.titulo_tema} - ${clase.titulo_clase}`, grupo_clase: grupo, maestro_solicitante: usuarioActivoGlobal }]);
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
        <Text style={[styles.detalleTitleMain, { color: colors.textMain }]}>{clase.titulo_clase}</Text>
        <Text style={[styles.detalleSubtitle, { color: theme.main }]}>Domingo {clase.numero_clase} • {grupo}</Text>
        <Text style={[styles.detalleBase, { color: colors.textSub }]}>Base bíblica: {clase.texto_base}</Text>
        
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        <RenderSeccion titulo="Objetivo del Maestro" texto={clase.objetivo} />
        <RenderSeccion titulo="Puntos Clave" texto={clase.puntos_clave} />
        <RenderSeccion titulo="Bienvenida y Rompehielos (15 min)" texto={clase.rompehielos} />
        <RenderSeccion titulo="Introducción (10 min)" texto={clase.introduccion} />
        <RenderSeccion titulo="Historia Bíblica (25 min)" texto={clase.historia} />
        <RenderSeccion titulo="Puntos a Resaltar (15 min)" texto={clase.puntos_resaltar} />
        <RenderSeccion titulo="Versículo a Memorizar (15 min)" texto={clase.versiculo_memoria} />
        <RenderSeccion titulo="Actividad Sugerida (25 min)" texto={clase.actividad_sugerida} />

        <View style={{ flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <TouchableOpacity onPress={solicitarCobertura} style={[styles.solicitarBtnClaro, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
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
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: SOLICITUDES DE APOYO (TABLÓN)
// ==========================================
function TablonScreen() {
  const { isDark } = useContext(ThemeContext);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', onConfirmar: null, onCancelar: null, textoConfirmar: 'Aceptar' });
  const colors = getColors(isDark);

  useEffect(() => { obtenerSolicitudes(); }, []);

  function cerrarAlerta() { setAlerta({ ...alerta, visible: false }); }

  async function obtenerSolicitudes() {
    let { data } = await supabase.from('solicitudes_sustitucion').select('*').order('creado_en', { ascending: false });
    setSolicitudes(data || []);
    setCargando(false);
  }

  function cancelarSolicitud(solicitudId, grupoClase) {
    const theme = getThemeColors(grupoClase, isDark);
    setAlerta({
      visible: true, titulo: "Cancelar", mensaje: "¿Ya no necesitas el apoyo?", isDark: isDark, themeColor: theme.main,
      textoConfirmar: "Sí, cancelar", onCancelar: cerrarAlerta,
      onConfirmar: async () => { cerrarAlerta(); await supabase.from('solicitudes_sustitucion').delete().eq('id', solicitudId); obtenerSolicitudes(); }
    });
  }

  function aceptarSustitucion(solicitud) {
    const theme = getThemeColors(solicitud.grupo_clase, isDark);
    setAlerta({
      visible: true, titulo: "Confirmar", mensaje: `¿Aceptas apoyar con "${solicitud.titulo_tema}"?`, isDark: isDark, themeColor: theme.main,
      textoConfirmar: "Aceptar", onCancelar: cerrarAlerta,
      onConfirmar: async () => {
        cerrarAlerta();
        await supabase.from('solicitudes_sustitucion').update({ estado: 'Cubierta', maestro_suplente: usuarioActivoGlobal }).eq('id', solicitud.id);
        setTimeout(() => setAlerta({ visible: true, titulo: "¡Gracias!", mensaje: "Has sido asignado a esta clase.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: theme.main }), 500);
        obtenerSolicitudes(); 
      }
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <View style={{ width: '95%', maxWidth: 850, flex: 1, paddingBottom: 20 }}>
        <View style={styles.headerSoloText}>
          <Text style={[styles.titleMini, { color: colors.textMain }]}>SOLICITUDES DE APOYO</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Maestros que necesitan cobertura</Text>
        </View>
        {cargando ? <ActivityIndicator size="large" color={colors.textSub} style={{marginTop: 50}} /> : (
          <ScrollView style={styles.listContainer}>
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
                  <View key={solicitud.id} style={[styles.card, styles.cardLight, { backgroundColor: theme.bgLight, borderColor: 'transparent', opacity: solicitud.estado === 'Cubierta' ? 0.6 : 1 }]}>
                    <View style={styles.textContainer}>
                      <Text style={[styles.topicTitle, { color: colors.textMain }]}>{solicitud.maestro_solicitante} pide apoyo</Text>
                      <Text style={[styles.topicSubtitle, { color: theme.textDark, fontWeight: 'bold' }]}>Grupo: {solicitud.grupo_clase}</Text>
                      <Text style={[styles.topicSubtitle, { color: colors.textMain }]}>Clase: {solicitud.titulo_tema}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                      {solicitud.maestro_solicitante === usuarioActivoGlobal && solicitud.estado === 'Pendiente' && (
                         <TouchableOpacity style={[styles.cancelarButton, { borderColor: colors.cardBorder }]} onPress={() => cancelarSolicitud(solicitud.id, solicitud.grupo_clase)}><Text style={[styles.cancelarButtonText, { color: colors.textSub }]}>Cancelar</Text></TouchableOpacity>
                      )}
                      {solicitud.estado === 'Pendiente' ? (
                         <TouchableOpacity style={[styles.aceptarDiscreto, { backgroundColor: theme.main }]} onPress={() => aceptarSustitucion(solicitud)}><Text style={styles.aceptarDiscretoText}>Aceptar Apoyo</Text></TouchableOpacity>
                      ) : (
                         <Text style={{ color: theme.textDark, fontStyle: 'italic', padding: 8, fontWeight: 'bold' }}>Cubierta por {solicitud.maestro_suplente}</Text>
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
function AdminScreen() {
  const { isDark } = useContext(ThemeContext);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuarioGenerado, setUsuarioGenerado] = useState('');
  const [pinGenerado, setPinGenerado] = useState('');
  const [numeroEquipoAsignado, setNumeroEquipoAsignado] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);
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
  useEffect(() => { obtenerMaestros(); }, []);
  
  function cerrarAlerta() { setAlerta({ ...alerta, visible: false }); }

  const procesarNombre = (texto) => {
    setNombreCompleto(texto);
    const usuarioLimpio = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, '');
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
    const equipoFinal = esAdmin ? 'Administradores' : (numeroEquipoAsignado ? `Equipo ${numeroEquipoAsignado}` : 'Sin equipo');

    const { error } = await supabase.from('maestros').insert([{ nombre_usuario: usuarioGenerado, pin_acceso: pinGenerado, rol: rolFinal, equipo: equipoFinal, telefono: telefono }]);
    
    if(error) { setAlerta({ visible: true, titulo: "Error", mensaje: "El usuario ya existe.", onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: "¡Éxito!", mensaje: "Usuario registrado.", onConfirmar: cerrarAlerta, isDark: isDark });
      setNombreCompleto(''); setUsuarioGenerado(''); setPinGenerado(''); setNumeroEquipoAsignado(''); setTelefono(''); setEsAdmin(false); obtenerMaestros();
    }
    setGuardando(false);
  }

    async function guardarEdicion(datos) {
    setMaestroEditando(null);
    setEquipoSeleccionadoAdmin(null);
    await supabase.from('maestros').update({ equipo: datos.equipo, telefono: datos.telefono }).eq('id', maestroEditando.id);
    obtenerMaestros();
  }

  async function confirmarEliminacion(maestro) {
    if (maestro.nombre_usuario === usuarioActivoGlobal) { return setAlerta({ visible: true, titulo: "Acción Denegada", mensaje: "No puedes dar de baja tu propia cuenta.", textoConfirmar: "Entendido", onConfirmar: cerrarAlerta, isDark: isDark }); }
    const { data } = await supabase.from('maestros').select('id').eq('equipo', maestro.equipo);
    const cantidadEnEquipo = data ? data.length : 0;
    let mensajeAlerta = `¿Estás seguro de eliminar a ${maestro.nombre_usuario}?`;
    if (maestro.equipo !== 'Sin equipo' && maestro.rol !== 'administrador') { mensajeAlerta += `\n\n⚠️ El ${maestro.equipo} tiene ${cantidadEnEquipo} miembro(s).`; }

    setAlerta({ visible: true, titulo: "Dar de baja", mensaje: mensajeAlerta, textoConfirmar: "Eliminar", onCancelar: cerrarAlerta, isDark: isDark, onConfirmar: async () => { cerrarAlerta(); setEquipoSeleccionadoAdmin(null); await supabase.from('maestros').delete().eq('id', maestro.id); obtenerMaestros(); } });
  }

      const compartirWhatsApp = (usuario, pin, equipo, telefono) => {
    const numeroLimpio = (telefono || '').replace(/\D/g, '');
    if (!numeroLimpio) {
      setAlerta({ visible: true, titulo: "Sin número", mensaje: "Esta persona no tiene un número celular guardado.", onConfirmar: cerrarAlerta, isDark: isDark, themeColor: '#EFBC68' });
      return;
    }
    const mensaje = `¡Hola! Aquí tienes tus accesos.\n\n👤 Usuario: ${usuario}\n🔑 PIN: ${pin}\n🛡️ Equipo: ${equipo}`;
    Linking.openURL(`https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`);
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
    const { error } = await supabase.from('programa_servicios').insert(previaRol);
    setSubiendoRol(false);
    if (error) {
            setAlerta({ visible: true, titulo: "Error", mensaje: "No se pudo subir el rol: " + error.message, onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: "¡Éxito!", mensaje: `Se subieron ${previaRol.length} fechas correctamente.`, onConfirmar: cerrarAlerta, isDark: isDark });
      setPreviaRol([]);
    }
  };

  const maestrosPorEquipo = maestros.reduce((acc, maestro) => {
    let equipo = maestro.equipo || 'Sin equipo';
    if (maestro.rol === 'administrador') equipo = 'Administradores';
    if (!acc[equipo]) acc[equipo] = [];
    acc[equipo].push(maestro); return acc;
  }, {});
  
  const listaEquipos = Object.keys(maestrosPorEquipo).sort((a, b) => {
    if (a === 'Administradores') return -1; if (b === 'Administradores') return 1; return a.localeCompare(b);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, width: '100%', maxWidth: 850, alignSelf: 'center', paddingBottom: 30 }}>
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
        
        {!esAdmin && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Número de Equipo (Opcional)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} placeholder="Ej. 1" placeholderTextColor={colors.textSub} value={numeroEquipoAsignado} onChangeText={(texto) => setNumeroEquipoAsignado(texto.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
          </View>
        )}
        
        {usuarioGenerado !== '' && (
          <View style={[styles.autoGenBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.autoGenTitle, { color: colors.textSub }]}>Accesos que se crearán:</Text>
            <View style={styles.autoGenRow}><Text style={[styles.autoGenLabel, { color: colors.textSub }]}>Usuario:</Text><TextInput style={[styles.autoGenInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} value={usuarioGenerado} onChangeText={setUsuarioGenerado} /></View>
            <View style={styles.autoGenRow}><Text style={[styles.autoGenLabel, { color: colors.textSub }]}>PIN (4 dígitos):</Text><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><TextInput style={[styles.autoGenInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, flex: 1 }]} value={pinGenerado} onChangeText={setPinGenerado} keyboardType="numeric" maxLength={4} /><TouchableOpacity onPress={generarNuevoPin} style={{ padding: 10 }}><Feather name="refresh-cw" size={18} color={colors.textSub} /></TouchableOpacity></View></View>
          </View>
        )}
        
        <TouchableOpacity style={styles.primaryButton} onPress={registrarMaestro}>{guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar</Text>}</TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
               <Text style={[styles.topicTitle, { color: colors.textMain }]}>Equipos y Usuarios</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, marginBottom: 15 }]}
          placeholder="Buscar usuario por nombre..."
          placeholderTextColor={colors.textSub}
          value={busquedaUsuario}
          onChangeText={setBusquedaUsuario}
        />

        {busquedaUsuario.trim() !== '' ? (
          <View>
            {maestros.filter(m => m.nombre_usuario.toLowerCase().includes(busquedaUsuario.trim().toLowerCase())).map((maestro) => (
              <View key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}><Text style={[styles.userTextName, { color: colors.textMain }]}>{maestro.nombre_usuario} {maestro.nombre_usuario === usuarioActivoGlobal && "(Tú)"}</Text><Text style={[styles.userTextPin, { color: colors.textSub }]}>PIN: {maestro.pin_acceso} • {maestro.equipo || 'Sin equipo'}</Text></View>
                <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirWhatsApp(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo, maestro.telefono)}><Feather name="share-2" size={18} color={colors.textSub} /></TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}><Feather name="edit-2" size={18} color={colors.textSub} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}><Feather name="trash-2" size={18} color="#FFB7A1" /></TouchableOpacity>
              </View>
            ))}
          </View>
        ) : !equipoSeleccionadoAdmin ? (
          <View>
            <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Selecciona un equipo para ver a sus miembros.</Text>
            {listaEquipos.map((equipo, index) => (
              <TouchableOpacity key={index} style={[styles.equipoFolder, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => setEquipoSeleccionadoAdmin(equipo)}>
                <Feather name={equipo === 'Administradores' ? "shield" : "folder"} size={24} color={colors.textSub} />
                <View style={{ marginLeft: 15, flex: 1 }}><Text style={[styles.equipoFolderTitle, { color: colors.textMain }]}>{equipo}</Text><Text style={[styles.equipoFolderSub, { color: colors.textSub }]}>{maestrosPorEquipo[equipo].length} miembro(s)</Text></View>
                <Feather name="chevron-right" size={20} color={colors.textSub} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.backToEquiposBtn} onPress={() => setEquipoSeleccionadoAdmin(null)}><Feather name="arrow-left" size={18} color={colors.textSub} /><Text style={[styles.backToEquiposText, { color: colors.textSub }]}>Volver a todos los equipos</Text></TouchableOpacity>
            <Text style={[styles.topicTitle, { color: '#EFBC68', marginTop: 10 }]}>{equipoSeleccionadoAdmin}</Text>
            {(maestrosPorEquipo[equipoSeleccionadoAdmin] || []).map((maestro) => (
              <View key={maestro.id} style={[styles.userRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}><Text style={[styles.userTextName, { color: colors.textMain }]}>{maestro.nombre_usuario} {maestro.nombre_usuario === usuarioActivoGlobal && "(Tú)"}</Text><Text style={[styles.userTextPin, { color: colors.textSub }]}>PIN: {maestro.pin_acceso}</Text></View>
                                <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirWhatsApp(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo, maestro.telefono)}><Feather name="share-2" size={18} color={colors.textSub} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}><Feather name="edit-2" size={18} color={colors.textSub} /></TouchableOpacity>                <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}><Feather name="trash-2" size={18} color="#FFB7A1" /></TouchableOpacity>
              </View>
            ))}
                 </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.topicTitle, { color: colors.textMain }]}>Cargar Rol (Clases y Predicaciones)</Text>
        <Text style={[styles.topicSubtitle, { color: colors.textSub, marginBottom: 15 }]}>Sube el archivo CSV con las fechas del periodo.</Text>

        {Platform.OS === 'web' && (
          <input type="file" accept=".csv" onChange={manejarArchivoCSV} style={{ marginBottom: 15, color: colors.textMain }} />
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
  const [isDark, setIsDark] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [rutaInicial, setRutaInicial] = useState('Login');

   // Inicializa OneSignal por su cuenta, sin bloquear el resto de la app si falla
  useEffect(() => {
    OneSignal.init({
      appId: "a598b3d5-0064-4124-bf93-2543c79a9922"
    }).then(() => {
      OneSignal.Slidedown.promptPush();
    }).catch((e) => {
      console.error('OneSignal no se pudo inicializar:', e);
    });
  }, []);

  // Revisa la sesión guardada por su cuenta, sin esperar a OneSignal
  useEffect(() => {
    (async () => {
      try {
        const guardada = await AsyncStorage.getItem('sesionMaestro');
        if (guardada) {
          const { nombre_usuario, rol } = JSON.parse(guardada);
          usuarioActivoGlobal = nombre_usuario;
          rolUsuarioActivoGlobal = rol;
          try { OneSignal.login(nombre_usuario); } catch (e) { console.error('OneSignal.login falló:', e); }
          setRutaInicial('MenuPrincipal');
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
  
  const toggleTheme = () => setIsDark(!isDark);
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
        <NavigationContainer theme={MyTheme}>
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
            <Stack.Screen name="Grupos" component={GruposScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MiRol" component={MiRolScreen} options={{ title: 'Mi rol' }} />
            <Stack.Screen name="Temas" component={TemasScreen} options={{ title: '' }} />
            <Stack.Screen name="Clases" component={ClasesScreen} options={{ title: 'Lecciones' }} />
            <Stack.Screen name="ClaseDetalle" component={ClaseDetalleScreen} options={{ title: 'Clase' }} />
            <Stack.Screen name="Tablon" component={TablonScreen} options={{ title: 'Apoyo' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel de Control' }} />
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
  title: { fontSize: 22, letterSpacing: 1, fontFamily: 'serif', fontWeight: 'bold', marginRight: 10 },
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
  card: { borderRadius: 16, padding: 20 },
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
  input: { borderWidth: 1, borderRadius: 10, padding: 15, fontSize: 16 },
  primaryButton: { backgroundColor: '#4A5568', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  solicitarBtnClaro: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 15, borderRadius: 10, justifyContent: 'center' },
  solicitarBtnClaroText: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  tablonButton: { marginTop: 10, borderWidth: 1, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  tablonButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  aceptarDiscreto: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10 },
  aceptarDiscretoText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  cancelarButton: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelarButtonText: { fontWeight: 'bold', fontSize: 13 },
  emptyState: { padding: 30, alignItems: 'center', borderWidth: 1, borderRadius: 16, marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxWidth: 400, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'center' },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginRight: 10, borderWidth: 1 },
  modalCancelText: { fontWeight: 'bold', fontSize: 15 },
  modalConfirmBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  modalConfirmText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  divider: { height: 1, marginVertical: 25 },
  
  equipoFolder: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 18, borderRadius: 12, marginBottom: 12 },
  equipoFolderTitle: { fontSize: 16, fontWeight: 'bold' },
  equipoFolderSub: { fontSize: 13, marginTop: 2 },
  backToEquiposBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
  backToEquiposText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, padding: 15, borderRadius: 10, marginBottom: 10 },
  userTextName: { fontSize: 16, fontWeight: 'bold' },
  userTextPin: { fontSize: 13, marginTop: 2 },
  actionBtnBlue: { padding: 10, backgroundColor: 'rgba(74, 85, 104, 0.2)', borderRadius: 8, marginLeft: 6 },
  actionBtnGray: { padding: 10, backgroundColor: 'rgba(74, 85, 104, 0.2)', borderRadius: 8, marginLeft: 6 },
  actionBtnRed: { padding: 10, backgroundColor: 'rgba(255, 183, 161, 0.2)', borderRadius: 8, marginLeft: 6 },
  
  autoGenBox: { borderWidth: 1, padding: 15, borderRadius: 10, marginBottom: 20 },
  autoGenTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 },
  autoGenRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  autoGenLabel: { width: 100, fontSize: 14, fontWeight: '500' },
  autoGenInput: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 8, fontSize: 14 }
});
