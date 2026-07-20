import React, { useState, useEffect, createContext, useContext } from 'react';
import { Text, View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Switch, Modal, Share, Linking, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
  const colors = getColors(isDark);
  
  useEffect(() => { 
    if (maestro && maestro.equipo) {
      const soloNumeros = maestro.equipo.replace(/[^0-9]/g, '');
      setNuevoNumeroEquipo(soloNumeros);
    } 
  }, [maestro]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.textMain }]}>Editar Equipo</Text>
          <Text style={[styles.modalMessage, { color: colors.textSub }]}>Reasignar a {maestro?.nombre_usuario}</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} 
            value={nuevoNumeroEquipo} 
            onChangeText={(texto) => setNuevoNumeroEquipo(texto.replace(/[^0-9]/g, ''))} 
            placeholder="Ej. 2" 
            placeholderTextColor={colors.textSub}
            keyboardType="numeric" 
          />
          <View style={[styles.modalButtons, { marginTop: 20 }]}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]} onPress={onCancelar}>
              <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EFBC68' }]} onPress={() => { onGuardar(nuevoNumeroEquipo ? `Equipo ${nuevoNumeroEquipo}` : 'Sin equipo'); }}>
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
        setUsuarioLogin(''); setPinLogin('');
        navigation.replace('Grupos');
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
// PANTALLA 1: GRUPOS (El único lugar con botón de tema)
// ==========================================
function GruposScreen({ navigation }) {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const colors = getColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'center' }}>
        <View style={[styles.headerRowSpaceBetween, { width: '95%', maxWidth: 850 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textMain }]}>PROGRAMA CLASE DE NIÑOS INDUS</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Selecciona el grupo a impartir</Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 8 }}>
              <Feather name={isDark ? "sun" : "moon"} size={26} color={colors.textSub} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.gruposContainer, { width: '95%', maxWidth: 850 }]}>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#FFB7A1', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Temas', { grupo: 'Niños' })}>
            <Feather name="smile" size={32} color="#FFFFFF" style={styles.grupoIcon} />
            <Text style={styles.grupoTitleBlanco}>Niños</Text>
            <Text style={styles.grupoEdadBlanco}>3 a 6 años</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#EFBC68', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Temas', { grupo: 'Pre adolescentes' })}>
            <Feather name="users" size={32} color="#FFFFFF" style={styles.grupoIcon} />
            <Text style={styles.grupoTitleBlanco}>Pre adolescentes</Text>
            <Text style={styles.grupoEdadBlanco}>7 a 9 años</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#919F89', borderColor: 'transparent' }]} onPress={() => navigation.navigate('Temas', { grupo: 'Adolescentes' })}>
            <Feather name="book" size={32} color="#FFFFFF" style={styles.grupoIcon} />
            <Text style={styles.grupoTitleBlanco}>Adolescentes</Text>
            <Text style={styles.grupoEdadBlanco}>10 a 13 años</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.tablonButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => navigation.navigate('Tablon')}>
            <Feather name="clipboard" size={20} color={colors.textSub} />
            <Text style={[styles.tablonButtonText, { color: colors.textSub }]}>Solicitudes de Apoyo</Text>
          </TouchableOpacity>
        </View>

        {rolUsuarioActivoGlobal === 'administrador' && (
          <TouchableOpacity style={[styles.adminButton, { width: '95%', maxWidth: 850 }]} onPress={() => navigation.navigate('Admin')}>
            <Feather name="settings" size={16} color={colors.textSub} />
            <Text style={[styles.adminButtonText, { color: colors.textSub }]}>Panel Admin</Text>
          </TouchableOpacity>
        )}
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

    const { error } = await supabase.from('maestros').insert([{ nombre_usuario: usuarioGenerado, pin_acceso: pinGenerado, rol: rolFinal, equipo: equipoFinal }]);
    
    if(error) { setAlerta({ visible: true, titulo: "Error", mensaje: "El usuario ya existe.", onConfirmar: cerrarAlerta, isDark: isDark });
    } else {
      setAlerta({ visible: true, titulo: "¡Éxito!", mensaje: "Usuario registrado.", onConfirmar: cerrarAlerta, isDark: isDark });
      setNombreCompleto(''); setUsuarioGenerado(''); setPinGenerado(''); setNumeroEquipoAsignado(''); setEsAdmin(false); obtenerMaestros();
    }
    setGuardando(false);
  }

  async function guardarEdicion(equipoFinal) {
    setMaestroEditando(null);
    if(equipoFinal !== maestroEditando.equipo) { setEquipoSeleccionadoAdmin(null); await supabase.from('maestros').update({ equipo: equipoFinal }).eq('id', maestroEditando.id); obtenerMaestros(); }
  }

  async function confirmarEliminacion(maestro) {
    if (maestro.nombre_usuario === usuarioActivoGlobal) { return setAlerta({ visible: true, titulo: "Acción Denegada", mensaje: "No puedes dar de baja tu propia cuenta.", textoConfirmar: "Entendido", onConfirmar: cerrarAlerta, isDark: isDark }); }
    const { data } = await supabase.from('maestros').select('id').eq('equipo', maestro.equipo);
    const cantidadEnEquipo = data ? data.length : 0;
    let mensajeAlerta = `¿Estás seguro de eliminar a ${maestro.nombre_usuario}?`;
    if (maestro.equipo !== 'Sin equipo' && maestro.rol !== 'administrador') { mensajeAlerta += `

⚠️ El ${maestro.equipo} tiene ${cantidadEnEquipo} miembro(s).`; }

    setAlerta({ visible: true, titulo: "Dar de baja", mensaje: mensajeAlerta, textoConfirmar: "Eliminar", onCancelar: cerrarAlerta, isDark: isDark, onConfirmar: async () => { cerrarAlerta(); setEquipoSeleccionadoAdmin(null); await supabase.from('maestros').delete().eq('id', maestro.id); obtenerMaestros(); } });
  }

  const compartirAccesos = async (usuario, pin, equipo) => { try { await Share.share({ message: `¡Hola! Aquí tienes tus accesos.

👤 Usuario: ${usuario}
🔑 PIN: ${pin}
🛡️ Equipo: ${equipo}` }); } catch (error) {} };

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
        {!equipoSeleccionadoAdmin ? (
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
                <TouchableOpacity style={styles.actionBtnBlue} onPress={() => compartirAccesos(maestro.nombre_usuario, maestro.pin_acceso, maestro.equipo)}><Feather name="share-2" size={18} color={colors.textSub} /></TouchableOpacity>
                {maestro.rol !== 'administrador' && ( <TouchableOpacity style={styles.actionBtnGray} onPress={() => setMaestroEditando(maestro)}><Feather name="edit-2" size={18} color={colors.textSub} /></TouchableOpacity> )}
                <TouchableOpacity style={styles.actionBtnRed} onPress={() => confirmarEliminacion(maestro)}><Feather name="trash-2" size={18} color="#FFB7A1" /></TouchableOpacity>
              </View>
            ))}
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
            initialRouteName="Login"
            screenOptions={{
              headerShadowVisible: false, 
              headerTitleStyle: { fontFamily: 'serif', fontWeight: 'bold' },
              contentStyle: { backgroundColor: colors.background }
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Grupos" component={GruposScreen} options={{ headerShown: false }} />
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
