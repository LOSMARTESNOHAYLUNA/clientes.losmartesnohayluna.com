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
