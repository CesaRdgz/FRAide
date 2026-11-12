# Publicar FRAide web en GitHub Pages

Una sola vez (unos 10 minutos). Después, cada vez que subas cambios se publica sola.

## 0. Colocar el archivo de publicación

Mueve `docs\publicar.yml` a `.github\workflows\publicar.yml` (crea las dos carpetas; la primera empieza por punto).
Es el que compila y publica la web. No he podido dejarlo ahí yo: Windows protege las carpetas que empiezan por punto
frente a herramientas externas.

## 1. Crear el repositorio

1. En GitHub: **New repository**.
   - Nombre: `fraide` (la web quedará en `https://TU-USUARIO.github.io/fraide/`).
   - **Public** (GitHub Pages gratis solo funciona con repositorios públicos).
   - No marques README, .gitignore ni licencia: ya vienen en el proyecto.
2. Sube la carpeta `C:\Proyectos\FRAide-web` a ese repositorio, en la rama `main`
   (con SourceTree: *Create local repository* sobre la carpeta → commit → añade el remoto → push).

> Antes del primer commit, comprueba que **no** hay lecciones `.json` del libro dentro de la carpeta.
> El `.gitignore` ya excluye `node_modules/`, `dist/` y una carpeta `lecciones/` por si las guardas ahí.

## 2. Activar GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Ve a la pestaña **Actions**: verás «Publicar en GitHub Pages» en marcha (si no, pulsa *Run workflow*).
4. En 1-2 minutos estará en verde y la web en `https://TU-USUARIO.github.io/fraide/`.

Si el paso de tests falla, la web no se publica (así nunca se sube una versión rota).

## 3. Actualizar

Cambia lo que quieras, commit y push a `main`. Se vuelve a publicar sola.
Sube también la versión en `package.json` (`"version"`), que aparece en Ajustes → Acerca de.

## 4. Mensaje para la clase

```
💻 FRAide para el ordenador

La misma app de francés pero en el navegador, para quien no tenga Android:
👉 https://TU-USUARIO.github.io/fraide/

1. Ábrela en Chrome, Edge o Firefox (en el ordenador).
2. Elige el tamaño de letra y tu nombre.
3. Guarda en el ordenador los archivos .json de las lecciones que paso por el grupo
   y arrástralos a la ventana de FRAide (o Ajustes → Elegir archivos).

Tu progreso se guarda en ese navegador. De vez en cuando, Ajustes → Exportar progreso
para tener una copia. Si no se oye el francés: Configuración de Windows → Hora e idioma
→ Voz → Agregar voces → Français (France).

Es solo para la clase: las lecciones no las compartáis fuera 🙏
```

## Notas

- **Privacidad:** no hay servidor ni cuentas. Cada persona tiene sus datos solo en su navegador.
- **Lecciones nuevas:** pásalas por el grupo como siempre; el mismo `.json` vale para Android y para la web.
  Importar una lección que ya existe la actualiza sin perder el progreso.
- **Instalar como app (opcional):** en Chrome/Edge, icono de «Instalar» en la barra de direcciones.
