// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN COMPARTIDA DE LOS PORTALES DE CLIENTE (Firebase)
//
//  Este archivo se sube UNA SOLA VEZ a la RAÍZ del repositorio:
//     clientes.losmartesnohayluna.com/firebase-config.js
//  y lo leen los 8 portales. Si algún día cambia el proyecto de Firebase,
//  se edita aquí y no hay que tocar ningún portal.
//
//  Estos valores NO son secretos (van en el navegador por diseño): la
//  protección de los datos está en las reglas de Firestore, no en la clave.
//
//  Cómo conseguirlos:
//   · apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
//       Consola de Firebase → ⚙️ Configuración del proyecto → Tus apps →
//       app web (</>) → "Configuración del SDK" → Config.
//   · emailFn
//       La URL que imprime "firebase deploy --only functions" para sendEmail
//       (también en Consola de Firebase → Functions).
// ════════════════════════════════════════════════════════════════════════

window.LMNHL_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBnCsRvDFDyCvg-XMdYdTkpyAhjoNIZLGk",
    authDomain: "lmnhl-portales.firebaseapp.com",
    projectId: "lmnhl-portales",
    storageBucket: "lmnhl-portales.firebasestorage.app",
    messagingSenderId: "102995792261",
    appId: "1:102995792261:web:c6a62724ff4588f59bf4ec"
  },
  emailFn: "PEGAR_AQUI"
};
