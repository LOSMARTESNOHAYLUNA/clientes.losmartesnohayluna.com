# LMNHL — Portal de Clientes

Portal privado de planes de contenidos para clientes de Los Martes No Hay Luna.

**URL:** https://clientes.losmartesnohayluna.com

## Estructura de carpetas

```
/               → Portal de acceso (index.html)
/sheila/        → Plan de contenidos Sheila Aguilar
/docrys/        → Plan de contenidos Docrys
/[cliente]/     → Añadir nueva carpeta por cada cliente nuevo
```

## Añadir un nuevo cliente

1. Crear carpeta `/nombre-cliente/`
2. Copiar `sheila/index.html` dentro y renombrarlo `index.html`
3. Adaptar el contenido al nuevo cliente
4. Añadir la tarjeta del cliente en el `index.html` raíz
5. Hacer commit y push → GitHub Pages lo despliega automáticamente

## Tecnología

HTML + CSS + JavaScript puro. Sin frameworks ni dependencias externas.  
Los datos se guardan en el `localStorage` del navegador de cada cliente.

## SVD — El Sistema Definitivo de Ventas

`/svd/index.html` es una única página para todos los clientes. Cada portal la abre desde el botón **SVD** de su barra de secciones con su identificador de Firestore:

```
https://clientes.losmartesnohayluna.com/svd/?c=CLIENT_ID
```

`CLIENT_ID` es el mismo valor que lleva el portal en `const CLIENT_ID='…'` (ojo: Lorenzo es `lorenzo`, no `lorenzoarquitectura`). Guarda en el mismo proyecto Firebase que los portales, dentro de `portales/{CLIENT_ID}/datos/`, con las claves `svd` (embudo en curso) y `svd_periodos` (periodos guardados). No requiere cambios en `firestore.rules`.

Para añadir el botón a un portal nuevo, en el `section-switcher` después del último `sec-btn`:

```js
React.createElement('a',{className:'sec-btn svd',href:'/svd/?c=CLIENT_ID',target:'_blank',rel:'noopener',title:'Tu Sistema Definitivo de Ventas'},
  React.createElement('span',{className:'sec-icon'},'📈'),
  'SVD'
)
```

y en el CSS, debajo de `.sec-btn:hover`:

```css
.sec-btn.svd{text-decoration:none;margin-left:auto;color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.3)}
```

### Reportes del SVD (Firebase Storage)
El bloque "Sube tus reportes" guarda los archivos en Firebase Storage, en `portales/{CLIENT_ID}/reportes/`, y la lista en Firestore con la clave `svd_reportes`. Requiere activar **Storage** en el proyecto `lmnhl-portales` y publicar `storage.rules` (lista de clientes, igual que en `firestore.rules`; al dar de alta un cliente nuevo, añadirlo en las dos). De los reportes en CSV o Excel el SVD lee columnas como Alcance, Impresiones, Clics, Sesiones, Leads, Conversiones, Resultados, Importe gastado o Compras y propone aplicarlas al embudo.
